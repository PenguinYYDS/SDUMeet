import type { UserConfigExport } from '@tarojs/cli'

export default {
  logger: { quiet: true, stats: false },
  defineConstants: {
    // 生产环境替换为已备案的 HTTPS 域名（小程序后台配置 request/websocket 合法域名）
    'process.env.TARO_APP_API_BASE': JSON.stringify('https://api.sdumeet.example.com/api'),
  },
  mini: {},
  h5: {},
} satisfies UserConfigExport<'webpack5'>
