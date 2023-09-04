import { ConfigProvider } from 'antd'
import './App.css'
import { Playground as UIPlayground, Theme } from 'rete-studio-ui'
import { SwitchLang, useLang } from './Lang'
import 'rete-studio-ui/styles.css'

function App() {
  const lang = useLang()
  UIPlayground
  SwitchLang
  lang
  return (
    <ConfigProvider
      theme={{
        token: Theme.tokens
      }}
    >
      <UIPlayground lang={lang} switchLang={<SwitchLang />} />
    </ConfigProvider>
  )
}

export default App
