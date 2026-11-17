# MyERP 软件设计与规范驱动开发（SDD）文档中心

本目录（`docs/sdd/`）整合 **系统软件设计文档（Software Design Document）** 与 **Spec-Driven Development（SDD）开发规范体系**，配合根目录 [AGENTS.md](../../AGENTS.md) 作为本仓库的工程唯一真实源（Single Source of Truth）。

---

## 目录导航

### 一、工程宪章与系统设计基线

| 文档                                                                   | 内容说明                                                                        |
| :--------------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| [00-constitution.md](00-constitution.md)                               | 项目工程宪章：核心原则、架构不变量、安全/多租户/外壳底线与 SDD 门禁规则         |
| [01-system-architecture.md](01-system-architecture.md)                 | 总体系统架构、技术栈清单、单体/微服务双模式与中间件拓扑                         |
| [02-backend-design.md](02-backend-design.md)                           | 后端架构设计：模块化划分、认证鉴权、多租户、API 加解密、工作流与 SQL 多方言脚本 |
| [03-frontend-macos-shell-design.md](03-frontend-macos-shell-design.md) | 前端架构设计：Monorepo 分层、动态路由/请求管道、macOS 桌面外壳与液态玻璃小组件  |

### 二、SDD 工作流与标准模板

| 文档                                                                 | 内容说明                                                                         |
| :------------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| [04-sdd-workflow-and-templates.md](04-sdd-workflow-and-templates.md) | SDD 四阶段执行流程（`Specify -> Plan -> Tasks -> Implement & Verify`）与评审清单 |
| [templates/spec-template.md](templates/spec-template.md)             | 功能规格说明模板（`01` / `spec.md`）                                             |
| [templates/plan-template.md](templates/plan-template.md)             | 技术实现方案模板（`02` / `plan.md`）                                             |
| [templates/tasks-template.md](templates/tasks-template.md)           | 可执行任务与验证清单模板（`03` / `tasks.md`）                                    |

### 三、需求规格档案（`specs/`）

| Spec ID                                                          | 说明                                                                      | 状态               |
| :--------------------------------------------------------------- | :------------------------------------------------------------------------ | :----------------- |
| [001-macos-desktop-shell](specs/001-macos-desktop-shell/spec.md) | macOS 风格工作台桌面、恒定总宽 Dock、应用全屏窗口与侧栏程序坞按钮设计基线 | 已实现（Baseline） |

---

## 快速上手

1. **做需求或大改前**：先阅读 [00-constitution.md](00-constitution.md) 与对应的系统设计文档（`01`–`03`）。
2. **新建特性目录**：按 [04-sdd-workflow-and-templates.md](04-sdd-workflow-and-templates.md) 在 `docs/sdd/specs/<NNN>-<feature-slug>/` 创建 `spec.md`、`plan.md`、`tasks.md`。
3. **开发与验证**：严格按 [AGENTS.md](../../AGENTS.md) 中的构建与检查命令完成自测，并在完成后同步更新 Spec 状态与系统设计文档。
