'use client'

import { Badge, Button, Menu, MenuProps, Tooltip } from 'antd'
import { useMemo } from 'react'
import { default as RouterLink } from 'next/link'
import styled from 'styled-components'
import { Logo } from './shared/Logo'
import { Theme } from 'rete-studio-ui'
import { DiscordIcon } from './shared/DiscordIcon'
import { GithubOutlined, TwitterOutlined } from '@ant-design/icons'
import { social } from './consts'
import { useWindowSize } from 'usehooks-ts'
import { Link } from './shared/Link'
import { usePathname } from 'next/navigation'

const Container = styled.div`
  color: white;
  display: flex;
  align-items: center;
  height: 3.8em;
  padding: 1em;
  padding-top: 1em;
  position: sticky;
  background: ${Theme.transparentBgBase};
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
  margin-left: 1em !important;
  background: transparent !important;
  overflow: hidden;
`

const MainLink = styled(Link)`
  color: white;
  height: 100%;
  font-weight: 400;
  white-space: nowrap;
  :hover {
    color: ${Theme.tokens?.colorPrimary} !important;
  }
`

const ExternalLink = styled(Link)`
  color: ${Theme.tokens?.colorPrimaryHover} !important;
  height: 100%;
  font-weight: 400;
  white-space: nowrap;
  :hover {
    color: ${Theme.tokens?.colorPrimary} !important;
  }
`

const Social = styled.div`
  display: flex;
  gap: 0.5em;
  padding: 0.5em 1em;
  .ant-btn-icon-only .anticon {
    font-size: 21px !important;
  }
`
function SocialLink(props: { title: string, icon?: JSX.Element, to: string }) {
  if (!props.icon) return <RouterLink href={props.to} target='_blank'>{props.title}</RouterLink>

  return (
    <Tooltip title={props.title}>
      <RouterLink href={props.to} target='_blank'><Button type="text" icon={props.icon} /></RouterLink>
    </Tooltip>
  )
}

export function Header() {
  const pathname = usePathname()
  const { width } = useWindowSize()
  const isPhone = width > 0 && width < 500

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
        selectedKeys={[pathname]}
        mode="horizontal"
        items={items}
      />
      {!isPhone && <Social>
        <SocialLink title={social.github.title} to={social.github.to} icon={<GithubOutlined />} />
        <SocialLink title={social.twitter.title} to={social.twitter.to} icon={<TwitterOutlined />} />
        <SocialLink title={social.discord.title} to={social.discord.to} icon={<DiscordIcon />} />
      </Social>}
    </Container>
  )
}
