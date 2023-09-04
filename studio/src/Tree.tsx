import { Tree } from 'antd';
import { memo, useState } from 'react';
import styled from 'styled-components';
import type { DataNode } from 'antd/es/tree';

type Key = number | string

const DirectoryTree = styled(Tree.DirectoryTree)`
  background: transparent;
`

export function ExamplesTree(props: { selected?: Key, treeData: DataNode[], onSelect: (key: Key) => void }) {
  const list = props.selected ? String(props.selected).split('/').reduce((acc, key) => [...acc, acc[acc.length - 1] ? [acc[acc.length - 1], key].join('/') : key], [] as string[]) : []
  const [expanded, setExpanded] = useState<Key[]>(list)

  return <DirectoryTree
    expandedKeys={expanded}
    onExpand={keys => setExpanded(keys)}
    selectedKeys={props.selected ? [props.selected] : []}
    onSelect={items => props.onSelect(items[0])}
    treeData={props.treeData}
  />
}

export const Examples = memo(ExamplesTree, (prev, next) => {
  return prev.selected === next.selected && prev.treeData === next.treeData
})
