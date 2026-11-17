# AGENTS.md — MyERP 仓库协作与开发规范

本文件面向所有在本仓库中工作的 AI Coding Agent 与工程师，提供代码库结构、构建验证命令、核心架构不变量以及 Spec-Driven Development（SDD）工作流指引。

---

## 1. 仓库概览与目录结构

- **仓库定位**：MyERP 企业管理一体化平台前后端统一仓库（`https://github.com/Viviana-Luna/myerp`）
- **开源协议**：GNU General Public License v3.0（[LICENSE](LICENSE)，兼容声明见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)）
- **目录布局**（扁平化单体根仓库）：
  - **根目录（后端 Java / Spring Boot 3.5.9 / JDK 17+）**：
    - `pom.xml`：多模块聚合 POM，定义 `boot`（单体）与 `cloud`（微服务，默认激活）两个 Profile
    - `yudao-dependencies/`：全工程依赖版本管理 BOM
    - `yudao-framework/`：基础技术底座（`yudao-common`、`yudao-common-server` 及 16 个 `yudao-spring-boot-starter-*`）
    - `yudao-gateway/`：API 网关模块（微服务部署模式使用）
    - `yudao-server/`：单体启动主容器（`YudaoServerApplication`），聚合引入 19 个业务模块
    - `yudao-module-*`：业务模块（每个模块拆分为 `*-api` 对外契约与 `*-server` 业务实现，其中 `yudao-module-mall` 含 `product` / `promotion` / `trade` / `statistics`，`yudao-module-iot` 额外含 `core` / `gateway`）
  - **前端 Monorepo（`ruoyi-office-vben/`，Vue 3.5 / TypeScript 5.9 / pnpm 10 / Turborepo）**：
    - `apps/web-antd/`：主管理端应用（Ant Design Vue 4 + macOS 桌面工作台外壳）
    - `packages/@core/`、`packages/effects/`、`packages/*`：基础能力包与 UI 组件库
    - `internal/`：构建配置（`@vben/vite-config`）、Tailwind 与 Lint 规范配置
  - **脚本与文档**：
    - `script/sql/`：全数据库方言脚本（`mysql/`、`dm/`、`kingbase/`、`opengauss/`、`oracle/`、`postgresql/`、`sqlserver/`）
    - `script/docker/`、`script/idea/`：容器与 IDE 辅助配置
    - `docs/`：部署指南（[后端部署指南.md](docs/后端部署指南.md)）与 SDD 设计文档中心（[docs/sdd/README.md](docs/sdd/README.md)）
    - `dev.sh`、`SETUP.md`：本地开发启停脚本与环境说明

---

## 2. Spec-Driven Development（SDD）执行规范

所有 **新增功能、跨模块重构、接口/库表变更、macOS 外壳/工作台改造**，在编写业务代码前应优先遵循 [docs/sdd/](docs/sdd/README.md) 的 SDD 流程：

1. **先读基线**：先查阅 [00-constitution.md](docs/sdd/00-constitution.md) 及对应设计文档（`01` 架构、`02` 后端、`03` 前端外壳），确保不破坏已有不变量。
2. **先定 Spec 再写代码**：在 `docs/sdd/specs/<序号>-<短横线名称>/` 下按模板创建：
   - `spec.md`（参考 [spec-template.md](docs/sdd/templates/spec-template.md)）：明确业务背景、用户场景、接口/数据边界、验收标准（Acceptance Criteria）与非目标。
   - `plan.md`（参考 [plan-template.md](docs/sdd/templates/plan-template.md)）：确认涉及模块、表结构/DTO、路由与状态流、兼容性及验证方式。
   - `tasks.md`（参考 [tasks-template.md](docs/sdd/templates/tasks-template.md)）：拆分为可独立验证的小步任务。
3. **小步修复豁免**：单点文案/样式微调、明确定位的小型 Bugfix 可直接实施并在完成后更新相关文档/验证。

---

## 3. 常用开发、构建与检查命令

### 3.1 统一开发脚本（仓库根目录）

```bash
./dev.sh status    # 查看前后端端口(48080/5666)及 MySQL/Redis/TDengine 状态
./dev.sh build     # 使用 -P boot 编译打包后端 yudao-server/target/yudao-server.jar
./dev.sh backend   # 后台启动后端（默认 spring.profiles.active=local，日志 .tmp/logs/yudao-server.log）
./dev.sh frontend  # 后台启动前端 Vite 开发服务（端口 5666，日志 .tmp/frontend.log）
./dev.sh stop      # 停止本地前后端进程
./dev.sh logs      # 查看后端运行日志尾部
```

### 3.2 后端 Maven 命令

- **单体打包（必须带 `-P boot`）**：

```bash
mvn -B -ntp -P boot -Dmaven.test.skip=true clean package
```

> **禁止在打包单体 `yudao-server.jar` 时省略 `-P boot`**：根 `pom.xml` 默认激活 `cloud` Profile（`skip.repackage=false`），省略 `-P boot` 会让子模块被二次打成嵌套可执行 Jar，导致主程序扫描不到业务模块 Bean。

### 3.3 前端 pnpm 命令（在 `ruoyi-office-vben/` 下执行）

```bash
# 如触发 corepack 交互提示，可先设置 COREPACK_ENABLE_DOWNLOAD_PROMPT=0
pnpm dev:antd                                   # 启动主应用开发服务器（端口 5666）
pnpm --filter @vben/web-antd build              # 生产环境构建（base=/web/）
pnpm --filter @vben/web-antd typecheck          # TypeScript 类型检查（vue-tsc）
pnpm --filter @vben-core/shared build           # 修改 packages/@core/base/shared 后必须重编 dist
pnpm --filter @vben/vite-config stub            # 修改 internal/vite-config 后刷新 stub
./node_modules/.bin/prettier --check <files>    # 格式检查
./node_modules/.bin/eslint <files>              # 代码规范检查
```

