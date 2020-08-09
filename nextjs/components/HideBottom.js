import React from 'react'

// applies position:relative to parent. and absolute to children
// you must giv us sizes
export default function HideBottom ({ style, children }) {
  return (
    <div
      style={{
        ...style,
        overflow: 'hidden',
        position: 'relative'
      }}
    >

      {React.Children.map(children, (child, i) => {
        if (!child) return (<></>) // for when we pass in empty fragments..
        return React.cloneElement(child, { style: { ...child.props.style, position: 'absolute' } })
      })}
    </div>
  )
}