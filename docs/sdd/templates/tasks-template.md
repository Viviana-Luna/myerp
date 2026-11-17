# Implementation Tasks: <NNN> · <特性名称>

- **对应 Plan**: 同目录 `plan.md`（复制到 `docs/sdd/specs/<NNN>-<slug>/` 后链接）

---

## 任务清单

### Phase 1 · 数据与基础契约

- [ ] **T1**：`<SQL 脚本更新与本机数据库执行验证>`
  - 涉及文件：`script/sql/mysql/...`
  - 完成标准：语句幂等可执行，`tenant_id` 与公共字段完整。
- [ ] **T2**：`<后端 *-api DTO / Enum 定义>`
  - 涉及文件：`yudao-module-xxx/yudao-module-xxx-api/...`

### Phase 2 · 后端服务实现

- [ ] **T3**：`<DAL 层 DO / Mapper 编写>`
- [ ] **T4**：`<Service 层核心业务逻辑与单测>`
- [ ] **T5**：`<Controller 层接口暴露与权限注解>`
- [ ] **T6**：运行 `mvn -B -ntp -P boot -Dmaven.test.skip=true clean package` 并启动验证接口

### Phase 3 · 前端实现

- [ ] **T7**：`<API 客户端封装与类型定义>`
- [ ] **T8**：`<页面组件、弹窗/表单与桌面工作台集成>`
- [ ] **T9**：若涉及共享包，执行 `pnpm --filter @vben-core/shared build` 或相应包编译

### Phase 4 · 端到端验证与文档收敛

- [ ] **T10**：运行 ESLint、Prettier、`vue-tsc`（确保本次改动文件 0 新增错误）
- [ ] **T11**：在浏览器实测核心交互流程、多租户与权限隔离
- [ ] **T12**：更新本 Spec 状态为 `Implemented`，并按需回写 `docs/sdd/01~03`