> **类型检查注意**：仓库现有上游基线业务代码（如部分 `src/api/asset/`、`src/api/bpm/`、`src/api/wms/` 等）存在历史 `vue-tsc` 报错；验收新改动时必须确认**所有新增与修改文件实现 0 新增类型错误**。

---

## 4. 关键架构不变量与常见避坑指南

### 4.1 后端（Java / Spring Boot）

1. **包名与依赖注入规范**：
   - 扫描根包为 `${yudao.info.base-package}` = `cn.iocoder.yudao`（见 `yudao-server/src/main/resources/application.yaml`），禁止未经全库协调擅自更改包前缀。
   - 多模块共用 `@Resource` 按字段名注入时，跨模块 Bean / Mapper 字段命名应保持领域前缀唯一性（例如 `erpPurchaseOrderMapper` 与 `wms` 的 `PurchaseOrderMapper` 避免同名冲突）。
2. **多租户与数据权限**：
   - 启用 `yudao.tenant.enable=true` 时，业务表须包含 `tenant_id` 列，或显式配置在 `yudao.tenant.ignore-tables` 中；否则分页/查询将报 `Unknown column 'tenant_id'`。
   - 前端请求必须携带 `tenant-id`（以及超管切换租户时的 `visit-tenant-id`），逻辑已封装在 `ruoyi-office-vben/apps/web-antd/src/api/request.ts`。
3. **API 加解密与接口前缀**：
   - 后端业务接口前缀统一由 `/admin-api` 代理（Vite 开发代理配置见 `apps/web-antd/vite.config.mts`）。
   - `yudao.api-encrypt.enable` 与前端 `VITE_APP_API_ENCRYPT_ENABLE` 当前默认均为 `true`（AES + `X-Api-Encrypt` 请求头），联调加解密接口需保持前后端开关与密钥一致。
4. **本地存储中间件**：
   - 主数据源为 MySQL（库名 `ruoyi-office`），IoT 时序数据源为 TDengine（`jdbc:TAOS-WS://127.0.0.1:6041/ruoyi_vue_pro`，使用 `WebSocketDriver`）。

### 4.2 前端（macOS 桌面外壳与主应用）

1. **桌面外壳锁定机制**：
   - 认证守卫、菜单加载与布局入口见 `apps/web-antd/src/layouts/basic.vue`、`src/preferences.ts` 及 `src/layouts/macos/`。
   - `basic.vue` 在初始化时会强制校正本地旧缓存偏好：`layout: 'mixed-nav'`、`defaultHomePath: '/workspace/home'`、`header.enable: false`、`header.height: 0`、`tabbar.enable: true`、`tabbar.height: 0`、`navigation.split: true`。**不要移除该校正逻辑**，也不要把 `tabbar.enable` 改为 `false`（`tabbar` 挂载用于保持 `keep-alive`，视觉多标签由 `MacOsAppWindowBar` 接管）。
2. **Dock 与侧栏交互约定**：
   - 处于桌面路由（`/workspace/home`）时，常驻显示底部 Dock（`MacOsDockBar`，恒定总宽度滑移曲线放大）；进入具体业务应用时窗口铺满全屏、Dock 自动收起，仅通过左侧边栏底部 `<Teleport>` 渲染的 `macos-sidebar-dock-btn`（「程序坞」按钮）主动呼出或切换。
   - `MacOsAppWindowBar` 不展示“绿色全屏按钮”，仅保留侧栏折叠、当前应用标签切换、刷新与关闭页签（关闭应用最后一个页签自动退回桌面）。
3. **Vite 生产构建排除规则**：
   - `apps/web-antd/vite.config.mts` 中配置了 `excludeDirectoriesPlugin()`，在生产 Rollup 打包阶段会排除 `src/views/asset/` 与 `src/views/wms/` 目录；若需发布资产/仓储模块页面，需先评估并调整该插件配置。
4. **共享包构建联动**：
   - 修改 `packages/@core/base/shared/` 下导出内容后必须运行 `pnpm --filter @vben-core/shared build`，因为工作区默认消费其 `dist/` 导出；修改 `internal/vite-config/` 后需运行 `pnpm --filter @vben/vite-config stub`。
5. **去品牌与外链约束**：
   - 保持 `VITE_APP_DOCALERT_ENABLE=false` 与 `VITE_APP_BAIDU_CODE=` 为空；禁止在前端登录页、用户下拉菜单、关于页、帮助弹窗或后端启动日志中引入第三方商业推广、二维码、外链或统计脚本。

---

## 5. Git、安全与提交规范

1. **禁止入库的敏感与构建产物**：
   - 禁止向 `script/sql/`、`application*.yaml` 或测试类中写入看似真实云厂商密钥的字面量（如 `AKID*`、`LTAI*`、`AKLT*` 等，GitHub Push Protection 会直接拦截推送），示例配置请使用 `YOUR_*` 占位符。
   - 禁止提交 `.tmp/`、`.m2repo/`、`.pnpm-store/`、`.corepack/`、`node_modules/`、`target/`、`dist/`、`.DS_Store`。
2. **提交规范**：
   - 提交信息遵循 Conventional Commits（仓库配置 `@vben/commitlint-config`），如 `feat(erp): ...`、`fix(macos-shell): ...`、`docs(sdd): ...`、`chore: ...`。
3. **验证原则**：
   - 任何改动在声明完成前，需实测受影响模块的 lint/typecheck/build 或端到端行为，并在汇报中如实说明验证范围及任何受限/未执行项。
