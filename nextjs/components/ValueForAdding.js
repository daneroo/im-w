import React, { useState } from 'react'
import moment from 'moment'
import useTheme from './useTheme'
import { Check, Reset } from './ButtonsSVG'

// We only pass in value
// but stamp is managed locally
export default function ValueForAdding ({ value, reset = () => {}, add = async ({ value, stamp }) => {}, style }) {
  const { theme: { colors: { primary, secondary } } } = useTheme()

  const [errorMsg, setErrorMsg] = useState(null)
  const [stamp, setStamp] = useState(null)
  const hasStamp = stamp !== null

  // TODO(daneroo): here is where I could round this off, but better in useDeltaDrag
  const onSubmit = async () => {
    try {
      setErrorMsg(null) // clear previous error, if present
      const data = await add({ value, stamp })
      console.log('ValueForAdding got', data)
    } catch (error) {
      setErrorMsg(error.toString())
    }
  }
  const onReset = () => {
    setErrorMsg(null)
    setStamp(null)
    reset()
  }
  const localTimeForPicker = (stamp) => {
    return moment(stamp).local().format('YYYY-MM-DDTHH:mm')
  }
  // console.log({ stamp, local: localTimeForPicker(stamp) })

  const onStampChange = (e) => {
    const nuStampLocal = e.target.value
    const nuStampUTC = moment(nuStampLocal).utc().toISOString()
    console.log({ nuStampLocal, nuStampUTC })
    setStamp(nuStampUTC)
  }
  return (
    <div
      style={{
        ...style,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around', // center
        alignItems: 'center'
      }}
      >
        <div style={{ margin: '0 1rem' }}>
          <Reset onClick={onReset} />
        </div>
        <div style={{
          color: secondary,
          textAlign: 'center',
          minWidth: '10rem',
          padding: '0.5rem',
          fontSize: '3rem',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.2,
          fontWeight: 600,
          border: `2px solid ${primary}`,
          borderRadius: '1rem'
        }}
        >{Number(value).toFixed(1)}
        </div>
        <div style={{ margin: '0 1rem' }}>
          <Check onClick={onSubmit} />
        </div>

      </div>
      {hasStamp ? (
        <input type='datetime-local' value={localTimeForPicker(stamp)} onChange={onStampChange} />
      ) : (
        <div
          onClick={() => setStamp(new Date().toISOString())}
          style={{ fontStyle: 'italic', fontWeight: 'bold' }}
        >
          Now
        </div>
      )}
      {errorMsg && (
        <>
          <div style={{ color: 'red' }}>{errorMsg}</div>
          <div style={{ color: 'red' }}>click reset and try again</div>
        </>
      )}
    </div>
  )
}
