# Technical Plan: <NNN> · <特性名称>

- **对应 Spec**: 同目录 `spec.md`（复制到 `docs/sdd/specs/<NNN>-<slug>/` 后链接）
- **状态**: `Draft` | `Approved`

---

## 1. 宪章合规核查（Constitution Check）

- [ ] **开源与去品牌**：无外部推广链接、统计埋点或 GPLv3 冲突依赖
- [ ] **模块化边界**：后端跨模块仅通过 `*-api` 交互；`@Resource` Mapper 字段名具备模块前缀区分度
- [ ] **多租户与安全**：新表含 `tenant_id`（或声明至 `ignore-tables`）；新接口明确鉴权注解与加解密兼容性
- [ ] **macOS 外壳不变量**：未破坏 `/workspace/home` 默认桌面、`MacOsAppWindowBar`、`MacOsDockBar` 与侧栏「程序坞」按钮行为
- [ ] **打包与构建兼容**：兼容 `-P boot` 单体构建与 Vite 构建规则（注意 `vite.config.mts` 对 `asset`/`wms` 的排除逻辑）

---

## 2. 架构与模块改动设计

### 2.1 后端改动（`yudao-*` & `script/sql/`）

- **数据库脚本**：`<script/sql/mysql/... 变更点>`
- **API 契约（`*-api`）**：`<新增或变更 DTO / Enum / Api>`
- **业务实现（`*-server`）**：
  - Controller：`<路径、权限注解 @PreAuthorize>`
  - Service：`<核心校验逻辑、事务边界、事件/BPM 集成>`
  - DAL：`<DO / Mapper / XML>`

### 2.2 前端改动（`ruoyi-office-vben/`）

- **共享包变更（如有）**：`<packages/* 及需同步构建的包>`
- **API 与类型（`apps/web-antd/src/api/`）**：`<接口封装与 encrypt 标志>`
- **页面与状态（`apps/web-antd/src/views/` & `layouts/`）**：`<组件拆分、路由路径与 keep-alive 考量>`

---

## 3. 风险点与兼容策略

- **已知风险**：`<例如历史数据迁移、旧菜单缓存、大表单性能>`
- **回滚与降级方案**：`<具体回滚路径或特性开关>`

---

## 4. 验证计划（Verification Plan）

- **后端验证**：`<Maven 编译、单测类、Swagger/curl 验证用例>`
- **前端验证**：`<eslint / prettier / typecheck / build / 浏览器端到端检查路径>`
