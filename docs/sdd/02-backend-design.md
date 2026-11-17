# 02 · 后端软件设计文档（Backend Design）

## 一、工程组织与分层结构

后端工程基于多模块 Maven 结构组织，统一扫描根包为 `${yudao.info.base-package}` = `cn.iocoder.yudao`（入口类 [YudaoServerApplication.java](../../yudao-server/src/main/java/cn/iocoder/yudao/server/YudaoServerApplication.java)）。

### 1.1 基础底座（`yudao-framework/`）

包含公共模块与 16 个自动装配 Starter：

| 模块                                                                                             | 核心职责                                                                                      |
| :----------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| `yudao-common` / `yudao-common-server`                                                           | 统一返回结构、异常码、通用工具与 Server 公共切面                                              |
| `yudao-spring-boot-starter-web`                                                                  | WebMvc、全局异常、Swagger/Knife4j、XSS 过滤、API 加解密、启动 Banner                          |
| `yudao-spring-boot-starter-security`                                                             | Spring Security 认证授权、Token 解析、操作日志                                                |
| `yudao-spring-boot-starter-mybatis`                                                              | MyBatis-Plus、分页、多数据源（Dynamic-Datasource）与逻辑删除                                  |
| `yudao-spring-boot-starter-biz-tenant`                                                           | 多租户上下文（`tenant-id` / `visit-tenant-id`）与自动条件拦截                                 |
| `yudao-spring-boot-starter-biz-data-permission`                                                  | 部门/个人维度数据权限 SQL 重写                                                                |
| `yudao-spring-boot-starter-redis`                                                                | Redisson 缓存与 Redis 序列器                                                                  |
| `yudao-spring-boot-starter-mq`                                                                   | 消息总线抽象（本地 Event / Redis / RocketMQ / Kafka / RabbitMQ）                              |
| `yudao-spring-boot-starter-websocket`                                                            | 实时消息通道（路径 `/infra/ws`，本地默认 `sender-type: local`）                               |
| `yudao-spring-boot-starter-job`                                                                  | 定时任务支持（`xxl-job` 默认关闭 `enabled: false`）                                           |
| `yudao-spring-boot-starter-excel` / `env` / `monitor` / `protection` / `rpc` / `test` / `biz-ip` | 导入导出、环境处理、监控、幂等限流锁（Lock4j）、RPC、单测底座、IP 归属解析（`ip2region.xdb`） |

### 1.2 业务模块矩阵（已全量接入 `yudao-server/pom.xml`）

所有业务模块均按 `*-api`（契约/枚举/DTO/Api）与 `*-server`（Controller/Service/DAL）拆分子工程：

| 业务域       | Maven 模块（`*-server`）                                                    | 核心功能域                                                                                                      |
| :----------- | :-------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| 系统管理     | `yudao-module-system-server`                                                | 用户、角色、菜单、部门、岗位、字典、租户、通知公告、桌面首页配置（`system_home_*`）、日程（`system_schedule*`） |
| 基础设施     | `yudao-module-infra-server`                                                 | 代码生成、文件配置与存储（DB/本地/SFTP/S3）、系统参数、API 日志                                                 |
| 流程中心     | `yudao-module-bpm-server`                                                   | 基于 Flowable 7.2.0 的流程模型、审批流、表单设计与待办任务                                                      |
| 协同办公     | `yudao-module-oa-server`                                                    | 车辆、印章、文件及日常协同审批                                                                                  |
| 人力资源     | `yudao-module-hrm-server`                                                   | 员工档案、组织人事、考勤管理                                                                                    |
| 固定资产     | `yudao-module-asset-server`                                                 | 资产台账、领用、流转与盘点                                                                                      |
| 仓储管理     | `yudao-module-wms-server`                                                   | 仓库档案、采购入库、通用出入库单据                                                                              |
| 客户关系     | `yudao-module-crm-server`                                                   | 线索、客户、联系人、商机、合同与回款（含 BPM 审批监听）                                                         |
| 进销存 ERP   | `yudao-module-erp-server`                                                   | 产品、采购、销售、库存、收付款与经营统计                                                                        |
| 企业商城     | `yudao-module-mall`（`product`、`promotion`、`trade`、`statistics`）        | 商品、营销促销、交易订单与商城统计                                                                              |
| 会员与支付   | `yudao-module-member-server`、`yudao-module-pay-server`                     | 会员等级/积分、支付商户/渠道/订单与退款                                                                         |
| 公众号与报表 | `yudao-module-mp-server`、`yudao-module-report-server`                      | 公众号配置、积木报表与大屏设计器                                                                                |
| 智能与物联网 | `yudao-module-ai-server`、`yudao-module-iot-server`（含 `core`、`gateway`） | AI 对话/生图/知识库向量检索、IoT 设备物模型与 TDengine 时序入库                                                 |

