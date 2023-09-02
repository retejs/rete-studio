import styled from 'styled-components'
import { DeliveredProcedureOutlined } from '@ant-design/icons'
import { Select } from 'antd';
import { languages } from '../rete/languages/list'
import { useSearchParams } from './navigation';

const SwitchSelect = styled(Select)`
  position: absolute !important;
  bottom: 1em;
  right: 1em;
  z-index: 20;
`

const defaultLang = 'javascript'

export function useLang() {
  const [searchParams] = useSearchParams()

  return searchParams?.get('language') || defaultLang
}

export function SwitchLang() {
  const [searchParams, setSearchParams] = useSearchParams()

  return (
    <>
      <SwitchSelect
        size='small'
        value={searchParams?.get('language') || defaultLang}
        onChange={value => setSearchParams([['language', value as string]])}
        style={{ width: 110 }}
        options={languages.map(({ name, key }) => {
          return { label: name, value: key }
        })}
      />
    </>
  )
}
