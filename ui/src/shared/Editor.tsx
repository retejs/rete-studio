import { BugOutlined, CodeFilled, LayoutFilled } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import React, { useCallback, useEffect, useState } from 'react'
import { useRete } from 'rete-react-plugin';
import { LanguageAdapter, LanguageSnippet } from 'rete-studio-core';
import styled from 'styled-components'

import { delay } from '../delay';
import { createEditor } from '../editor'
import { Theme } from '../theme';

const SaveButton = styled(Button)`
  position: absolute !important;
  top: 1em;
  right: 1em;
  z-index: 1;
`
const LayoutButton = styled(Button)`
  position: absolute !important;
  bottom: 1em;
  right: 1em;
  z-index: 1;
`
const DebugButton = styled(Button)`
  position: absolute !important;
  bottom: 1em;
  left: 1em;
  z-index: 1;
`

const Debug = styled.div`
  position: absolute;
  bottom: 0;
  left: 3em;
  z-index: 1;
  width: calc(100% - 6em);
  button {
    font-family: Monserrat, sans-serif;
    margin: 0 0.2em;
    background: rgba(150, 150, 150, 0.5);
    border-radius: 1em;
    border: none;
    color: white;
    font-size: 0.8em;
    &:hover {
      background: rgba(150, 150, 150, 0.7);
    }
  }
  .list {
    white-space: nowrap;
    max-width: 100%;
    overflow: auto;
  }

  .list::-webkit-scrollbar {
    width: 5px;
    height: 6px;
    background: rgba(0, 0, 0, 0.1);
  }
  .list::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 10px;
  }
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

function useTask(props: { execute: () => unknown | Promise<unknown>, fail: () => unknown | Promise<unknown> }) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  return {
    loading,
    status,
    async execute() {
      try {
        setLoading(true)
        setStatus(null)
        await props.execute()
      } catch (e) {
        await props.fail()
        setStatus({ type: 'error', message: (e as Error).message })
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
  }
}

export function useEditor(props: { lang: LanguageAdapter, code: string | undefined, autoCode?: boolean }) {
  const [snippets, setSnippets] = useState<LanguageSnippet[]>([])
  const create = useCallback((container: HTMLElement) => {
    return createEditor(container, snippets, props.lang)
  }, [createEditor, snippets, props.lang])
  const [ref, editor] = useRete(create)
  const [code, setCode] = useState<string | undefined>()
  const [executableCode, setExecutableCode] = useState<undefined | string>()
  const [isDebug, setDebug] = useState(false)

  useEffect(() => {
    props.lang.getSnippets().then(setSnippets)
  }, [props.lang])

  useEffect(() => {
    if (code && editor) {
      editor.codeToExecutable(code).then(setExecutableCode)
    } else setExecutableCode(undefined)
  }, [code, editor])

  const codeToGraph = useTask({
    async execute() {
      if (!editor || !props.code) return
      await Promise.all([
        delay(400),
        editor.codeToGraph(props.code)
      ])
    },
    fail: () => editor?.clear()
  })
  const graphToCode = useTask({
    async execute() {
      if (!editor) return

      const [, code] = await Promise.all([
        delay(400),
        editor.graphToCode()
      ])

      setCode(code)
    },
    fail: () => setCode('// can\'t transpile graph into code')
  })

  useEffect(() => {
    if (props.code && editor) {
      void async function () {
        await codeToGraph.execute()
        if (props.autoCode !== false) await graphToCode.execute()
      }()
    }

  }, [editor, props.code])

  const [transformerNames, setTransformerNames] = useState<string[] | undefined>()

  useEffect(() => {
    if (editor) editor.debug.getTransformerNames().then(setTransformerNames)
  }, [editor])

  return {
    codeToGraph,
    graphToCode,
    code,
    executableCode,
    canvas: (
      <Theme>
        {isDebug && transformerNames && <Debug>
          <DebugSection>
            <DebugTitle>up</DebugTitle>
            <div className='list'>
              {transformerNames.map(name => <button key={name} onClick={() => editor?.debug.graphFromSnapshot('up', name)}>{name}</button>)}
            </div>
          </DebugSection>
          <DebugSection>
            <DebugTitle>down</DebugTitle>
            <div className='list'>
              {transformerNames.map(name => <button key={name} onClick={() => editor?.debug.graphFromSnapshot('down', name)}>{name}</button>)}
            </div>
          </DebugSection>
        </Debug>}
        <Tooltip placement="top" title="Debug mode">
          <DebugButton onClick={() => setDebug(!isDebug)} icon={<BugOutlined />} />
        </Tooltip>
        <Tooltip placement="bottom" title="To code">
          <SaveButton onClick={graphToCode.execute} icon={<CodeFilled />} />
        </Tooltip>
        <Tooltip placement="top" title="Layout">
          <LayoutButton onClick={() => editor?.layout()} icon={<LayoutFilled />} />
        </Tooltip>
        <div ref={ref} style={{ height: '100%', width: '100%' }} />
      </Theme>
    )
  }
}
