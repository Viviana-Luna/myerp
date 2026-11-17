# 00 · MyERP 工程宪章（Project Constitution）

本宪章规定了 MyERP（`https://github.com/Viviana-Luna/myerp`）在架构演进、功能开发与 AI Agent 协作过程中不可妥协的核心约束。

---

## 一、开源合规与品牌中立原则

1. **开源协议一致性**：
   - 全仓库统一采用 **GNU General Public License v3.0（`GPL-3.0-or-later`）** 开源发布（根目录 [LICENSE](../../LICENSE) 与前端 [ruoyi-office-vben/LICENSE](../../ruoyi-office-vben/LICENSE)）。
   - 所有子模块 Maven POM、前端 `package.json`、Swagger 文档元信息与生产打包头均须声明同一开源许可及本项目仓库地址，并完整保留 [THIRD-PARTY-NOTICES.md](../../THIRD-PARTY-NOTICES.md) 中的上游 MIT 版权声明。
2. **禁止上游引流与追踪残留**：
   - 不允许在登录页、导航菜单、帮助弹窗、关于页面、控制台 Banner 或前端构建脚本中保留原框架推广文案、交流群二维码、第三方文档横幅（`VITE_APP_DOCALERT_ENABLE=false`）或外部统计 ID（`VITE_APP_BAIDU_CODE=''`）。

---

## 二、架构边界与模块化原则

1. **后端契约与实现分离**：
   - 每个 `yudao-module-*` 业务模块必须遵循 `*-api`（DTO、枚举、RPC/Api 接口）与 `*-server`（Controller、Service、DAL、Convert）分层；跨模块调用优先依赖 `*-api`，严禁跨模块直连对方 `dal.mysql` Mapper。
2. **单体重打包规则**：
   - 本仓库当前以 `yudao-server` 单体合并部署为核心运行态（聚合 19 个业务模块），打包必须显式启用 `-P boot`（`skip.repackage=true`），不得破坏 `cloud`（微服务）Profile 的兼容性结构。
3. **前端 Workspace 分层**：
   - 基础通用 UI 与布局底座沉淀在 `ruoyi-office-vben/packages/`，业务页面与 macOS 桌面应用外壳收敛在 `apps/web-antd/src/`。
   - 若调整 `packages/@core/base/shared/` 等编译型包，必须同步执行其构建产物刷新（`pnpm --filter @vben-core/shared build`）。

---

## 三、安全、多租户与数据底线

1. **多租户隔离不可绕过**：
   - 系统默认开启多租户隔离（`yudao.tenant.enable=true`、`VITE_APP_TENANT_ENABLE=true`）。任何新增业务表默认必须包含 `tenant_id` 字段；确属全局共享表的，必须登记至 `yudao.tenant.ignore-tables`。
2. **接口鉴权与加解密**：
   - 后台管理接口统一挂载在 `/admin-api/**` 下并由 Spring Security 校验权责；免登录放行仅限明确配置的路径（如认证、回调接口）。
   - 敏感接口传输遵循 `yudao.api-encrypt` 与前端 `X-Api-Encrypt`（AES/RSA）约定。
3. **零真实密钥入库**：
   - 严禁向源码、配置文件、`script/sql/**` 初始化脚本或单元测试中提交任何真实或可触发秘钥扫描规则的云服务凭据；示例配置统一使用 `YOUR_*` 占位符。

---

## 四、macOS 桌面外壳交互不变量

1. **桌面即工作台**：
   - 登录后默认落点为 `/workspace/home`（`MacOsDesktopWorkspace`），无左侧业务侧栏、顶部采用 `MacOsMenuBar`、底部常驻等宽自适应 `MacOsDockBar`。
2. **应用窗口全屏态与标签归属**：
   - 从桌面或启动台（Launchpad）进入任一业务应用后，窗口自动铺满桌面区域且自动收起底部 Dock；页面内页签由 `MacOsAppWindowBar` 按当前所属一级应用隔离展示，仅关闭当前应用最后一个标签页时才退回桌面。
   - 底部 Dock 的应用内呼出入口统一收口于左侧菜单栏底部的「程序坞」按钮（通过 `<Teleport>` 注入 `aside`）。
3. **偏好锁保护**：
   - `apps/web-antd/src/layouts/basic.vue` 启动时强制纠偏关键布局偏好（`mixed-nav`、`header.enable=false`、`tabbar.height=0`、`navigation.split=true`），禁止在未经过 SDD 评审的情况下放开覆盖导致 `keep-alive` 失效或顶栏双头冲突。

---

## 五、Spec-Driven Development（SDD）门禁规则

| 变更等级                | 示例场景                                           | SDD 要求                                                                             |
| :---------------------- | :------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **L1 · 微调/修补**      | 单点 UI 文案/样式修复、明确偶现 Bugfix             | 无需新建 Spec；直接代码修复并执行受影响范围检查                                      |
| **L2 · 标准功能迭代**   | 新增业务单据页面/后端 CRUD/桌面小组件              | 在 `docs/sdd/specs/<NNN>-<slug>/` 建立完整 `spec.md` + `plan.md` + `tasks.md` 后实施 |
| **L3 · 架构与壳层变更** | 调整 macOS 外壳布局、全局多租户/加密机制、模块拆分 | 除建立 Spec 外，完成后必须同步更新 `docs/sdd/01~03` 基线设计文档                     |

> **实证交付门禁**：所有任务完成判定均以真实命令输出或浏览器实测为准；未运行的测试或因条件受阻的检查必须在结论中显式标注范围。
