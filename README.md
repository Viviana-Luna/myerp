<h1 align="center">
  MyERP · 企业管理一体化平台
</h1>

<h4 align="center">前后端一体化企业办公与业务管理平台（Spring Boot 3 + Vue 3 / TypeScript）</h4>

<p align="center">
  <img src="https://img.shields.io/badge/JDK-21-red.svg" alt="JDK">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.5-blue.svg" alt="Spring Boot">
  <img src="https://img.shields.io/badge/Vue-3.5-brightgreen.svg" alt="Vue3">
  <img src="https://img.shields.io/badge/MySQL-8.0-blue.svg" alt="MySQL">
  <img src="https://img.shields.io/badge/Redis-7.x-red.svg" alt="Redis">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-GPLv3-blue.svg" alt="License"></a>
</p>

<p align="center">
  源码仓库：<a href="https://github.com/Viviana-Luna/myerp">https://github.com/Viviana-Luna/myerp</a>
</p>

---

## 简介

本项目为企业管理一体化平台（MyERP）的统一代码仓库：

- **后端服务（根目录）**：采用模块化架构设计，提供统一的身份认证、权限隔离、多租户与核心业务接口支持。
- **Web 前端（[`ruoyi-office-vben/`](ruoyi-office-vben/README.md)）**：采用桌面工作台 + 底部程序坞 Dock + 分模块全屏应用布局，整合 ERP、WMS、CRM、OA、BPM、HRM、EAM 等业务前端。

---

## 模块结构

| 模块 | 说明 |
|:---|:---|
| `yudao-dependencies` | Maven 依赖版本统一管理 |
| `yudao-framework` | 基础框架扩展（Web、安全、MyBatis、Redis、定时任务等） |
| `yudao-gateway` | 网关服务 |
| `yudao-server` | 主服务端启动模块 |
| `yudao-module-system` | 系统管理（用户、角色、菜单、权限、多租户、通知公告） |
| `yudao-module-infra` | 基础设施（代码生成、文件、配置、任务与日志） |
| `yudao-module-bpm` | 流程引擎与审批流转 |
| `yudao-module-oa` | OA 协同办公 |
| `yudao-module-hrm` | HRM 人力资源管理 |
| `yudao-module-crm` | CRM 客户关系管理 |
| `yudao-module-erp` | ERP 进销存管理 |
| `yudao-module-asset` | EAM 固定资产管理 |
| `yudao-module-wms` | WMS 仓储管理 |
| `yudao-module-mall` | MALL 企业商城 |
| `yudao-module-pay` | 支付管理 |
| `yudao-module-ai` | AI 智能助手 |
| `yudao-module-iot` | IoT 物联网 |
| `yudao-module-member` | 会员中心 |
| `yudao-module-mp` | 公众号管理 |
| `yudao-module-report` | 数据报表与大屏 |

---

## 本地构建与运行

### 环境要求

- JDK 17 或 21
- Maven 3.9+
- MySQL、Redis（及按需开启的 TDengine 等存储）

### 编译打包与启动

```bash
# 编译打包可执行 Jar
mvn -B -ntp -P boot -Dmaven.test.skip=true clean package

# 启动服务（默认端口 48080，按实际 profile 配置数据源与中间件）
java -jar yudao-server/target/yudao-server.jar
```

---

## 开源协议

本项目采用 [GNU General Public License v3.0 (GPLv3)](LICENSE) 协议开源，上游衍生声明见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。
