import { css } from 'styled-components'
import { Presets as ReactPresets, Drag } from 'rete-react-plugin'
import { Node, selectedShadow } from './custom-node'
import { InputControl, InputType, InsertControl, SelectControl, inputTypes } from '../nodes'
import { useEffect, useState } from 'react'
import { Button, ConfigProvider, Input, InputNumber, Popover, Segmented, Select } from 'antd'
import { components, tokens } from './theme'

export * as ContextMenu from './context-menu'
export { Node } from './custom-node'
export type { NodeComponent } from './custom-node'
export { CustomSocket, ControlSocketComponent } from './custom-socket'

export function StatementNode(props: any) {
  return <Node
    {...props}
    styles={() => css`
      .title {
          background: radial-gradient(50% 90%, #30b4249e 0%,transparent 80%);
      }
      /* background: #769fadb3; */
      /* border-color: #b4cdd5; */
    `}
  />
}

export function FrameNode(props: any) {
  return <Node
    {...props}
    styles={() => css`
      box-shadow: ${(props: any) => props.selected ? selectedShadow : 'inset 0 -0.7px 0px rgb(255 255 255 / 61%), inset 0 1px 2px rgb(0 0 0 / 56%)'};
      background-color: hsla(0,0%,6%,.35);
      .glossy {
        display: none;
      }
      .title {
        background: none;
      }
    `}
  />
}

export function InnerPortNode(props: any) {
  return <Node
    {...props}
    styles={() => css`
      border: none;
      background: transparent;
      box-shadow: none;
      pointer-events: none;
      .title, .glossy {
        display: none;
        /* visibility: hidden; */
      }
      .input-socket, .output-socket, .controls, .output-control, .input-control {
        pointer-events: all;
      }
    `}
  />
}


export function UnknownNode(props: any) {
  return <Node
    {...props}
    styles={() => css`opacity: 0.7;`}
  />
}

export function ReferenceConnection(props: any) {
  return <ReactPresets.classic.Connection
    {...props}
    styles={() => css`
      opacity: 0.6;
      stroke-width: 0.12em;
      stroke: #faff0080;
    `}
  />
}

export function StatementConnection(props: any) {
  return <ReactPresets.classic.Connection
    {...props}
    styles={() => css`
      stroke-width: 0.12em;
      stroke-dasharray: 1.5em 0.5em;
      stroke: #ffffffc7;
      animation: dash 0.4s linear infinite;
      stroke-dashoffset: 2em;
      @keyframes dash {
        to {
          stroke-dashoffset: 0;
        }
      }
    `}
  />
}

export function ExpressionConnection(props: any) {
  return <ReactPresets.classic.Connection
    {...props}
    styles={() => css`
      stroke-width: 0.07em;
      stroke: #ffffff;
    `}
  />
}

const typeColors: Record<InputType, string> = {
  identifier: '#dee22d',
  text: '#ee7b41',
  number: '#b4ff7e',
  boolean: '#499aeb',
  null: '#888888',
  bigint: '#888888'
}

function Themed(props: { color: string, children: any }) {
  return (
    <ConfigProvider theme={{
      token: {
        ...tokens,
        colorPrimary: props.color,
        colorBorder: props.color,
        controlOutline: props.color
      },
      components
    }}>
      {props.children}
    </ConfigProvider>
  )
}

function SwitchType(props: { type: InputType, children: JSX.Element, allowed?: InputType[], onChange: (type: InputType) => void }) {
  if (props.allowed && props.allowed.length === 1) return props.children

  const options = inputTypes
    .filter(item => !props.allowed || props.allowed.includes(item.value))
    .map(item => {
      const label = <span style={{ color: typeColors[item.value] }}>{item.label}</span>

      return { ...item, label }
    })

  return (
    <Popover
      content={<Segmented
        value={props.type}
        options={options}
        onChange={value => props.onChange(value as InputType)}
      />}
      trigger='hover'
      placement='right'
    >
      {props.children}
    </Popover>
  )
}


