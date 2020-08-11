import React, { useState } from 'react'
import { useDrag } from 'react-use-gesture'
import { animated } from 'react-spring'
import useDimensions from 'react-use-dimensions'

// width: the Width of the control Surface
// big -> adding Observation
export default function DragCanvas ({ style, width, big: isArc, onZ, onDelta }) {
  //  bug report: L10-11: https://github.com/Swizec/useDimensions/blob/master/src/index.ts
  const [ref, { x: left, y: top /* width,height */ }] = useDimensions()

  // not using `set` from useSpring
  // const [{ xy }] = useSpring(() => ({ xy: [0, 0] }))

  // event and coordinates in svg space, for use in Specialized Drawing components
  const [svgSpace, setSvgSpace] = useState({ })
  const [z, setZ] = useState({ })

  const fromViewPort = ([x, y], { left, top }) => {
    return [x - left, y - top]
  }

  // This is where the transformations happen
  // -For outside interaction, we only provide onDelta({down,delta})
  // For Drawing we provide z state variable
  const bind = useDrag(({ down, initial, xy, movement }) => {
    const lt = { left, top } // from useDimensions

    const componentSpace = { down, initial: fromViewPort(initial, lt), xy: fromViewPort(xy, lt), movement }

    const svgSpc = {
      down,
      initial: vpToSvg(componentSpace.initial),
      xy: vpToSvg(componentSpace.xy),
      movement: scale(componentSpace.movement, vp2svgScale) // no offset, just scale
    }
    const zzz = {
      viewport: componentSpace,
      svg: svgSpc
    }
    setSvgSpace(svgSpc)

    // Do the delta calculations
    // delta has range [-1,1]
    // for anchor-zoom :
    zzz.delta = clipAbs1(zzz.svg.movement[0] / 2)

    // for arc-slider
    // angle with initial and right corner
    {
      const { initial, xy } = zzz.svg
      // pick the corner from for quadrant of initial point
      const corner = (initial[0] * initial[1] > 0)
        ? [1, -1] // right corner
        : [-1, -1] // left corner

      // angles go from 180..90 (right corner)
      // angles go from 0..90 (left corner)
      const angleI = Math.atan2(initial[1] - corner[1], initial[0] - corner[0])
      const angleXY = Math.atan2(xy[1] - corner[1], xy[0] - corner[0])

      // what we export
      zzz.angleI = angleI //* 180 / Math.PI
      zzz.angleXY = angleXY //* 180 / Math.PI
      // deltaA: -.5...5 // left corner
      // deltaA: -.5...5 // right corner, but sign reversed
      zzz.deltaA = (angleXY - angleI) / Math.PI
      zzz.corner = corner
      // normalize(0-1) and flip for right corner
      const flip = (initial[0] * initial[1] > 0) ? -1 : 1
      zzz.deltaArc = clipAbs1(flip * (angleXY - angleI) * 2 / Math.PI)
    }

    setZ(zzz)
    if (onZ) {
      onZ({ down, delta: zzz.delta, deltaArc: zzz.deltaArc })
    }
    if (onDelta) {
      onDelta({ down, delta: zzz.delta })
    }
  })

  const opa = 1
  const thick = 0.01
  const clr = 'rgba(255,255,255,.2)'

  const scale = ([x, y], [a, b]) => {
    return [a * x, b * y]
  }
  const add = ([x1, y1], [x2, y2]) => {
    return [x1 + x2, y1 + y2]
  }
  const vp2svgScale = [2 / width, -2 / width]

  const vpToSvg = (xy) => {
    return add(scale(xy, vp2svgScale), [-1, 1])
  }
  const clipAbs1 = (v) => Math.max(-1, Math.min(1, v))

  const AnchorZoom = ({ down, freq, xy }) => {
    const gradient = 'url("#whiteGradient")'

    return (
      <g
        fill='none'
        strokeWidth={thick}
        stroke={clr}
      >
        {/* the dashed x axis */}
        <g strokeDasharray={0.05}>
          <polyline points='-1,0 1,0' opacity={opa} />
        </g>

        {down && (
          <g>
            {/* current drag position */}
            <circle cx={xy[0]} cy={xy[1]} r={thick * 40} stroke='none' fill={gradient} />

            {/* The sine wave */}
            <g
              stroke='rgba(128, 128, 255, 0.8)' strokeWidth={thick}
              strokeDasharray={0.05}
              transform='translate(1,0) scale(-2,1)'
            >
              <Sine amplitude={0.5} freq={freq} />
            </g>
          </g>
        )}
      </g>

    )
  }

  const ArcSlide = ({ down, deltaA, corner, initial, xy, angleI, angleXY }) => {
    if (!down) {
      return (
        <g
          fill='none'
          strokeWidth={thick}
          stroke={clr}
        >
          <g strokeDasharray={0.05}>
            {/* two reference arcs */}
            <circle cx='1' cy='-1' r='2' />
            <circle cx='-1' cy='-1' r='2' />
          </g>
        </g>
      )
    }
    const gradient = 'url("#whiteGradient")'
    const largeArcFlag = 0
    const sweepFlag = (deltaA && deltaA > 0) ? 1 : 0
    // projected onto circle
    // const pI = [Math.cos(angleI) + corner[0], Math.sin(angleI) + corner[1]]
    const pI = add(scale([Math.cos(angleI), Math.sin(angleI)], [2, 2]), corner)
    const pXY = add(scale([Math.cos(angleXY), Math.sin(angleXY)], [2, 2]), corner)
    return (
      <g
        fill='none'
        strokeWidth={thick}
        stroke={clr}
      >

        <g strokeDasharray={0.05}>
          {/* two reference arcs */}
          <circle cx='1' cy='-1' r='2' />
          <circle cx='-1' cy='-1' r='2' />
        </g>

        {/* anchor for arc (corner) */}
        <circle cx={corner[0]} cy={corner[1]} r={thick * 10} fill='rgba(255,255,255,.5)' />

        {/* line from corner to current */}
        <line x1={corner[0]} y1={corner[1]} x2={xy[0]} y2={xy[1]} stroke='gray' strokeDasharray={0.05} />

        <g>
          {/* drawn arc segment (not filled) */}
          <path
            d={`M ${pI[0]} ${pI[1]}
        A 2 2 0 ${largeArcFlag} ${sweepFlag} ${pXY[0]} ${pXY[1]}
       `} fill='none' stroke='rgba(128, 128, 255,1)'
          />

          {/* filled in arc */}
          <path
            d={`M ${corner[0]} ${corner[1]}
        L ${pI[0]} ${pI[1]}
        A 2 2 0 ${largeArcFlag} ${sweepFlag} ${pXY[0]} ${pXY[1]}
        Z
       `} fill='rgba(255,255,0,.1)' stroke='none'
          />
        </g>
        {/* current drag position */}
        <circle cx={xy[0]} cy={xy[1]} r={thick * 40} stroke='none' fill={gradient} />
      </g>)
  }

  const Dragging = () => {
    const down = (z && z.viewport && z.viewport.down)
    const { initial, xy } = z.svg || {}
    const { delta, corner, deltaA, angleI, angleXY } = z
    const freq = 3 + 2 * delta // freq: 1..5
    if (isArc) {
      return (
        <ArcSlide {...{ down, deltaA, corner, initial, xy, angleI, angleXY }} />
      )
    } else {
      return (
        <AnchorZoom {...{ down, xy, freq }} />
      )
    }
  }

  return (
    <div style={{
      ...style,
      width,
      height: width
    }}
    >
      <animated.div
        {...bind()}
        ref={ref}
        style={{
          // not used as we never 'set' xy
          // transform: xy.interpolate((x, y) => `translate3d(${x}px, ${y}px, 0)`)
        }}
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='-1 -1 2 2'
        >
          <defs>
            <radialGradient id='whiteGradient'>
              <stop offset='0%' stop-color='rgba(255,255,255,.8)' />
              {/* <stop offset='50%' stop-color='rgba(255,255,255,1)' /> */}
              <stop offset='100%' stop-color='rgba(255,255,255,0)' />
            </radialGradient>
          </defs>
          <g transform='scale(1,-1)'>
            <g transform='scale(1)'>
              <rect x='-1' y='-1' width='2' height='2' fill='rgba(0,0,255,.1)' />
              <Dragging />
            </g>
          </g>
        </svg>
      </animated.div>
    </div>
  )
}

// generate a sine curve {x,a*sin(x*2PI/period) | x in 0,1}
function Sine ({ amplitude = 1, freq = 1 }) {
  const points = Array.from(Array(100), (_, i) => {
    const x = i / 100
    return [x, amplitude * Math.sin(freq * x * 2 * Math.PI)]
  }).map(([x, y]) => `${x},${y}`).join(' ')
  return <polyline points={points} />
}