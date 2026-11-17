# Feature Spec: 001 · macOS 风格桌面工作台与 Dock 应用外壳（Baseline）

- **Spec ID**: `001-macos-desktop-shell`
- **状态**: `Implemented`
- **关联实现**：
  - [basic.vue](../../../../ruoyi-office-vben/apps/web-antd/src/layouts/basic.vue)
  - [preferences.ts](../../../../ruoyi-office-vben/apps/web-antd/src/preferences.ts)
  - `apps/web-antd/src/layouts/macos/*`
  - `apps/web-antd/src/views/dashboard/home/desktop/*`
  - [macos-shell.css](../../../../ruoyi-office-vben/apps/web-antd/src/styles/macos-shell.css)

---

## 1. 背景与目标

系统涵盖 17 个以上一级业务模块（ERP、WMS、CRM、OA、BPM、HRM、EAM、IoT 等），传统「顶部横向一级导航 + 左侧树 + 全局多标签」容易导致工作区拥挤与跨模块标签混杂。本规格确立一套原生化的 **macOS 桌面工作台 + Dock 程序坞 + 应用全屏窗口** 外壳，将桌面概览与业务系统操作明确分层。

---

## 2. 核心设计要求（已落地基线）

### 2.1 默认桌面首页（`/workspace/home`）

- 登录后默认进入 `/workspace/home`（不进入业务侧栏视图），桌面路由标记 `hideInTab: true`，不进入业务页签列表。
- 桌面采用 `MacOsDesktopWorkspace` 24 栅格画布，内置 7 款液态玻璃小组件（`mac_clock_greeting`、`mac_erp_overview`、`mac_wms_overview`、`mac_todo_tasks`、`mac_notice_board`、`mac_calendar_schedule`、`mac_quick_shortcuts`），支持拖拽/缩放/自定义添删/重置及 4 套壁纸（`sequoia`、`tahoe`、`dawn`、`aurora`）。
- 兼容保留 `?preview=<pageId>` 参数跳转原 `LayoutRenderer` 预览首页配置。

### 2.2 顶部菜单栏（`MacOsMenuBar`）与窗口标题栏（`MacOsAppWindowBar`）

- 顶部常驻轻量 `MacOsMenuBar`，替换原生 Vben Header（`header.enable: false, height: 0`），提供应用名标识、一键回桌面、壁纸切换、全局搜索、通知中心、偏好设置与精简用户菜单（仅保留个人中心/锁屏/退出）。
- 进入业务应用后自动渲染全屏窗口及 `MacOsAppWindowBar`，**取消绿色全屏按钮**（窗口默认全屏），按当前所属一级应用过滤并展示内部页签；右侧菜单树仅展示当前应用的子菜单。

### 2.3 底部 Dock 程序坞与侧栏触发入口

- **桌面态**：底部常驻居中显示 `MacOsDockBar`，内置「桌面」+「已固定与运行中的应用」+「启动台」；悬停缩放通过单条 `requestAnimationFrame` 循环驱动且约束总扩展增量 `MAX_HOVER_EXPAND_SUM = 36`，保证滑动过程整条 Dock 宽度恒定不变。
- **应用窗口态**：进入应用或切换页面时自动收起底部 Dock，释放垂直视野；通过 Vue `<Teleport>` 在左侧边栏 `aside` 底部渲染「程序坞」触发按钮（`macos-sidebar-dock-btn`），由用户主动点击呼出或收纳 Dock 切换应用。

---

## 3. 验收标准回顾

1. 登录后直接落入 `/workspace/home` 桌面画布，底部 Dock 常驻显示、无左侧侧栏。
2. 点击任一业务应用图标进入后，窗口铺满工作区、底部 Dock 自动收起、左侧菜单仅含该应用子菜单，且窗口顶部无冗余全屏按钮。
3. 点击左侧菜单栏底部的「程序坞」按钮，底部 Dock 顺利弹出；切换路由或打开启动台后再次自动收纳。
4. 关闭某个应用的最后一个标签页后自动退回桌面工作台；切回曾打开过的应用自动恢复该应用最近访问页面。
