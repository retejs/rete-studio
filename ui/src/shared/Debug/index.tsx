
import React from 'react'
import styled from 'styled-components'

import { TransformersList } from './TransformersList'

const Container = styled.div`
  position: absolute;
  bottom: 0;
  left: 3em;
  z-index: 1;
  width: calc(100% - 6em);
`

const DebugSection = styled('div')`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0.5em 0;
`

const DebugTitle = styled('h3')`
  font-size: 0.7em;
  color: white;
  text-align: center;
  margin: 0.3em 0;
  text-orientation: sideways;
  writing-mode: vertical-rl;
  position: sticky;
  left: 0;
  top: 0;
`

type Props = {
  transformerNames: string[]
  loadSnapshot: (direction: 'up' | 'down', transformerName: string) => void | Promise<void>
}

export function Debug(props: Props) {
  return (
    <Container>
      <DebugSection>
        <DebugTitle>up</DebugTitle>
        <TransformersList
          transformerNames={props.transformerNames}
          loadSnapshot={name => props.loadSnapshot('up', name)}
        />
      </DebugSection>
      <DebugSection>
        <DebugTitle>down</DebugTitle>
        <TransformersList
          transformerNames={props.transformerNames}
          loadSnapshot={name => props.loadSnapshot('down', name)}
        />
      </DebugSection>
    </Container>
  )
}
