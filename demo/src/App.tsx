import { ConfigProvider } from 'antd'
import './App.css'
import { Playground as UIPlayground, Theme } from 'rete-studio-ui'
import { SwitchLang, useLang } from './Lang'
import 'rete-studio-ui/styles.css'
import { useEffect, useMemo, useState } from 'react'
import JSWorker from './workers/javascript?worker'
import TemplateWorker from './workers/template?worker'
import { OnlyMethods, requestable } from './lib/req-res'
import { LanguageAdapter } from 'rete-studio-core'

const languages: Record<string, OnlyMethods<LanguageAdapter>> = {
  javascript: requestable<LanguageAdapter>(new JSWorker()),
  template: requestable<LanguageAdapter>(new TemplateWorker())
}

function App() {
  const langId = useLang()
  const lang = useMemo(() => languages[langId], [langId])
  const [playgroundExample, setPlaygroundExample] = useState<string>('')

  useEffect(() => {
    lang.getExample().then(setPlaygroundExample)
  }, [lang])

  return (
    <ConfigProvider
      theme={{
        token: Theme.tokens
      }}
    >
      <UIPlayground
        example={playgroundExample}
        lang={lang}
        switchLang={<SwitchLang />}
      />
    </ConfigProvider>
  )
}

export default App
