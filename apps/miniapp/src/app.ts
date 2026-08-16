import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    console.log('SDUMeet launch')
  })
  // children 是将要被渲染的页面
  return children
}

export default App
