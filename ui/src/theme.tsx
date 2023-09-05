import React from 'react';
import { ConfigProvider, ThemeConfig } from 'antd';

export const tokens: ThemeConfig['token'] = {
  colorPrimaryBg: '#589ee4',
  colorPrimary: '#589ee4',
  colorText: '#ffffff',
  colorBgBase: '#3e3e3e',
  colorPrimaryHover: '#84bdf0',
  colorBorder: '#181818',
  colorBorderSecondary: 'red',
  wireframe: false,
  colorTextSecondary: '#bfbfbf',
  colorTextTertiary: '#b1b1b1',
  colorTextQuaternary: '#bcbcbc',
  colorError: '#ff4346',
  colorErrorBg: '#632d32',
  colorErrorBorder: '#c5494b',
  colorSplit: 'transparent',
  fontFamily: 'Montserrat, sans-serif'
}

export const transparentBgBase = tokens.colorBgBase + '85';

export function Theme(props: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: tokens
      }}
    >
      {props.children}
    </ConfigProvider>
  )
}
