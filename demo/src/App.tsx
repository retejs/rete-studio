import { ConfigProvider } from 'antd'
import './App.css'
import { Playground as UIPlayground, Theme } from 'rete-studio-ui'
import { SwitchLang, useLang } from './Lang'
import 'rete-studio-ui/styles.css'
import { getLanguage } from './languages'

function App() {
  const lang = useLang()

  return (
    <ConfigProvider
      theme={{
        token: Theme.tokens
      }}
    >
      <UIPlayground
        example={getLanguage(lang).playgroundExample}
        lang={getLanguage(lang)}
        switchLang={<SwitchLang />}
      />
    </ConfigProvider>
  )
}

export default App
