
import { message } from 'antd'
import React from 'react'
import styled from 'styled-components'

const Container = styled.div`
  white-space: nowrap;
  max-width: 100%;
  overflow: auto;

  &::-webkit-scrollbar {
    width: 5px;
    height: 6px;
    background: rgba(0, 0, 0, 0.1);
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 10px;
  }
`

const Button = styled.button`
  font-family: 'Montserrat', sans-serif;
  margin: 0 0.2em;
  background: rgba(150, 150, 150, 0.5);
  border-radius: 1em;
  border: none;
  color: white;
  font-size: 0.65em;
  &:hover {
    background: rgba(150, 150, 150, 0.7);
  }
`

type Props = {
  transformerNames: string[]
  loadSnapshot: (name: string) => void | Promise<void>
}

export function TransformersList(props: Props) {
  const [messageApi, contextHolder] = message.useMessage({ top: 20 });

  async function interceptError(f: () => void | Promise<void>) {
    try {
      await f()
    } catch (e) {
      console.error(e)
      messageApi.error((e as Error).message)
    }
  }

  return (
    <Container>
      {contextHolder}
      {props.transformerNames.map(name => (
        <Button
          key={name}
          onClick={() => interceptError(() => props.loadSnapshot(name))}>
            {name}
        </Button>)
      )}
    </Container>
  )
}
