import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    /** 后端路由模式 */
    accessMode: 'backend',
    name: import.meta.env.VITE_APP_TITLE,
    enableRefreshToken: true,
    layout: 'mixed-nav',
    defaultAvatar: '',
    /** 默认首页路径：直接进入 macOS 桌面 */
    defaultHomePath: '/workspace/home',
    contentPadding: 0,
    contentPaddingBottom: 0,
    contentPaddingLeft: 0,
    contentPaddingRight: 0,
    contentPaddingTop: 0,
    /** 偏好设置按钮放进顶部 macOS 菜单栏 */
    preferencesButtonPosition: 'header',
  },
  header: {
    enable: false,
    height: 0,
  },
  // 自定义应用 Logo（将图片放在 apps/web-antd/public/static/imgs/ 目录下）

  logo: {
    enable: true,
    fit: 'contain',
    // 使用 BASE_URL 动态获取 base 路径，支持部署在子路径下
    // 开发环境: /static/imgs/logo.png
    // 生产环境: /web/static/imgs/logo.png
    // 注意：BASE_URL 已包含末尾斜杠，所以不需要再加斜杠
    source: `${import.meta.env.BASE_URL}static/imgs/logo.png`,
  },

  theme: {
    mode: 'light',
    semiDarkHeader: false,
    semiDarkSidebar: false,
  },
  sidebar: {
    autoActivateChild: true,
  },
  footer: {
    /** 默认关闭 footer 页脚，因为有一定遮挡 */
    enable: false,
    fixed: false,
  },
  copyright: {
    companyName: import.meta.env.VITE_APP_TITLE,
    companySiteLink: '',
    date: '2026',
  },
  /**
   * 保留 tabbar 挂载以维持 keep-alive，实际多标签显示由 macOS 应用窗口栏接管
   */
  tabbar: {
    height: 0,
    keepAlive: true,
    showIcon: false,
  },
  navigation: {
    showIcon: true,
    split: true,
  },
  // 面包屑配置 - 隐藏图标
  breadcrumb: {
    showIcon: false,
  },
});
