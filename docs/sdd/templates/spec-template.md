# Feature Spec: <NNN> · <特性名称>

- **Spec ID**: `<NNN>-<kebab-case-slug>`
- **状态**: `Draft` | `In Review` | `Approved` | `Implemented`
- **负责人**: `<Author / Agent>`
- **关联模块**: `<例如 yudao-module-erp / apps/web-antd>`
- **创建日期**: `<YYYY-MM-DD>`

---

## 1. 背景与目标（Problem & Goal）

- **业务背景 / 痛点**：简述为什么要做这项改动，解决什么实际问题。
- **核心目标**：用 1–3 条可衡量的句子说明期望结果。

---

## 2. 范围界定（Scope）

### 2.1 In Scope（本次包含）

- [ ] 功能点 1
- [ ] 功能点 2

### 2.2 Out of Scope（明确不做）

- 不包含的内容 1（避免范围蔓延）

---

## 3. 用户场景与交互流程（User Scenarios）

### 场景 1：<场景标题>

- **前置条件**：<角色权限、租户状态、依赖模块开关>
- **操作流**：
  1. 用户执行 ...
  2. 系统响应 ...
- **异常与边界情况**：
  - 无权限 / 参数非法 / 网络超时 / 空数据态的处理方式

---

## 4. 数据与接口需求概要（Functional & Data Requirements）

- **涉及数据实体 / 表**：`<表名、是否需 tenant_id、逻辑删除等>`
- **涉及接口概要**：`<例如 GET/POST /admin-api/...>`
- **权限标识与菜单变化**：`<例如 erp:xxx:query、前端菜单路由路径>`

---

## 5. 验收标准（Acceptance Criteria）

1. **AC-1**：Given `<条件>`，When `<动作>`，Then `<可观测结果>`。
2. **AC-2**：Given `<异常条件>`，When `<动作>`，Then `<预期提示或兜底行为>`。
3. **AC-3（工程门禁）**：所有修改文件无新增 Lint/TypeScript/编译错误，且满足宪章约束（`docs/sdd/00-constitution.md`）。
