# RuoYi Office 本地环境说明

本文件记录本机初始化结果与启动方式，便于复现和接手。

## 当前状态

| 组件 | 地址 | 状态 |
| --- | --- | --- |
| 后端 yudao-server | http://127.0.0.1:48080 | 运行中，`/actuator/health` → UP |
| 前端 web-antd (Vite) | http://127.0.0.1:5666 | 运行中 |
| MySQL | 127.0.0.1:3306（Docker 容器 `mysql`，root/root） | 库 `ruoyi-office`，366 张表 |
| Redis | 127.0.0.1:6379（Docker 容器 `myerp-redis`） | 运行中 |
| TDengine | 127.0.0.1:6041（Docker 容器 `myerp-tdengine`，root/taosdata） | IoT 设备消息库 `ruoyi_vue_pro` |

已启用全部 19 个业务模块（system / infra / bpm / oa / hrm / asset / wms / member / report /
pay / mp / product / promotion / trade / statistics / crm / erp / ai / iot），
17 个一级菜单实测可打开。打出来的 `yudao-server.jar` 约 508 MB，冷启动约 40–50 秒。

登录：`admin` / `admin123`，租户「宇擎源码」（tenant-id = 1）。

## 启停

```bash
./dev.sh status    # 检查前后端 + MySQL/Redis/TDengine
./dev.sh backend   # 启动后端（缺省 profile=local）
./dev.sh frontend  # 启动前端 dev server
./dev.sh build     # 重新打包后端
./dev.sh stop      # 停止前后端
./dev.sh logs      # 查看后端日志
```

后端日志：`.tmp/logs/yudao-server.log`；前端日志：`.tmp/frontend.log`。

## 环境依赖

| 项 | 位置 |
| --- | --- |
| JDK | 21.0.12（Corretto），项目 `java.version=17`，可用 |
| Maven | `${HOME}/.m2/wrapper/dists/apache-maven-3.9.12/`（项目未带 mvnw） |
| Maven 本地仓库 | `.m2repo`（沙盒内副本，`~/.m2/repository` 不可写） |
| Node | v22.23.4（nvm） |
| pnpm | 10.28.2，由 corepack 安装到 `.corepack`（`~/.cache` 不可写） |
| pnpm store | `.pnpm-store` |

## 数据库初始化

当前 HEAD 的 `sql/mysql/ruoyi-vue-pro.sql` 只含 48 张表（system/infra/demo），
不含 oa/hrm/crm/erp/wms/asset/bpm/iot/ai/pay/mall 等业务表。

因此基础数据取自历史提交 `a6424828b` 中的全量备份（282 张表）：

```bash
git -C ruoyi-office show a6424828b:sql/mysql/dump-ruoyi-office-20260305.sql > full-dump.sql
docker exec -i mysql mysql -uroot -proot -e "CREATE DATABASE \`ruoyi-office\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
docker exec -i mysql mysql -uroot -proot ruoyi-office < full-dump.sql
docker exec -i mysql mysql -uroot -proot ruoyi-office < ruoyi-office/sql/mysql/quartz.sql
```

导出文件末尾有一句把 `sql_mode` 还原为 `NO_AUTO_CREATE_USER` 的语句（MySQL 5.7 产物），
在 MySQL 8.4 会报 `ERROR 1231`，属预期，数据已在此之前导入完毕。

### 补建缺失的业务表

上面那份全量备份同样缺 75 张表（member / pay / product / promotion / trade 全部，
以及 `member_user`、`product_spu`、`trade_order` 等核心表）。这些表按**实体类字段**推导
建表语句（`@TableName` + 字段类型 + `BaseDO` 公共列），脚本见 `.tmp/missing-tables.sql`：

```bash
docker exec -i mysql mysql -uroot -proot ruoyi-office < .tmp/missing-tables.sql
```

建完后还需给这些表补 `tenant_id`：租户插件会对未被 `yudao.tenant.ignore-tables` 排除的表
统一追加 `tenant_id = ?` 条件，缺列会直接 500（`Unknown column 'tenant_id'`）。

```bash
ALTER TABLE <table> ADD COLUMN tenant_id bigint NOT NULL DEFAULT 0;
```

这是本机为跑通界面做的重建，不是官方 DDL；官方渠道拿到正式脚本后建议替换。

## 本仓库改动

1. `yudao-server/src/main/resources/application-local.yaml`
   - 数据源端口 `33061` → `3306`，密码 `123456` → `root`（对接本机 MySQL）。
   - 打开 `tdengine` 数据源，驱动用 `com.taosdata.jdbc.ws.WebSocketDriver`
     （注释里写的 `RestfulDriver` 配 `TAOS-WS://` 是错的，实测会报
     `NoClassDefFoundError`）。
2. `CrmContractStatusListener` / `CrmReceivableStatusListener`
   - `event.getStatus()` 在当前 bpm-api 中已不存在，改为
     `event.getProcessInstanceInfo().getStatus()`（与 `BpmOALeaveStatusListener` 写法一致）。
     不改则 `yudao-module-crm-server` 编译失败，整个构建中断。
3. `yudao-server/pom.xml`
   - 取消 asset / wms / member / report / pay / mp / product / promotion / trade /
     statistics / crm / erp / ai / iot 共 14 个模块依赖的注释，改为全模块单体启动。
4. `ErpPurchaseOrderServiceImpl`
   - 字段 `ErpPurchaseOrderMapper purchaseOrderMapper` 与 WMS 的 `PurchaseOrderMapper`
     同名，而 `@Resource` 按字段名注入，启动时注入到 WMS 的 mapper 报类型不匹配；
     字段改名为 `erpPurchaseOrderMapper`。
5. `ruoyi-office-vben/pnpm-lock.yaml` 有少量 patch 版本解析变动（pnpm install 副产物）。

打包必须使用单体 profile，否则子模块会被 spring-boot 插件重新打成可执行 jar，
类落在 `BOOT-INF/classes` 下，主应用扫描不到模块 Bean（启动报
`PermissionCommonApi` 缺失）：

```bash
mvn -P boot -Dmaven.repo.local=.m2repo -Dmaven.test.skip=true clean package
```

## 已知限制

全量巡检 235 个页面菜单后，仍有以下提示（均非启动或模块问题）：

- **「定时任务」**（`/infra/job`）404：本分支把 infra 的 job 管理功能（JobDO/JobService/
  JobController）删掉了，只剩两个清理任务类，页面无对应后端。可隐藏该菜单。
- **公众号管理 8 个页面**提示「未配置公众号」：需要在账号管理里填真实公众号的
  appId/secret 并同步，本地没有账号可用。
- **`/iot/device/thing-model`、`/workspace/home/designer`** 直接按 URL 打开会提示缺参数
  （`id`），从列表页跳转时正常。
- **24 个菜单指向的前端组件在 vben 仓库里不存在**（ai 14、system 2、hrm 2、iot 2，
  crm/erp/mall/wms 各 1），这些页面打开为空白。属前端仓库缺文件，不是后端问题。
- `DefaultController` 里 `/admin-api/**` 的兜底 501 仍保留，因此拼错的路径会返回
  「模块已禁用」而不是 404，容易误判；真实路由优先，不影响正常功能。
