<h1 align="center">
  企业管理一体化平台 · Web 前端
</h1>

<h4 align="center">基于 Vue 3 + TypeScript + Ant Design Vue 的一体化企业办公与业务管理前端</h4>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.5-brightgreen.svg" alt="Vue3">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/Ant%20Design%20Vue-4.x-1677ff.svg" alt="Ant Design Vue">
  <img src="https://img.shields.io/badge/Vite-6.x-646cff.svg" alt="Vite">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-GPLv3-blue.svg" alt="License"></a>
</p>

<p align="center">
  仓库地址：<a href="https://github.com/Viviana-Luna/myerp">https://github.com/Viviana-Luna/myerp</a>
</p>

---

## 简介

本项目为企业管理一体化平台的 PC 管理端，采用 **桌面工作台 + 底部程序坞 Dock + 分模块全屏应用** 的交互形态，整合 ERP 进销存、WMS 仓储、CRM 客户管理、OA 协同办公、BPM 审批流程、HRM 人力资源、EAM 资产管理及系统管理等业务子系统。

### 界面与交互特性

- **工作台桌面（`/workspace/home`）**：无侧栏桌面画布，内置多款液态玻璃小组件（时钟与今日概览、ERP 经营速览、WMS 仓储动态、快捷指令、流程审批与单据、通知公告、日历与日程），支持自由拖拽排版、缩放与切换桌面壁纸。
- **底部程序坞（Dock）与启动台**：支持恒定总宽度的悬停平滑放大、多标签运行应用快速切换，以及全屏「启动台」检索与自定义固定应用。
- **应用全屏模式与侧栏拆分**：进入具体应用后自动铺满全屏并收起 Dock，左侧菜单仅展示当前所属应用菜单树；可在左侧边栏底部点击「程序坞」按需呼出 Dock 切换应用。

---

## 核心业务模块

| 模块 | 目录 / 路由 | 说明 |
|:---|:---|:---|
| 工作台桌面 | `/workspace/home` | 自定义小组件桌面与快捷入口 |
| ERP 进销存 | `/erp` | 采购、销售、库存与财务管理 |
| WMS 仓储管理 | `/wms` | 仓库档案、采购入库与出入库管理 |
| CRM 客户管理 | `/crm` | 线索、客户、联系人、商机、合同与回款 |
| OA 协同办公 | `/oa` | 日常事务审批、协同办公 |
| BPM 流程中心 | `/bpm` | 可视化流程设计器、待办与流转 |
| HRM 人力资源 | `/hrm` | 组织架构、员工档案与考勤管理 |
| EAM 资产管理 | `/asset` | 固定资产台账、领用与盘点 |
| 系统与基础设施 | `/system`, `/infra` | 用户/角色/权限/多租户、定时任务与系统监控 |

---

## 快速开始

### 环境要求

- Node.js >= 20.19.0
- pnpm >= 10.0.0

### 安装与运行

```bash
# 安装依赖
pnpm install

# 启动开发环境（默认端口 5666）
pnpm dev:antd

# 类型检查与构建
pnpm --filter @vben/web-antd typecheck
pnpm --filter @vben/web-antd build
```

默认接口代理目标可在 `apps/web-antd/.env.development`（`VITE_BASE_URL`）与 `apps/web-antd/vite.config.mts` 中按实际后端地址配置。

---

## 目录结构

```text
├── apps/
│   └── web-antd/                 # 主应用（桌面外壳、业务页面、路由与状态）
│       └── src/
│           ├── layouts/          # 布局外壳及 macOS 桌面/Dock/菜单栏组件
│           ├── views/            # 各业务模块页面与桌面小组件
│           ├── preferences.ts    # 应用级默认偏好设置
│           └── bootstrap.ts      # 应用引导入口
├── packages/                     # Workspace 共享基础包
└── internal/                     # 构建与代码规范配置
```

---

## 开源协议

基于 [GNU General Public License v3.0 (GPLv3)](LICENSE) 协议开源。
