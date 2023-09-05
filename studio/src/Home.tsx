'use client'
import * as React from 'react';
import styled from 'styled-components';
import { Section } from './shared/Section';
import { Logo } from './shared/Logo';
import { Badge, Button, Collapse, Layout } from 'antd';
import { EditFilled, ExperimentFilled, PlayCircleFilled } from '@ant-design/icons';
import { Theme } from 'rete-studio-ui';
import { githubRepoIssues } from './consts';
import Link from 'next/link';

const { Footer } = Layout

const Top = styled(Section)`
  text-align: center;
  margin-top: 5em;
  .title {
    font-size: 2em;
  }
`

const List = styled.div`
  grid-gap: 1em;
  display: grid;
  grid-auto-flow: column;
  align-items: start;
  margin: 1.5em auto 0;
  width: fit-content;
  .origin img {
    height: 26px;
  }
  .star iframe {
    border: none;
    overflow: hidden;
  }
`

const LargeLogo = styled.div`
  display: inline-block;
  margin: calc(5vw + 1vh);
  max-height: 40em;
  min-height: 10em;
  height: calc(8vh + 10vw);
`

const Features = styled.div`
  display: flex;
  align-items: center;
  margin: 1.5em auto;
  max-width: 80em;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`

const Feature = styled.div`
  flex: 1;
  max-width: 50vw;
  margin: 1em;
  .title {
    color: white;
    font-weight: 700;
    font-size: 1.2em;
  }
  .description {
    color: #c8c8c8;
    font-weight: 400;
    font-size: 0.9em;
    margin: 1em 0;
  }
  .ant-btn {
    border-radius: 2em;
    font-size: 0.8em;
    padding: 2px 12px;
    height: 28px;
    box-shadow: none;
    line-height: 1.8em;
  }
`

const DisclaimerStyle = styled.div`
  border: 1px solid ${Theme.tokens?.colorPrimary};
  color: ${Theme.tokens?.colorPrimary};
  border-radius: 5px;
  margin: 1em auto;
  font-size: 0.85em;
  max-width: calc(100% - 4em);
  padding: 0.5em 1em;
  width: fit-content;
  text-align: left;
  position: relative;
  padding-right: 2em;
  .badge {
    margin-right: 0.5em;
    vertical-align: middle !important;
  }
  .details {
    margin-top: 0.5em;
  }
  .ant-collapse, .ant-collapse-item, .ant-collapse-content {
    border: 0 !important;
  }
  .ant-collapse>.ant-collapse-item >.ant-collapse-header {
    height: 0;
    padding: 0;
    position: static;
  }
  .ant-collapse-expand-icon {
    position: absolute;
    top: 0.4em;
    right: 0;
    color: ${Theme.tokens?.colorError};
  }
  .ant-collapse-content {
    color: ${Theme.tokens?.colorPrimary} !important;
    .ant-collapse-content-box {
      padding: 0;
    }
  }
`

function Disclaimer() {
  return (
    <DisclaimerStyle>
      <Badge count='Beta' className='badge' />
      Please note that this application is in Beta stage
      <Collapse items={[
        {
          children: <div className='details'>
            Transforming textual language into visual form is an exceptionally challenging task.
            It requires numerous transformations to convert each language structure into a user-friendly graph.
            Consequently, it is important to verify that the obtained graph is correctly converted into code that reflects the original code.
            <br />
            If you come across any issue, please submit a ticket on <Link href={githubRepoIssues} target="_blank">GitHub Issues</Link>
          </div>
        }
      ]} />
    </DisclaimerStyle>
  )
}

function FeatureButton(props: { to: string, icon: JSX.Element, children: React.ReactNode }) {
  return <Button
    type="primary"
    icon={props.icon}
    href={props.to}
  >
    {props.children}
  </Button>
}

export default function Home() {
  const gitHubBadge = 'https://ghbtns.com/github-btn.html?user=retejs&repo=rete-studio&type=star&count=true&size=large'
  const originBadge = 'https://img.shields.io/badge/made_in-ukraine-ffd700.svg?labelColor=0057b7'

  return (
    <div style={{ textAlign: 'center' }}>
      <Top title='Rete Studio' description='A general-purpose code generation tool powered by Rete.js' />
      <List>
        <div className='star'>
          <iframe src={gitHubBadge} width="130px" height="30px"></iframe>
        </div>
        <a className='origin' href="https://stand-with-ukraine.pp.ua" target="_blank">
          <img src={originBadge} alt="Stand with Ukraine" />
        </a>
      </List>
      <LargeLogo>
        <Logo />
      </LargeLogo>
      <Disclaimer />
      <Features>
        <Feature>
          <div className='title'>Playground</div>
          <div className='description'>Input your code and check its graph representation</div>
          <FeatureButton to="/playground" icon={<PlayCircleFilled />}>Playground</FeatureButton>
        </Feature>
        <Feature>
          <div className='title'>Lab</div>
          <div className='description'>Debugging tool for code transformation into a graph and back</div>
          <FeatureButton to="/lab" icon={<ExperimentFilled />}>Lab</FeatureButton>
        </Feature>
        <Feature>
          <div className='title'>Editor</div>
          <div className='description'>Open your local project to edit code visually as a graph</div>
          <FeatureButton to="/editor" icon={<EditFilled />}>Editor</FeatureButton>
        </Feature>
      </Features>
      <Footer style={{ textAlign: 'center' }}>Copyright © 2023 Vitaliy Stoliarov</Footer>
    </div>
  )
}