export function InputControlComponent(props: { data: InputControl }) {
  const dataType = props.data.options?.type || 'text'
  const dataValue = props.data.value ?? null
  const [type, setType] = useState<InputType>('text')
  const [value, setValue] = useState<any>()
  const allowedTypes = props.data.options?.allowedTypes
  const color = type ? typeColors[type] : 'white'

  function changeType(type: InputType) {
    setType(type)
    props.data.options = { ...props.data.options, type }
    props.data.setValue(value)

    if (type === 'number') {
      changeValue(typeof value === 'bigint' ? Number(value) : parseFloat(value) || 0)
    } else if (type === 'boolean') {
      changeValue(false)
    } else if (type === 'null') {
      changeValue(null)
    } else if (type === 'bigint') {
      changeValue(0n)
    } else if (type === 'text') {
      changeValue(String(value))
    }
  }
  function changeValue(value: any) {
    setValue(value)
    props.data.setValue(value)
  }

  useEffect(() => {
    setType(dataType)
  }, [dataType])
  useEffect(() => {
    setValue(dataValue)
  }, [dataValue])

  if (type === 'boolean') {
    return (
      <Drag.NoDrag>
        <Themed color={color}>
          <SwitchType type={type} onChange={changeType} allowed={allowedTypes}>
            <Select
              style={{ width: '90px' }}
              value={value}
              options={[
                { label: 'true', value: true },
                { label: 'false', value: false },
              ]}
              onChange={value => {
                setValue(value)
                props.data.setValue(value)
              }}
            />
          </SwitchType>
        </Themed>
      </Drag.NoDrag>
    )
  }
  if (type === 'number') {
    return (
      <Drag.NoDrag>
        <Themed color={color}>
          <SwitchType type={type} onChange={changeType} allowed={allowedTypes}>
            <InputNumber
              style={{ width: '90px' }}
              value={value}
              onChange={value => {
                changeValue(value)
              }}
            />
          </SwitchType>
        </Themed>
      </Drag.NoDrag>
    )
  }
  if (type === 'bigint') {
    return (
      <Drag.NoDrag>
        <Themed color={color}>
          <SwitchType type={type} onChange={changeType} allowed={allowedTypes}>
            <InputNumber
              style={{ width: '90px' }}
              value={value}
              onChange={value => {
                changeValue(String(value))
              }}
            />
          </SwitchType>
        </Themed>
      </Drag.NoDrag>
    )
  }
  if (type === 'text') {
    return (
      <Drag.NoDrag>
        <Themed color={color}>
          <SwitchType type={type} onChange={changeType} allowed={allowedTypes}>
            <Input
              style={{ width: '90px' }}
              value={value}
              onChange={event => {
                changeValue(event.target.value)
              }}
            />
          </SwitchType>
        </Themed>
      </Drag.NoDrag>
    )
  }
  if (type === 'null') {
    return (
      <Drag.NoDrag>
        <Themed color={color}>
          <SwitchType type={type} onChange={changeType} allowed={allowedTypes}>
            <Input
              style={{ width: '90px' }}
              value={'null'}
              readOnly
            />
          </SwitchType>
        </Themed>
      </Drag.NoDrag>
    )
  }
  if (type === 'identifier') {
    return (
      <Drag.NoDrag>
        <Themed color={color}>
          <SwitchType type={type} onChange={changeType} allowed={allowedTypes}>
            <Input
              style={{ width: '90px' }}
              value={value}
              onChange={event => {
                changeValue(event.target.value)
              }}
            />
          </SwitchType>
        </Themed>
      </Drag.NoDrag>
    )
  }
  throw new Error(`Unknown type ${type}`)
}

export function CustomInput(props: any) {
  return <ReactPresets.classic.Control
    {...props}
    styles={() => css`
      font-size: 17px;
      background: #ffffff1f;
      color: white;
      font-family: 'Montserrat',sans-serif;
      font-weight: 300;
      width: 70px;
      max-width: 100%;
      :focus {
        outline: none;
        border-color: white;
        background: #ffffff42;
      }
    `}
  />
}

export function InsertButton(props: { data: InsertControl }) {

  return (
    <Drag.NoDrag>
      <Themed color="white">
        <Button onClick={() => props.data.options.onClick(props.data)}>+</Button>
      </Themed>
    </Drag.NoDrag>
  )
}

export function SelectComponent(props: { data: SelectControl }) {
  const [value, setValue] = useState(props.data.value)

  useEffect(() => {
    setValue(props.data.value)
  }, [props.data.value])

  return (
    <Drag.NoDrag>
      <Themed color="white">
        <Select
          style={{ margin: '0 auto', display: 'block', width: '90px' }}
          value={value}
          options={props.data.options}
          onChange={value => {
            setValue(value)
            props.data.change(value)
          }}
        />
      </Themed>
    </Drag.NoDrag>
  )
}
