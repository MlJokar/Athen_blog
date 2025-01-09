import {defineConfig} from 'vitepress'
import {nav, sidebar} from "./relaconf";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    base: '/Athen_blog/',
    title: "Athen blog",
    description: "Athen个人博客",
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        logo: 'avatar.jpg',
        nav: nav,
        sidebar: sidebar,
        search: {
            provider: 'local'
        },
        outline:{
            label: '本页目录',
            level: [2, 6],
        },
        editLink: {
            pattern: 'https://github.com/vuejs/vitepress/edit/main/docs/:path',
            text: 'Edit this page on GitHub'
        },
        footer: {
            message: 'Released under the MIT License.',
            copyright: 'Copyright © 2022-present Athen'
        },
        socialLinks: [
            {icon: 'xiaohongshu', link: 'https://www.xiaohongshu.com/user/profile/645756f800000000290132a5'},
            {icon: 'bilibili', link: 'https://space.bilibili.com/491407629?spm_id_from=333.1007.0.0'},
            {icon: 'github', link: 'https://github.com/vuejs/vitepress'},
            {icon: 'gitee', link: 'https://gitee.com/yangxin13'}
        ]
    }
})
