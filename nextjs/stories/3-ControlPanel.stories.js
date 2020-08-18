import React, { useState } from 'react'
import { action } from '@storybook/addon-actions'

import ControlPanel from '../components/ControlPanel'

export default {
  title: 'ControlPanel',
  component: ControlPanel
}

export const Playground = () => {
  const width = 400
  const height = 400

  const stamp = new Date().toISOString()
  const [values, setValues] = useState([{ stamp, value: 100 }])

  const onDrag = ({ movement, last }) => {
    setValues([{ stamp, value: movement[0] }])
    // action('dragged')(JSON.stringify({ movement, last }))
  }
  const add = async ({ value, stamp }) => {
    if (Math.random() > 0.5) {
      action('add:error')(JSON.stringify({ value, stamp }))
      throw new Error('Random error for testing')
    } else {
      action('add')(JSON.stringify({ value, stamp }))
    }
    return { ETag: '"MD5_withQuotes"' }
  }

  return (
    <div style={{ height: 600, color: 'gray', background: 'black', fontFamily: 'sans-serif' }}>
      <h2>{JSON.stringify({ height, width })}</h2>

      <div
        style={{
          border: '1px solid green',
          width,
          height,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <ControlPanel
          width={400}
          height={height}
          values={values}
          onDrag={onDrag}
          add={add}
        />
      </div>

    </div>
  )
}
