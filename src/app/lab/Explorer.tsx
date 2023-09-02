'use client'
import { Button, Modal, Switch } from 'antd'
import { FilterFilled } from '@ant-design/icons';
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import styled from 'styled-components';
import type { DataNode } from 'antd/es/tree';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Space, Tag } from 'antd';
import { Examples } from '../../Tree';
import { getLanguage } from '../../rete/languages';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { flatExamples, File, Folder } from '../../rete/languages/_utils';
import { useSearchParams } from '@/shared/navigation';
import { SwitchLang, useLang } from '@/shared/Lang';

const { CheckableTag } = Tag;

const FilterButton = styled(Button)`
  position: absolute !important;
  top: 1em;
  right: 1em;
  z-index: 1;
`

export function Explorer(props: { lang: string, setCode: (code: string) => void, setExample: (example: string) => void }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const language = getLanguage(props.lang)
  const examples: (File | Folder)[] | undefined = language?.examples
  const exampleList = examples ? flatExamples(examples) : []
  const labels = useMemo(() => examples ? Array.from(new Set(exampleList.map(example => (example.labels || [])).flat() ?? [])).sort() : [], [examples])
  const example = searchParams?.get('example') || (examples && exampleList[0]?.path)
  const selectedLabels = useMemo(() => searchParams?.get('labels')?.split(',') || labels, [searchParams?.get('labels'), labels])
  const [openFilters, setOpenFilters] = useState(false)
  const currentExample = exampleList.find(item => item.path === example)
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
    props.setExample(example)
  }, [props.setExample, example])

  useEffect(() => {
    props.setCode(currentExample?.input || '')
  }, [props.setCode, currentExample])

  function setExample(name: string) {
    setSearchParams([['example', name]])
  }
  const setSelectedLabels = useCallback((next: string[]) => {
    setSearchParams([['labels', labels.length === next.length ? null : next.join(',')]])
  }, [searchParams, labels])


  return (
    <>
      <FilterButton onClick={() => setOpenFilters(true)} icon={<FilterFilled />} size="small" />
      <OverlayScrollbarsComponent defer style={{ height: "100%" }}>
        <Examples
          selected={example}
          onSelect={example => setExample(String(example))}
          treeData={examplesTree}
        />
      </OverlayScrollbarsComponent>
      <SwitchLang />
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
    </>
  )
}
