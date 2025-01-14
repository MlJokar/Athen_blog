import {DefaultTheme} from "vitepress";
export const nav: DefaultTheme.NavItem[] = [
  {
    text: "首页",
    link: "/", // 表示docs/index.md
  },
  {
    text: "个人成长",
    items: [
      {
        text: "大江南北游记",
        link: "/mdFiles/self/tour",
      },
      {
        text: "所思所想",
        link: "/mdFiles/self/thought",
      },
    ],
  },
  {
    text: "个人简介",
    link: "/mdFiles/self/self-introduction",
  },
];