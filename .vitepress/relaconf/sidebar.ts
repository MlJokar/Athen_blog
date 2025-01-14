import {DefaultTheme} from "vitepress";
export const sidebar: DefaultTheme.Sidebar = {
  '/mdFiles/interview/': [
      {
        text: '面试记录',
        collapsed: false,
        link: 'mdFiles/interview/intro',
        items: [
          { text: '日常实习', link: 'mdFiles/interview/normal-intern-interview' },
          { text: '暑期实习', link: 'mdFiles/interview/summer-intern-interview' },
          { text: '秋招', link: 'mdFiles/interview/fall-recruit-interview' },
        ]
      }
  ],
  '/mdFiles/projects/': [
    {
      text: '苍穹外卖',
      collapsed: false,
      items: [
        { text: '项目简介',  link: 'mdFiles/projects/sky-take-out/intro'}
      ]
    },
      {
        text: 'easychat',
        collapsed: false,
        items: [
          { text: '项目简介',  link: 'mdFiles/projects/easychat/intro'},
          { text: '项目文档', link: 'mdFiles/projects/easychat/detail' },
          { text: '问题总结', link: 'mdFiles/projects/easychat/question' },
        ]
      },
    {
      text: 'rpc',
      collapsed: false,
      items: [
        { text: '项目简介', link: 'mdFiles/projects/rpc/intro' },
        { text: '项目文档', link: 'mdFiles/projects/rpc/detail' },
        { text: '问题总结', link: 'mdFiles/projects/rpc/detail' },
      ]
    },
  ]
}