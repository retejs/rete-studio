// import React from 'react'
import { Spin as AntSpin } from 'antd'
import styled from 'styled-components'

export const Spin = styled(AntSpin)`
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  /* background: rgb(0 0 0 / 50%); */
  z-index: 2;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  pointer-events: none !important;
`
