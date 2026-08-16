export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/matches/index',
    'pages/me/index',
    'pages/auth/auth',
    'pages/survey/survey',
    'pages/chat/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#A4133C',
    navigationBarTitleText: 'SDUMeet',
    navigationBarTextStyle: 'white',
  },
  tabBar: {
    color: '#9CA3AF',
    selectedColor: '#A4133C',
    backgroundColor: '#FFFFFF',
    list: [
      { pagePath: 'pages/index/index', text: '每日派单' },
      { pagePath: 'pages/matches/index', text: '消息' },
      { pagePath: 'pages/me/index', text: '我的' },
    ],
  },
})
