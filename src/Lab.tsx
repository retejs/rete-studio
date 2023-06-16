import { Button, Modal, Steps as AntSteps, Switch } from 'antd'
import { CodeFilled, FilterFilled } from '@ant-design/icons';
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import styled from 'styled-components';
import type { DataNode } from 'antd/es/tree';
import { useSearchParams } from 'react-router-dom';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Space, Tag } from 'antd';
import { DiffEditor } from '@monaco-editor/react';
import type { editor as monacoEditor } from 'monaco-editor';
import { Area } from './shared/Area';
import { useEditor } from './shared/Editor';
import { Spin } from './Spin';
import { useDebounce } from 'usehooks-ts';
import { Examples } from './Tree';
import { CodeError } from './shared/Alert';
import { EnvContext } from './main';
import { getLanguage } from './rete/languages';
import { flatExamples, File, Folder } from './rete/languages/utils';

const { CheckableTag } = Tag;

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

const Explorer = styled(Area)`
  grid-area: explorer;
  background: #1e1e1e;
  overflow: hidden;
  position: relative;
  padding: 0.5em 0;
`

const Canvas = styled(Area)`
  grid-area: canvas;
  position: relative;
`

const Editor = styled(Area)`
  grid-area: editor;
  position: relative;
`

const FilterButton = styled(Button)`
  position: absolute;
  top: 1em;
  right: 1em;
  z-index: 1;
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

export default function Lab() {
  const env = useContext(EnvContext)
  const language = env ? getLanguage(env.current) : null
  const examples = language?.examples
  const exampleList = examples ? flatExamples(examples) : []
  const [searchParams, setSearchParams] = useSearchParams()
  const labels = useMemo(() => examples ? Array.from(new Set(exampleList.map(example => (example.labels || [])).flat() ?? [])).sort() : [], [examples])
  const example = searchParams.get('example') || (examples && exampleList[0]?.path)
  const selectedLabels = useMemo(() => searchParams.get('labels')?.split(',') || labels, [searchParams.get('labels'), labels])
  const [openFilters, setOpenFilters] = useState(false)
  const [code, setCode] = useState<string>('')
  const [stepByStepCode, setStepByStepCode] = useState<string>('')
  const debouncedCode = useDebounce(code, 500)
  const currentExample = exampleList.find(item => item.path === example)
  const [stepByStep, setStepByStep] = useState(false)
  const [step, setStep] = useState(-1)
  const editor = useEditor({ code: stepByStep ? undefined : debouncedCode })
  const diffEditorSync = useDiffEditorSync(code, setCode)
  const examplesTree = useMemo(() => {
    function toTree(items: (File | Folder)[]): DataNode[] {
      return items.map(item => {
        if ('children' in item) return { title: item.name, key: item.name, children: toTree(item.children) }
        return { title: item.name, key: item.path, isLeaf: true, disabled: !(item.labels || []).some(label => selectedLabels.includes(label)) }
      })
    }
    if (!examples) return []
    return toTree(examples)
  }, [examples, selectedLabels])

  useEffect(() => {
    searchParams.delete('labels')
    if (!currentExample) searchParams.delete('example')
    setSearchParams(searchParams)
  }, [env?.current])

  useEffect(() => {
    setStepByStep(false)
  }, [debouncedCode])

  useEffect(() => {
    if (!stepByStep) setStep(-1)
  }, [stepByStep])


  useEffect(() => {
    setCode(currentExample?.input || '')
  }, [currentExample])

  function setExample(name: string) {
    searchParams.set('example', name)

    setSearchParams(searchParams)
  }
  const setSelectedLabels = useCallback((next: string[]) => {
    if (labels.length === next.length) {
      searchParams.delete('labels')
    } else {
      searchParams.set('labels', next.join(','))
    }

    setSearchParams(searchParams)
  }, [searchParams, setSearchParams, labels])


  return (
    <Container>
      <Explorer>
        <FilterButton onClick={() => setOpenFilters(true)} icon={<FilterFilled />} size="small" />
        <OverlayScrollbarsComponent defer style={{ height: "100%" }}>
          <Examples
            selected={example}
            onSelect={example => setExample(String(example))}
            treeData={examplesTree}
          />
        </OverlayScrollbarsComponent>
      </Explorer>
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
                await editor.startStepByStep?.(example)
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
            <Button disabled={!stepByStep || editor.maxStep && step >= editor.maxStep} onClick={async () => {
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
      <Modal
        open={openFilters} title="Filter by AST node types"
        onCancel={() => setOpenFilters(false)}
        width="80vw"
        footer={
          <Space>
            <Button
              onClick={() => selectedLabels.length < labels.length ? setSelectedLabels(labels) : setSelectedLabels([])}
            >
              {selectedLabels.length < labels.length ? 'Select all' : 'Unselect'}
            </Button>
          </Space>
        }
      >
        <Space size={[0, 8]} wrap>
          {labels.map((tag) => (
            <CheckableTag
              key={tag}
              checked={selectedLabels.includes(tag)}
              onChange={(checked) => {
                setSelectedLabels(checked ? [...selectedLabels, tag] : selectedLabels.filter(n => n !== tag))
              }}
            >
              {tag}
            </CheckableTag>
          ))}
        </Space>
      </Modal>
    </Container>
  )
}