---

## 二、核心运行时机制

### 2.1 多租户（Multi-Tenancy）

- 开启开关：`yudao.tenant.enable=true`（[application.yaml](../../yudao-server/src/main/resources/application.yaml#L334-L345)）。
- 隔离规则：MyBatis-Plus 租户拦截器为所有未在 `yudao.tenant.ignore-tables` 列表中的表自动注入 `tenant_id = ?`。
- 访问例外：`yudao.tenant.ignore-urls` 排除 `/jmreport/*`；`yudao.tenant.ignore-visit-urls` 排除 `/admin-api/system/user/profile/**`、`/admin-api/system/auth/**` 避免超管切换租户（`visit-tenant-id`）时触发校验异常。

### 2.2 传输加解密与验证码

- **API 加解密**：`yudao.api-encrypt.enable=true`（AES 算法），对应请求加密秘钥与响应加密秘钥配置于 `application.yaml`；前端请求通过 `X-Api-Encrypt: true` 标志协商加解密。
- **行为验证码**：`aj.captcha.type=blockPuzzle`（Redis 缓存校验状态，底图位于 `classpath:images/jigsaw` 与 `pic-click`）。

### 2.3 多数据源与持久层规范

- 默认主库：`master`（MySQL 8，`jdbc:mysql://127.0.0.1:3306/ruoyi-office`）。
- 读写/时序从库：`slave`（`lazy: true` 延迟初始化）；`tdengine`（`WebSocketDriver` 连接 `jdbc:TAOS-WS://127.0.0.1:6041/ruoyi_vue_pro`，校验 SQL 为 `SELECT SERVER_STATUS()`）。
- 逻辑删除：`mybatis-plus.global-config.db-config` 统一配置 `logic-delete-value: 1`、`logic-not-delete-value: 0`；多表关联查询启用 `mybatis-plus-join` 副表逻辑删除过滤（`logic-del-type: on`）。
- **注入歧义规避**：由于多模块合入单一 Spring 容器，采用 `@Resource` 注入同名业务 Mapper（如 ERP 与 WMS 的采购订单 Mapper）时，**字段名必须携带模块前缀**（参考 `ErpPurchaseOrderServiceImpl` 中的 `erpPurchaseOrderMapper`）。

### 2.4 兜底路由与接口文档

- [DefaultController.java](../../yudao-server/src/main/java/cn/iocoder/yudao/server/controller/DefaultController.java) 为未匹配到具体 Controller 的 `/admin-api/**` 请求提供 501 兜底响应，开发排查 404/501 时需先确认目标接口是否真实注册或拼写错误。
- 启动后可访问 `http://127.0.0.1:48080/doc.html` 调试全量 OpenAPI 3 文档（`yudao.swagger.license=GPL-3.0-or-later`）。

---

## 三、数据库与 SQL 初始化脚本（`script/sql/`）

所有数据库脚本集中存放于 [script/sql/](../../script/sql)：

- **多数据库方言支持**：`mysql/`、`dm/`、`kingbase/`、`opengauss/`、`oracle/`、`postgresql/`、`sqlserver/`，均包含主库初始化脚本 `ruoyi-vue-pro*.sql` 与定时调度表 `quartz.sql`。
- **工作台扩展脚本**（`script/sql/mysql/`）：包含 `system_home_page.sql`、`system_home_component*.sql`、`system_schedule*.sql`、`dashboard_menu.sql` 等工作台桌面与日程演进脚本。
- **示例密钥安全规则**：所有示例存储/短信配置行已脱敏为 `YOUR_*` 占位符，生产部署需在系统管理后台重新填入真实凭据。
