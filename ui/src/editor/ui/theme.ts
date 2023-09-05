import { ThemeConfig } from 'antd'
import { Theme } from '../..'

export const tokens: ThemeConfig['token'] = {
  colorTextBase: 'white',
  colorTextLabel: 'white',
  colorBgLayout: '#000000b1',
  borderRadiusSM: 16,
  borderRadius: 16,
  colorBgContainer: '#8080807d',
  fontFamily: 'Montserrat, sans-serif',
  colorBgElevated: '#7f7f7fc3',
  controlItemBgActive: '#3d6de6c6',
  colorPrimary: 'white',
  colorBorder: 'white',
  controlOutline: 'white'
}

export const contextMenuToken: ThemeConfig['token'] = {
  ...Theme.tokens
}

export const components: ThemeConfig['components'] = {
  Segmented: {
    itemHoverBg: '#7f7f7f53',
    itemSelectedBg: '#7f7f7f83'
  }
}
