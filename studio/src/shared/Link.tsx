import { default as RouterLink } from 'next/link'
import { useLang } from './Lang'

export function includeLanguage(path: string, lang?: string) {
  return path + (lang && `?language=${lang}`)
}

export function Link(props: { to: string, target?: string, children: React.ReactNode }) {
  const env = { current: useLang() }

  return (
    <RouterLink {...props} href={includeLanguage(props.to, env?.current)}>
      {props.children}
    </RouterLink>
  )
}
