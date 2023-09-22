import { useSearchParams } from 'react-router-dom';
import { useLang as useUILang, SwitchLang as UISwitchLang } from 'rete-studio-ui'
import { languages } from './languages'

export function useLang() {
  const [searchParams] = useSearchParams()

  return useUILang(searchParams?.get('language'))
}

export function SwitchLang() {
  const [searchParams, setSearchParams] = useSearchParams()

  return <UISwitchLang
    languages={languages}
    lang={searchParams?.get('language')}
    setLang={value => setSearchParams([['language', value]])}
  />
}
