import React from 'react'
import styled from 'styled-components'
import { Select } from 'antd';
import { languages } from 'rete-studio-core'

const SwitchSelect = styled(Select)`
  position: absolute !important;
  bottom: 1em;
  right: 1em;
  z-index: 20;
`

const defaultLang = 'javascript'

export function useLang(lang?: string | null) {
  return lang || defaultLang
}

export function SwitchLang(props: { lang?: string | null, setLang: (lang: string) => void }) {
  return (
    <SwitchSelect
      size='small'
      value={props.lang || defaultLang}
      onChange={(value: any) => props.setLang(value as string)}
      style={{ width: 110 }}
      options={languages.map(({ name, key }) => {
        return { label: name, value: key }
      })}
    />
  )
}
