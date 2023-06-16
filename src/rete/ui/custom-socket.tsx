/* eslint-disable @typescript-eslint/ban-ts-comment */
import styled from 'styled-components'
import { Socket } from '../nodes'

const $socketmargin = 8
const $socketsize = 20

const Styles = styled.div`
    display: inline-block;
    cursor: pointer;
    border: 1px solid white;
    border-radius: ${$socketsize / 2.0}px;
    width: ${$socketsize}px;
    height: ${$socketsize}px;
    vertical-align: middle;
    background: #ffffff47;// #e8e8e8;
    z-index: 2;
    box-sizing: border-box;
    &:hover {
      border-width: 4px;
    }
    &.multiple {
      border-color: yellow;
    }
`

const Hoverable = styled.div`
    border-radius: ${($socketsize + $socketmargin * 2) / 2.0}px;
    padding: ${$socketmargin}px;
    display: inline-flex;
    &:hover ${Styles} {
      border-width: 4px;
    }
`

export function CustomSocket<T extends Socket>(props: { data: T }) {
  return (
    // @ts-ignore
    <Hoverable>
      {/* @ts-ignore */}
      <Styles title={props.data.name} />
    </Hoverable>
  )
}

const Svg = styled.svg`
  stroke: white;
  fill: #ffffff47;
  stroke-width: 1px;
  stroke-linejoin: round;
  :hover {
    stroke-width: 5px;
  }
`


export function ControlSocketComponent<T extends Socket>(_props: { data: T }) {
  return (
    // @ts-ignore
    <Hoverable>
      {/* @ts-ignore */}
      <Svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 25 24" width={$socketsize} height={$socketsize}>
        <path d="M0,0 L10,0 L20,10 L10,20 L0,20 Z" />
      </Svg>
    </Hoverable>
  )
}
