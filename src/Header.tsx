import { Badge, Button, Menu, MenuProps, Select, Tooltip } from 'antd'
import { useContext, useMemo } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { EnvContext } from './main'
import { languages } from './rete/languages/list'
import { Logo } from './shared/Logo'
import { tokens, transparentBgBase } from './theme'
import { DiscordIcon } from './shared/DiscordIcon'
import { GithubOutlined, TwitterOutlined } from '@ant-design/icons'
import { social } from './consts'
import { useWindowSize } from 'usehooks-ts'
import { Link } from './shared/Link'

const Container = styled.div`
  color: white;
  display: flex;
  align-items: center;
  height: 3.8em;
  padding: 1em;
  padding-top: 1em;
  position: sticky;
  background: ${transparentBgBase};
  top: 0;
  backdrop-filter: blur(10px);
  max-width: 100%;
  overflow: hidden;
  margin-bottom: -0.7em;
  z-index: 5;
  .title {
    margin-left: 0.5em;
    margin-right: 1em;
    display: inline-block;
    vertical-align: middle;
  }
`

const HeaderMenu = styled(Menu)`
  flex: 1;
  margin-left: 1em;
  background: transparent;
  overflow: hidden;
`

const MainLink = styled(Link)`
  color: white;
  height: 100%;
  font-weight: 400;
  white-space: nowrap;
  :hover {
    color: ${tokens?.colorPrimary} !important;
  }
`

const ExternalLink = styled(Link)`
  color: ${tokens?.colorPrimaryHover} !important;
  height: 100%;
  font-weight: 400;
  white-space: nowrap;
  :hover {
    color: ${tokens?.colorPrimary} !important;
  }
`

const Social = styled.div`
  display: flex;
  gap: 0.5em;
  padding: 0.5em 1em;
  .ant-btn-icon-only .anticon {
    font-size: 21px;
  }
`
function SocialLink(props: { title: string, icon?: JSX.Element, to: string }) {
  if (!props.icon) return <RouterLink to={props.to} target='_blank'>{props.title}</RouterLink>

  return (
    <Tooltip title={props.title}>
      <RouterLink to={props.to} target='_blank'><Button type="text" icon={props.icon} /></RouterLink>
    </Tooltip>
  )
}

export function Header() {
  const location = useLocation();
  const env = useContext(EnvContext)
  const { width } = useWindowSize()
  const isPhone = width < 500

  if (!env) throw new Error('EnvContext is not provided')

  const items = useMemo(() => {
    const items: MenuProps['items'] = [
      {
        label: <MainLink to="/playground">Playground</MainLink>,
        key: '/playground'
      },
      {
        label: <MainLink to="/lab">Lab</MainLink>,
        key: '/lab'
      },
      {
        label: <MainLink to="/editor">Editor</MainLink>,
        key: '/editor'
      },
      {
        label: <ExternalLink to="https://retejs.org/sponsor" target='_blank'>Sponsor</ExternalLink>,
        key: 'sponsor'
      }
    ]

    if (isPhone) items.push(
      {
        label: <SocialLink title={social.github.title} to={social.github.to} />,
        key: '/github'
      },
      {
        label: <SocialLink title={social.twitter.title} to={social.twitter.to} />,
        key: '/twitter'
      },
      {
        label: <SocialLink title={social.discord.title} to={social.discord.to} />,
        key: '/discord'
      }
    )
    return items
  }, [isPhone])

  return (
    <Container>
      <MainLink to="/">
        <Logo />
        <div className='title'><Badge count="Beta" offset={[13, -3]}>Rete Studio</Badge></div>
      </MainLink>
      <HeaderMenu
        selectedKeys={[location.pathname]}
        mode="horizontal"
        items={items}
      />
      {!isPhone && <Social>
        <SocialLink title={social.github.title} to={social.github.to} icon={<GithubOutlined />} />
        <SocialLink title={social.twitter.title} to={social.twitter.to} icon={<TwitterOutlined />} />
        <SocialLink title={social.discord.title} to={social.discord.to} icon={<DiscordIcon />} />
      </Social>}
      <Select
        size='small'
        value={env.current}
        onChange={value => env.set(value)}
        style={{ width: 110 }}
        options={languages.map(({ name, key }) => {
          return { label: name, value: key }
        })}
      />
    </Container>
  )
}
