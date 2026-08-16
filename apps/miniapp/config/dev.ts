import type { UserConfigExport } from '@tarojs/cli'

export default {
  logger: { quiet: false, stats: true },
  defineConstants: {
    'process.env.TARO_APP_API_BASE': JSON.stringify('http://127.0.0.1:3000/api'),
  },
  mini: {},
  h5: {},
} satisfies UserConfigExport<'webpack5'>
