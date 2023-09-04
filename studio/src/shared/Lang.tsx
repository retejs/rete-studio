import { useSearchParams } from './navigation';
import { useLang as useUILang, SwitchLang as UISwitchLang } from 'rete-studio-ui';

export function useLang() {
  const [searchParams] = useSearchParams()

  return useUILang(searchParams?.get('language'))
}

export function SwitchLang() {
  const [searchParams, setSearchParams] = useSearchParams()

  return <UISwitchLang
    lang={searchParams?.get('language')}
    setLang={value => setSearchParams([['language', value]])}
  />
}
