'use client'

import ClientLayout from '../client-layout'
import { SwitchLang, useLang } from '@/shared/Lang';
import { Playground as UIPlayground } from 'rete-studio-ui';

export function Playground() {
  const lang = useLang()

  return <UIPlayground lang={lang} switchLang={<SwitchLang />} />
}

export default function Page() {
  return (
    <ClientLayout>
      <Playground />
    </ClientLayout>
  )
}
