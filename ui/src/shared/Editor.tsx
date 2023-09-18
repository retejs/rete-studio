import React from 'react'
import { useCallback, useEffect, useState } from 'react';
import { CodeFilled, LayoutFilled } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import styled from 'styled-components'
import { useRete } from 'rete-react-plugin';
import { createEditor } from '../editor'
import { delay } from '../delay';
import { Language } from 'rete-studio-core';
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

export function useEditor(props: { lang: Language<any, any, any>, code: string | undefined, autoCode?: boolean }) {
  const create = useCallback((container: HTMLElement) => {
    return createEditor(container, props.lang)
  }, [createEditor, props.lang])
  const [ref, editor] = useRete(create)
  const [code, setCode] = useState<string | undefined>()
  const [executableCode, setExecutableCode] = useState<undefined | string>()

  useEffect(() => {
    if (code && editor) {
      editor.toExecutable(code).then(setExecutableCode)
    } else setExecutableCode(undefined)
  }, [code, editor])

  const codeToGraph = useTask({
    async execute() {
      if (!editor || !props.code) return
      await Promise.all([
        delay(400),
        editor.loadCode(props.code)
      ])
    },
    fail: () => editor?.clear()
  })
  const graphToCode = useTask({
    async execute() {
      if (!editor) return

      const [, code] = await Promise.all([
        delay(400),
        editor.toCode()
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

  return {
    codeToGraph,
    graphToCode,
    code,
    executableCode,
    maxStep: editor?.maxStep,
    stepNames: editor?.stepNames || [],
    getCurrentStep: () => editor?.getCurrentStep() ?? -1,
    startStepByStep: editor?.startStepByStep,
    currentGraphToCode: editor?.currentGraphToCode,
    stepDown: editor?.stepDown,
    stepUp: editor?.stepUp,
    canvas: (
      <Theme>
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
