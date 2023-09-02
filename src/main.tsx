'use client'
// import { createContext, lazy, StrictMode, Suspense } from 'react'
// import { useSearchParams } from 'react-router-dom'
// import { createRoot } from 'react-dom/client'
// import { Header } from './Header'
// import { ConfigProvider } from 'antd';
// import Home from './Home'
// import './index.css'
// import {
//   createHashRouter,
//   RouterProvider,
//   Outlet
// } from 'react-router-dom';
import styled from 'styled-components';
// import 'overlayscrollbars/overlayscrollbars.css';
// import './scroll.css'
import { tokens } from './theme';
// import 'antd/dist/reset.css';
// import './App.css'
// import { Spin } from './Spin';

// const Lab = lazy(() => import('./Lab'))
// const Playground = lazy(() => import('./Playground'))
// const Editor = lazy(() => import('./Editor'))

export const Layout = styled.div<{ headless?: boolean }>`
  display: grid;
  grid-template-rows: ${props => !props.headless ? 'auto 1fr' : '1fr'};
  background: ${tokens?.colorBgBase};
  height: 100vh;
  width: 100vw;
  overflow-x: hidden;
`

// export const EnvContext = createContext<{ current: string, set: (value: string) => void } | null>(null)


// function Root() {
//   const [searchParams, setSearchParams] = useSearchParams()
//   const current = searchParams.get('language') || 'javascript'
//   const headless = searchParams.get('headless') === 'true'

//   return (
//     <Layout headless={headless}>
//       <EnvContext.Provider value={{
//         current, set(value) {
//           searchParams.set('language', value)
//           setSearchParams(searchParams)
//         }
//       }}>
//         {!headless && <Header />}
//         <Outlet />
//       </EnvContext.Provider>
//     </Layout>
//   )
// }

// const router = createHashRouter([
//   {
//     element: <Root />,
//     children: [
//       {
//         path: '/',
//         element: <Home />
//       },
//       {
//         path: '/lab',
//         element: (
//           <Suspense fallback={<Spin />}>
//             <Lab />
//           </Suspense>
//         )
//       },
//       {
//         path: '/playground',
//         element: (
//           <Suspense fallback={<Spin />}>
//             <Playground />
//           </Suspense>
//         )
//       },
//       {
//         path: '/editor',
//         element: (
//           <Suspense fallback={<Spin />}>
//             <Editor />
//           </Suspense>
//         )
//       },
//     ]
//   }
// ]);
// createRoot(document.getElementById('root') as HTMLElement).render(
//   <StrictMode>
//     <ConfigProvider
//       theme={{
//         token: tokens
//       }}
//     >
//       <RouterProvider router={router} />
//     </ConfigProvider>
//   </StrictMode>,
// )
