import { tokens } from '@/theme'
import './globals.css'
import type { Metadata } from 'next'
import UIRegistry from '@/registry'
import StyledComponentsRegistry from '@/AntdRegistry';
import 'antd/dist/reset.css';
import '../App.css'
import 'overlayscrollbars/overlayscrollbars.css';
import '../scroll.css'
import '../index.css'

const title = 'Rete Studio - Code generation tool powered by Rete.js'
const description = 'Experience seamless transformation of JavaScript into a visual programming language and harness code generation capabilities with Rete Studio'
const keywords = 'rete.js, codegen, code generation, visual programming, vpl, visual programming language, js, javascript'
const themeColor = tokens?.colorBgBase || '#fff'
const site = 'https://studio.retejs.org'
const cover = site + '/codegen.png'


export const metadata: Metadata = {
  metadataBase: new URL(site),
  title,
  description,
  keywords,
  themeColor,
  openGraph: {
    title,
    description,
    locale: 'en_US',
    images: [
      cover
    ]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@rete_js',
    creator: '@rete_js',
    title,
    description,
    images: [
      cover
    ]
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <UIRegistry>
            {children}
          </UIRegistry>
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}
