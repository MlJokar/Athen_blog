import {DefaultTheme} from "vitepress";
export const sidebar: DefaultTheme.Sidebar = {
  '/markdown/': [
    {
      text: '面试记录',
      collapsed: false,
      items: [
        { text: '介绍', link: '/' },
        { text: '安装', link: '/install' },
        { text: '快速上手', link: '/get-started' },
        { text: '基础用法', link: '/basic-usage' },
        { text: '组件', link: '/components' },
        { text:'配置项', link: '/config' },
      ]
    }
  ]
}