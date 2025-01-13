---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
lastUpdated: true
hero:
  name: "Athen blog"
  text: "一个人的碎碎念"
  tagline: 后端开发/程序员
  image:
    src: /avatar.jpg
    alt: cool 小狗
  actions:
    - theme: brand
      text: 项目文档
      link: /projects/intro
    - theme: alt
      text: 面试记录
      link: /interview/intro
    - theme: brand
      text: 个人感想
      link: /easychat/introduction


features:
  - icon: 💻
    title: 后端开发
    details: 练习Java两年半，学不会前端的菜鸡
    link: /projects/intro
  - icon: 🏀
    title: 爱打篮球
    details: 篮球狂热少年，球鞋爱好者
  - icon: 🧩
    title: 请你记住
    details: 甭管我说了什么，记住就行
---

<style>:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #bd34fe 30%, #41d1ff);

  --vp-home-hero-image-background-image: linear-gradient(-45deg, #bd34fe 50%, #47caff 50%);
  --vp-home-hero-image-filter: blur(44px);
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(56px);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(68px);
  }
}
</style>

