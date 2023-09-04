// import React from 'react'
import { Presets } from 'rete-react-plugin';
import styled, { css } from 'styled-components';
import { contextMenuToken } from './theme';


const base = css`
  color: ${contextMenuToken?.colorText} !important;
  background: ${contextMenuToken?.colorBgBase} !important;
  font-family: ${contextMenuToken?.fontFamily};
  font-size: 0.85rem;
  border: 1px solid ${contextMenuToken?.colorBorder} !important;
  transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);

  &:hover {
    background: ${contextMenuToken?.colorBgBase} !important;
    color: ${contextMenuToken?.colorPrimaryHover} !important;
    border-color: ${contextMenuToken?.colorPrimaryHover} !important;
  }
`

export const Menu = styled(Presets.contextMenu.Menu)`
  width: 12em;
`
export const Item = styled(Presets.contextMenu.Item)`
  ${base}
`
export const Common = styled(Presets.contextMenu.Common)`
  ${base}
`

export const Search = styled(Presets.contextMenu.Search)`
  ${base}
`

export const Subitems = styled(Presets.contextMenu.Subitems)`
`
