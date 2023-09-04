'use client'
import { Button, Steps as AntSteps } from 'antd'
import { CodeFilled } from '@ant-design/icons';
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import styled from 'styled-components';
import { useEffect, useRef, useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import type { editor as monacoEditor } from 'monaco-editor';
import { Area, CodeError, CopyCode, Spin, useEditor } from 'rete-studio-ui';
import { useDebounce } from 'usehooks-ts';
import ClientLayout from '../client-layout'
import { useLang } from '@/shared/Lang';
import dynamic from 'next/dynamic';
import { examplesMap, flatExamples } from './examples';

const Explorer = dynamic(() => import('./Explorer').then(res => res.Explorer), { ssr: false })
const Switch = dynamic(() => import('antd').then(res => res.Switch), { ssr: false }) // fix hydration error

const ExplorerArea = styled(Area)`
  grid-area: explorer;
  background: #1e1e1e;
  overflow: hidden;
  position: relative;
  padding: 0.5em 0;
`

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 4fr;
  grid-template-rows: 2fr 3fr;
  grid-template-areas: 'explorer editor' 'canvas canvas';
  padding: 0.6em;
  gap: 0.6em;
  overflow: hidden;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 2fr 3fr;
    grid-template-areas: 'explorer' 'editor' 'canvas';
  }
`

const Canvas = styled(Area)`
  grid-area: canvas;
  position: relative;
`

const Editor = styled(Area)`
  grid-area: editor;
  position: relative;
`


const StepByStep = styled.div`
  border-radius: 6px;
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 1em;
  display: flex;
  flex-direction: column;
  max-height: 100%;
`

const Steps = styled.div`
  padding: 0 1em;
`

function useDiffEditorSync(value: string, onChange: (value: string) => void) {
  const editorRef = useRef<any>(null)

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value)
    }
  }, [value, editorRef.current])

  return {
    onMount(editor: monacoEditor.IStandaloneDiffEditor) {
      const original = editor.getOriginalEditor()
      editorRef.current = original

      original.onDidChangeModelContent(() => {
        onChange(original.getValue())
      })
    }
  }
}

function Lab() {
  const lang = useLang()
  const examples = examplesMap[lang]
  const [example, setExample] = useState<string>('')
  const [code, setCode] = useState<string>('')
  const [stepByStepCode, setStepByStepCode] = useState<string>('')
  const debouncedCode = useDebounce(code, 500)
  const [stepByStep, setStepByStep] = useState(false)
  const [step, setStep] = useState(-1)
  const editor = useEditor({ lang, code: stepByStep ? undefined : debouncedCode })
  const diffEditorSync = useDiffEditorSync(code, setCode)



  useEffect(() => {
    setStepByStep(false)
  }, [debouncedCode])

  useEffect(() => {
    if (!stepByStep) setStep(-1)
  }, [stepByStep])


  return (
    <Container>
      <ExplorerArea>
        <Explorer
          lang={lang}
          setCode={setCode}
          setExample={setExample}
        />
      </ExplorerArea>
      <Editor>
        <Spin spinning={editor.graphToCode.loading} style={{ left: '25%' }} />
        <DiffEditor
          theme="vs-dark"
          language='javascript'
          modified={(stepByStep ? stepByStepCode : editor.code) || '// Generate code first'}
          options={{
            originalEditable: true,
            readOnly: true,
            padding: { top: 10 }
          }}
          onMount={diffEditorSync.onMount}
        />
        <CopyCode value={editor.executableCode || ''} />
        {editor.codeToGraph.status && <CodeError message={editor.codeToGraph.status?.message} placement="left" />}
        {editor.graphToCode.status && <CodeError message={editor.graphToCode.status?.message} placement="right" />}
      </Editor>
      <Canvas>
        <Spin spinning={editor.codeToGraph.loading} size="large" />
        {editor.canvas}
        <StepByStep>
          {stepByStep && <div style={{
            height: '100%', overflow: 'hidden',
            display: 'grid',
            marginBottom: '1em',
            padding: '0.5em 0',
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '1em'
          }}><OverlayScrollbarsComponent defer style={{ height: "100%" }}>
              <Steps>
                <AntSteps
                  direction="vertical"
                  progressDot
                  current={editor.getCurrentStep?.() ?? -1}
                  size="small"
                  items={(editor.stepNames || []).map(title => ({ title }))}
                />
              </Steps>
            </OverlayScrollbarsComponent></div>}
          <Button.Group>
            <Button onClick={async () => {
              if (!example) return
              if (!stepByStep) {
                await editor.startStepByStep?.(example, flatExamples(examples))
                setStepByStep(true)
              } else {
                setStepByStep(false)
                setStep(-1)
              }
            }}>
              <Switch checked={stepByStep} size="small" style={{ verticalAlign: 'text-bottom', marginRight: '0.5em' }}></Switch>
              Step-by-step
            </Button>
            <Button disabled={!stepByStep || step < 0} onClick={async () => {
              await editor.stepDown?.();
              setStep(editor.getCurrentStep())
            }}>{'<'}</Button>
            <Button disabled={!stepByStep || (editor.maxStep ? step >= editor.maxStep : false)} onClick={async () => {
              await editor.stepUp?.();
              setStep(editor.getCurrentStep())
            }}>{'>'}</Button>
            <Button disabled={!stepByStep || step >= 0} onClick={async () => {
              if (!editor?.currentGraphToCode) return
              const code = await editor.currentGraphToCode()

              setStepByStepCode(code)
            }} icon={<CodeFilled />} />
          </Button.Group>
        </StepByStep>
      </Canvas>
    </Container>
  )
}

export default function Page() {
  return (
    <ClientLayout>
      <Lab />
    </ClientLayout>
  )
}
