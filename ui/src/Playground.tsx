'use client'
import { editor as monaco } from 'monaco-editor';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useDebounce } from 'usehooks-ts'
import { Area } from './shared/Area';
import { Spin } from './shared/Spin'
import { useEditor } from './shared/Editor';
import { CodeError } from './shared/Alert';
import { getLanguage } from 'rete-studio-core';
import { CopyCode } from './shared/CopyCode';
import { Editor } from '@monaco-editor/react';

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 2fr 3fr;
  grid-template-areas:
    'source result'
    'canvas canvas';
  gap: 0.6em;
  padding: 0.6em;
  box-sizing: border-box;
  overflow: hidden;
  @media (max-height: 500px) {
    grid-template-columns: minmax(300px, 1fr) 3fr;
    grid-template-rows: 1fr 1fr;
    grid-template-areas:
      'source canvas'
      'result canvas';
  }
  @media (max-width: 400px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 2fr 1fr;
    grid-template-areas:
      'source'
      'canvas'
      'result';
  }
`

const Source = styled(Area)`
  grid-area: source;
  position: relative;
`

const Result = styled(Area)`
  grid-area: result;
  position: relative;
`

const Canvas = styled(Area)`
  grid-area: canvas;
  position: relative;
`

export function Playground({ lang, switchLang }: { switchLang: React.ReactNode, lang: string }) {
  const [code, setCode] = useState<string | undefined>()
  const debouncedCode = useDebounce(code, 500)
  const editor = useEditor({ lang, code: debouncedCode })

  useEffect(() => {
    const language = lang && getLanguage(lang)

    if (!language) return
    setCode(language.playgroundExample)
  }, [lang])

  const options: monaco.IStandaloneEditorConstructionOptions = {
    minimap: {
      enabled: false,
    },
    padding: { top: 10 }
  }

  return (
    <Layout>
      <Source>
        <Editor
          theme="vs-dark"
          language="javascript"
          value={code}
          onChange={setCode}
          options={options}
        />
        {switchLang}
        {editor.codeToGraph.status && <CodeError message={editor.codeToGraph.status?.message} placement="right" />}
      </Source>
      <Result>
        <Spin spinning={editor.graphToCode.loading} />
        <Editor
          theme="vs-dark"
          language="javascript"
          value={editor.code}
          options={{ readOnly: true, ...options }}
        />
        <CopyCode value={editor.executableCode || ''} />
        {editor.graphToCode.status && <CodeError message={editor.graphToCode.status?.message} placement="right" />}
      </Result>
      <Canvas>
        <Spin spinning={editor.codeToGraph.loading} size="large" />
        {editor.canvas}
      </Canvas>
    </Layout>
  )
}
