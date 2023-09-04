'use client'

import styled from 'styled-components';
import { Theme } from 'rete-studio-ui';

export const Layout = styled.div<{ headless?: boolean }>`
  display: grid;
  grid-template-rows: ${props => !props.headless ? 'auto 1fr' : '1fr'};
  background: ${Theme.tokens?.colorBgBase};
  height: 100vh;
  width: 100vw;
  overflow-x: hidden;
`
