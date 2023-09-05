import * as JavaScript from 'rete-studio-javascript-lang'
import * as Template from 'rete-studio-template-lang'

export const Languages = {
  'javascript': JavaScript,
  'template': Template,
}

export type LanguageId = keyof typeof Languages

export function getLanguage(name: string | LanguageId) {
  return Languages[name as LanguageId] || null
}

export const languages = [{
  name: 'JavaScript',
  key: 'javascript',
}, {
  name: '(template)',
  key: 'template',
}]
