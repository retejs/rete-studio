import { useContext } from 'react';
import { Link as RouterLink, useNavigate as useNav } from 'react-router-dom';
import { EnvContext } from '../main';

export function useNavigate() {
  const nav = useNav()
  const env = useContext(EnvContext)

  return (path: string) => nav(includeLanguage(path, env?.current))
}

export function includeLanguage(path: string, lang?: string) {
  return path + (lang && `?language=${lang}`)
}

export function Link(props: { to: string, target?: string, children: React.ReactNode }) {
  const env = useContext(EnvContext)

  return (
    <RouterLink {...props} to={includeLanguage(props.to, env?.current)}>
      {props.children}
    </RouterLink>
  )
}
