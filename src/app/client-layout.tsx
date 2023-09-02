'use client'
import { Layout } from '@/main'
import { Header } from '@/Header'
import { ConfigProvider } from 'antd'
import { tokens } from '@/theme'
// import { useSearchParams } from '@/shared/navigation'
import Script from 'next/script'
import { GA_MEASUREMENT_ID } from '@/consts'

export default function ClientLayout(props: { headless?: boolean, children: React.ReactNode }) {
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
      <ConfigProvider
        theme={{
          token: tokens
        }}
      >
        <Layout headless={props.headless}>
          {!props.headless && <Header />}
          {props.children}
        </Layout>
      </ConfigProvider>
    </>
  )
}
