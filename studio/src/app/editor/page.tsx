'use client'
import { Button, Tree, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import type { DataNode } from 'antd/es/tree';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import styled from 'styled-components';
import { Area, CodeError, Spin, useEditor } from 'rete-studio-ui';
import { FileOutlined, ReloadOutlined } from '@ant-design/icons';
import { useDebounce } from 'usehooks-ts';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import ClientLayout from '../client-layout'
import { useLang } from '@/shared/Lang';

const Grid = styled.div<{ showCanvas?: boolean }>`
  display: grid;
  grid-template-columns: 16em 1fr;
  grid-template-rows: 2fr 3fr;
  grid-template-areas: ${props => props.showCanvas ? `
    'explorer code'
    'explorer canvas'
    ` : `
    'explorer code'
    'explorer code'
  `};
  padding: 0.6em;
  overflow: hidden;
  gap: 0.6em;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: 2fr 2fr 3fr;
    grid-template-areas: ${props => props.showCanvas ? `
      'explorer' 'code' 'canvas'
      ` : `
      'explorer' 'code' 'code'
  `};
  }
`

const Explorer = styled(Area)`
  grid-area: explorer;
  background: #1e1e1e;
  overflow: hidden;
  position: relative;
  padding: 0.5em 0;
`

const ExplorerButtons = styled(Button.Group)`
  margin: 0 0.5em;
`

const Code = styled(Area)`
  grid-area: code;
  position: relative;
`

const DirectoryTree = styled(Tree.DirectoryTree)`
  background: transparent;
  .ant-tree-switcher-noop {
    display: none;
  }
` as typeof Tree.DirectoryTree

const Canvas = styled(Area)`
  grid-area: canvas;
  position: relative;
`

// convert if return into object
const formats = {
  js: 'javascript',
  ts: 'typescript',
  html: 'html',
  css: 'css',
  json: 'json',
  md: 'markdown',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  styl: 'stylus',
  vue: 'vue',
  jsx: 'javascriptreact',
  tsx: 'typescriptreact',
}

function getLanguage(format: string) {
  return formats[format as keyof typeof formats] || 'plaintext'
}

function getFormat(language?: string) {
  return Object.entries(formats).find(([_, l]) => l === language)?.[0] || 'js'
}

type TreeItem = DataNode & { entry: FileSystemDirectoryHandle | FileSystemFileHandle }

function Editor() {
  const [treeData, setTreeData] = useState<TreeItem[]>([])
  const [file, setFile] = useState<{ path: string, code: string, format: string } | undefined>()
  const [expandedKeys, setExpandedKeys] = useState<(number | string)[]>([])
  const [handle, setHandle] = useState<FileSystemDirectoryHandle>()
  const debouncedCode = useDebounce(file?.code, 500)
  const lang = useLang()
  const editor = useEditor({ lang, code: debouncedCode, autoCode: false })
  const [messageApi, contextHolder] = message.useMessage({ top: 60 });
  const env = { current: lang }
  const language = file && getLanguage(file.format)
  const hasVisualEditor = env?.current === language

  async function directoryToItems(handle: FileSystemDirectoryHandle, path = '') {
    const items: TreeItem[] = []

    for await (const entry of handle.values()) {
      const key = `${path}/${entry.name}`

      if (entry.kind === 'file') {
        items.push({
          title: isReteFile(key) ? <Typography.Text type="success">{entry.name}</Typography.Text> : entry.name,
          key,
          isLeaf: true,
          entry
        })
      } else if (entry.kind === 'directory') {
        items.push({
          title: entry.name,
          icon: null,
          children: expandedKeys.includes(key) ? await directoryToItems(entry, key) : undefined,
          key,
          entry
        })
      }
    }
    items.sort((a, b) => a.isLeaf === b.isLeaf ? 0 : a.isLeaf ? 1 : -1)

    return items
  }
  function isReteFile(name: string) {
    return name.endsWith(`.rete.${getFormat(language)}`)
  }
  async function open() {
    if (!('showDirectoryPicker' in window)) {
      messageApi.error('Your browser does not support File System Access API')
      return
    }
    const handle = await window.showDirectoryPicker();

    setHandle(handle)
    setTreeData([
      {
        key: handle.name,
        title: handle.name,
        icon: null,
        children: await directoryToItems(handle),
        entry: handle
      }
    ])
  }

  async function refresh() {
    if (!handle) return
    setTreeData([
      {
        key: handle.name,
        title: handle.name,
        icon: null,
        children: await directoryToItems(handle),
        entry: handle
      }
    ])
  }
  async function getDirectoryHandleByPath(parentDirectoryHandle: FileSystemDirectoryHandle, path: string) {
    const segments = path.split('/').filter(segment => segment.length > 0);
    let currentDirectoryHandle = parentDirectoryHandle;

    for (const segment of segments) {
      currentDirectoryHandle = await currentDirectoryHandle.getDirectoryHandle(segment);
    }

    return currentDirectoryHandle;
  }

  async function save(code: string) {
    if (!file) return
    if (!handle) return
    const folder = file.path.split('/').slice(0, -1).join('/')
    const name = file.path.split('/').pop()

    if (!name) throw new Error('No name')
    if (isReteFile(name)) return

    const reteName = name.replace(/\.js$/, '.rete.js')
    const nestedFolderHandle = await getDirectoryHandleByPath(handle, folder);
    const newFileHandle = await nestedFolderHandle.getFileHandle(reteName, { create: true });

    const stream = await newFileHandle.createWritable()

    await stream.write(code)
    await stream.close()
    messageApi.success(`Saved ${reteName}`)
  }

  useEffect(() => {
    if (editor.code) {
      save(editor.code)
    }
  }, [editor.code])

  const findNodeByKey = (treeData: DataNode[], key: string | number): DataNode | null => {
    for (const node of treeData) {
      if (node.key === key) {
        return node;
      }

      if (node.children) {
        const foundNode = findNodeByKey(node.children, key);
        if (foundNode) {
          return foundNode;
        }
      }
    }

    return null;
  };

  return (
    <Grid showCanvas={hasVisualEditor}>
      {contextHolder}
      <Explorer>
        <ExplorerButtons>
          <Button onClick={open} size="small">Open</Button>
          <Button onClick={refresh} size="small" icon={<ReloadOutlined />} />
        </ExplorerButtons>
        <OverlayScrollbarsComponent defer style={{ height: "100%" }}>
          <DirectoryTree
            treeData={treeData}
            icon={(n: any) => {
              if (n.isLeaf) {
                return (
                  <Typography.Text type={isReteFile(String(n.data.key)) ? 'success' : undefined}>
                    <FileOutlined />
                  </Typography.Text>
                )
              }
              return null
            }}
            expandedKeys={expandedKeys}
            onExpand={setExpandedKeys}
            loadData={async (node) => {
              const { key, children, entry } = node;

              if (children) return
              if (entry.kind === 'file') return

              const updatedTreeData = [...treeData];
              const targetNode = findNodeByKey(updatedTreeData, key);

              if (!targetNode) return

              targetNode.children = await directoryToItems(entry, String(node.key))

              setTreeData([...updatedTreeData]);
            }}
            onSelect={async (_keys, { node }) => {
              if (node.entry.kind !== 'file') return

              const file = await node.entry.getFile()
              const code = await file.text()
              const format = file.name.split('.').pop() || ''

              setFile({
                path: String(node.key),
                code,
                format
              })
            }}
          />
        </OverlayScrollbarsComponent>
      </Explorer>
      <Code>
        {editor.codeToGraph.status && <CodeError message={editor.codeToGraph.status?.message} placement="right" />}
        <MonacoEditor
          value={file?.code}
          onChange={code => file && setFile({ ...file, code: code || '' })}
          theme='vs-dark'
          language={language}
          options={{
            padding: { top: 10 }
          }}
        />
      </Code>
      {hasVisualEditor && <Canvas>
        {editor.graphToCode.status && <CodeError message={editor.graphToCode.status?.message} placement="left" />}
        <Spin spinning={editor.codeToGraph.loading} size="large" />
        {editor.canvas}
      </Canvas>}
    </Grid>
  )
}

export default function Page() {
  return (
    <ClientLayout>
      <Editor />
    </ClientLayout>
  )
}

