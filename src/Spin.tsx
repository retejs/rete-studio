import { Spin as AntSpin } from 'antd'
import styled from 'styled-components'

export const Spin = styled(AntSpin)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* background: rgb(0 0 0 / 50%); */
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`
