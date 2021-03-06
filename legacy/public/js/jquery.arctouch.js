// based on Stefan Gabos jquery boilerplate
// author: Daniel Lauzon
(function($) {
  $.arctouch = function(element, options) {
    var plugin = this;

    var $element = $(element);  // reference to the jQuery version of DOM element the plugin is attached to
    var $canvas = null;
    
	  var defaults = {
      setter: null, // setter(delta01)
      getter:null, // getter()-> initial dragValue
      swipeThreshHoldMS:500
    }

    // the "constructor" method that gets called when the object is created
    plugin.init = function() {
      plugin.settings = $.extend({}, defaults, options);

      var canvases=$element.find('canvas');
      var canvas = null
      if (canvases.length<1){
        canvas = $("<canvas />")[0];
        $element.append(canvas);
      } else {
        canvas = canvases[0];
      }
      $canvas = $(canvas);
      var size = {width: $element.width(), height: $element.height()};
      var maxWidth = 320;

      size.width = 320;//Math.min(size.width,maxWidth);
      console.log('size',size);
      console.log('setting canvas size attr and css');
      // html attr
      $(canvas).attr(size);
      // css style attr
      $(canvas).css(size);

      // set the initial state
      $canvas.bind('mousedown', mousedown);
      $canvas.bind('mousemove', mousemove);
      $canvas.bind('mouseout', mouseout);
      $canvas.bind('mouseup', mouseup);
      $canvas.bind('touchstart', touchstart);
      $canvas.bind('touchmove', touchmove);
      $canvas.bind('touchend', touchend);
      drawGrid(true);
    }

    var state=null; // line|arcleft,arcright, up|down
    var ctx=null;

    // == utility functions ==

    // could be something else...
    var getProp = function(){
      if (!plugin.settings.getter) return 100;
      return plugin.settings.getter()
    };
    var setProp = function(){
      if (!plugin.settings.setter) return;
      var delta01 = (ctx.state[1]=='down')?ctx.delta-1:ctx.delta
      plugin.settings.setter(ctx.p,delta01);
      return;
      // set the new prop
      //if (isNAN)...
      var r=1/plugin.settings.round;
      p=Math.round(p*r)/r;
      $element.text(p);
    };
    // the is the value the touch-drag session is tracking
    var trackTouch = function (e) {
      return {
        x:e.originalEvent.touches[0]['pageX'],
        y:e.originalEvent.touches[0]['pageY']
      };
    };
    var trackMouse = function (e) {
      return {
        x:e['pageX'],
        y:e['pageY']
      }
    };
    // this is the new value we are 'emiting'
    var updatedProp = function(ctx){
      var dx = (ctx.l.x - ctx.v.x);
      var dy = (ctx.l.y - ctx.v.y);
      var mag = Math.sqrt(dx*dx+dy*dy);
      mag = Math.max(0,Math.min(mag,plugin.settings.range));
      var sign= (Math.abs(dx)>Math.abs(dy))
        ? (dx<0?-1:1)  // positive is right
        : (dy<0?1:-1); // positive is up

      var newProp = ctx.p + sign * mag * plugin.settings.scale;
      return newProp;
    };

    var setState = function(canvas){
      if (!ctx) return; // cause we are called from drawGrid on init
      if (ctx.state) return;
      var off = $canvas.offset();
      var origin = {x:off.left,y:off.top};
      var poi = {x:(ctx.v.x-origin.x),y:(ctx.v.y-origin.y)};
      var row=Math.floor(poi.y/canvas.height*3);
      var col=Math.floor(poi.x/canvas.width*3);
      console.log('row,col',row,col,poi,canvas);
      var state = [[
         // top row
         ['lthumb','down'],
         ['vert','down'],
         ['rthumb','down']
       ],[
       // middle row
         ['horiz','up'],
         ['edit','none'],
         ['horiz','down']
       ],[
       // bottom row
         ['rthumb','up'],
         ['vert','up'],
         ['lthumb','up']
      ]][row][col];
      console.log('setting state',state);
      ctx.state=state;
    }
    var map01 = function(pos01,canvas){
      var w=canvas.width,h=canvas.height;
      return {
        x:pos01.x*w,
        y:pos01.y*h
      };
    }
    var gridLine = function(x,y,cctx,canvas){
      var from = map01({x:x||0, y:y||0},canvas);
      var to   = map01({x:x||1, y:y||1},canvas);
      cctx.moveTo(from.x,from.y);
      cctx.lineTo(to.x,to.y);
    }
    function norm(p,scale){
      var l = Math.sqrt(p.x*p.x+p.y*p.y);
      return {x:p.x/l*scale,y:p.y/l*scale};
    }
    
    var hintColor = function(){
      return 'rgba(128,128,128,0.4)';
      return 'transparent';
    }
    var gridColor = function(){
      // return 'transparent';
      return 'rgba(128,128,0,0.1)';
    }    
    
    var arcLines = function(poi,cctx,canvas) {
      // cctx.arc(x,y,radius,startAngle,endAngle, clockwise);
      var pi=Math.PI;
      var radius = Math.min(canvas.width,canvas.height);
      var xOffset = (radius < canvas.width) ? canvas.width - radius : 0;


      var c,delta,clr;

      var isLthumb=poi && ctx.state[0]=='lthumb';
      clr= isLthumb?'yellow':hintColor();
      cctx.strokeStyle =clr;
      cctx.fillStyle = clr;
      cctx.beginPath();
      c={x:xOffset,y:radius};
      cctx.arc(c.x,c.y,radius,-pi/2,0,false);
      cctx.stroke();
      if (isLthumb){
        delta={x:poi.x-c.x,y:poi.y-c.y};
        delta = norm(delta,radius);
        var d = -2*Math.atan2(delta.y,delta.x)/pi;
        ctx.delta= d; // min/max deadRange        

        // line on arc
        cctx.beginPath();
        cctx.moveTo(c.x,c.y);
        cctx.lineTo(c.x+delta.x,c.y+delta.y);
        cctx.stroke();      
        cctx.beginPath();
        cctx.arc(c.x+delta.x,c.y+delta.y,5,0,2*pi,false);
        cctx.fill();
        
      }

      var isRThumb=poi && ctx.state[0]=='rthumb';
      clr= isRThumb?'orange':hintColor();
      cctx.strokeStyle =clr;
      cctx.fillStyle = clr;
      cctx.beginPath();
      c={x:radius,y:radius};
      cctx.arc(c.x,c.y,radius,-pi,-pi/2,false);
      cctx.stroke();
      if (isRThumb){
        delta={x:poi.x-c.x,y:poi.y-c.y};
        delta = norm(delta,radius);
        var d = 2+2*Math.atan2(delta.y,delta.x)/pi;
        ctx.delta= d; // min/max deadRange        

        // line on arc
        cctx.beginPath();
        cctx.moveTo(c.x,c.y);
        cctx.lineTo(c.x+delta.x,c.y+delta.y);
        cctx.stroke();      
        cctx.beginPath();
        cctx.arc(c.x+delta.x,c.y+delta.y,5,0,2*pi,false);
        cctx.fill();

      }

      var isVert=poi && ctx.state[0]=='vert';
      clr= isVert?'cyan':hintColor();
      cctx.strokeStyle =clr;
      cctx.fillStyle = clr;
      cctx.beginPath();
      gridLine(1/2,null,cctx,canvas);
      cctx.stroke();
      if (isVert){
        var d = 1-poi.y/canvas.height;
        ctx.delta= d; // min/max deadRange        
        cctx.beginPath();
        cctx.arc(canvas.width/2,poi.y,5,0,2*pi,false);
        cctx.fill();
      }

      var isHoriz=poi && ctx.state[0]=='horiz';
      clr= isHoriz?'magenta':hintColor();
      cctx.strokeStyle =clr;
      cctx.fillStyle = clr;
      cctx.beginPath();
      gridLine(null,1/2,cctx,canvas);
      cctx.stroke();
      if (isHoriz){
        var d = poi.x/canvas.width;
        ctx.delta= d; // min/max deadRange        
        cctx.beginPath();
        cctx.arc(poi.x,canvas.height/2,5,0,2*pi,false);
        cctx.fill();
      }
      
      var isEdit=poi && ctx.state[0]=='edit';
      if (isEdit){
        // call out with event...
        ctx.delta= 0; // min/max deadRange        
      }
      // blue dot
      if (poi) {
        cctx.fillStyle = 'rgba(0,0,255,.4)';
        cctx.beginPath();
        cctx.arc(poi.x,poi.y,30,0,2*pi,false);
        cctx.fill();
      }
      
    }

    var drawGrid = function(isEnd){
      var canvas=$canvas[0];
      setState(canvas);
      var off = $canvas.offset();
      var origin = {x:off.left,y:off.top};
      if (canvas.getContext) {  
        var w=canvas.width,h=canvas.height;
        var cctx = canvas.getContext("2d");
        cctx.save();
        cctx.clearRect(0,0,w,h);
        
        cctx.save();
        cctx.strokeStyle = gridColor();
        cctx.lineWidth=8;
        cctx.beginPath();
        gridLine(1/3,null,cctx,canvas);
        gridLine(2/3,null,cctx,canvas);
        gridLine(null,1/3,cctx,canvas);
        gridLine(null,2/3,cctx,canvas);
        cctx.stroke();
        cctx.restore();

        var poi = (ctx && !isEnd)?{x:(ctx.l.x-origin.x),y:(ctx.l.y-origin.y)}:null;
        //console.log('poi',poi.x,poi.y,ctx.state);
        arcLines(poi,cctx,canvas);
        
        cctx.restore();
        
      } else {
        console.log('no context');
      }
      
    }

    // == common event handlers ==
    var dragstart = function(valueToTrack) {
      console.log('start:v ',JSON.stringify(valueToTrack));
      ctx = {
        t: +new Date, // stamp for drag start
        v: valueToTrack,        // the initial touch-event value we are tracking
        l: valueToTrack,        // the last known touch-event value
        p: getProp(), // initial property value (touchstart)
      };
      console.log('dragstart',ctx);
      drawGrid();
    };

    var dragmove = function(valueToTrack) {
      if (!ctx) return; // will happen when mousemove without mousedown first
      //console.log('move:v ',JSON.stringify(valueToTrack));

      // update the context
      ctx.l = valueToTrack;
      // update the ui
      drawGrid();
      setProp();
    };

    // snap back or click
    var dragend = function() {
      if (!ctx) return; // should never happen
      console.log('end:v ',JSON.stringify(ctx.l));

      var elapsed=new Date()-ctx.t;
      // consider this a click
      if (elapsed<plugin.settings.swipeThreshHoldMS){
        //snapBack(ctx.p,'away');
        console.log('swipe',updatedProp(ctx));
      } else {
        setProp(updatedProp(ctx));
      }
      //console.log('dragend',ctx);      
      drawGrid(true);
      ctx=null;
    }

    // == event callbacks ==
    var mousedown = function(e) {
      var valueToTrack = trackMouse(e);
      dragstart(valueToTrack);
    }

    var mousemove = function(e) {
      var valueToTrack = trackMouse(e);
      dragmove(valueToTrack);
    }

    var mouseout = function(e) {
      mouseup();
    }

    var mouseup = function(e) {
      dragend();
    }

    var touchstart = function(e) {
      var valueToTrack = trackTouch(e);
      dragstart(valueToTrack);
    };

    var touchmove = function(e) {
      var valueToTrack = trackTouch(e);
      dragmove(valueToTrack);
    };

    var touchend = function(e) {
      	dragend();
    };
       
    // call our "constructor" method
    plugin.init();

  }

  // add the plugin to the jQuery.fn object
  $.fn.arctouch = function(options) {
    // iterate through the DOM elements we are attaching the plugin to
    return this.each(function() {
      // if plugin has not already been attached to the element
      if (undefined == $(this).data('arctouch')) {
        var plugin = new $.arctouch(this, options);
        $(this).data('arctouch', plugin);
      }
    });
  }
})(jQuery);
