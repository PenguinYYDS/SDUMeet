# 部署指南

## 本地开发

见 [README.md](../README.md) 的快速开始。要点：

- `docker compose up -d` 起 Postgres/Redis；
- 后端 `pnpm dev:server`（`synchronize` 自动建表，仅限开发）；
- 小程序 `pnpm dev:miniapp`，开发者工具打开 `apps/miniapp`，勾选「不校验合法域名」。

## 生产部署（后端）

```bash
# 1. 准备服务器（2C4G 起步，国内云厂商学生机即可）
# 2. 安装 Docker + Caddy/Nginx
# 3. 配置环境变量（生产必须修改 JWT_SECRET、DATABASE_URL）
cp apps/server/.env.example apps/server/.env
# 4. 构建镜像并启动
docker compose -f docker-compose.prod.yml up -d
```

注意：

- 生产环境 `NODE_ENV=production` 时 `synchronize` 自动关闭，需引入 migration 流程（TypeORM CLI）；
- PostgreSQL 与 Redis 使用云厂商托管服务更省心（注意内网访问）；
- 数据库开启自动备份（每日快照，保留 30 天）；
- HTTPS 证书用 Caddy 自动申请或云厂商免费证书。

## 小程序发布

1. 注册小程序主体（个人主体类目不含社交/婚恋，建议以公司/民办非企业主体注册，类目选「社交-交友」需相应资质；**上线前务必核实时下微信审核要求**）；
2. 小程序备案（工信部 ICP 备案，2023 年起新小程序必须备案）；
3. 配置服务器合法域名（request 域名 + socket 域名均需 HTTPS/WSS）；
4. `apps/miniapp/config/prod.ts` 中替换 API 地址；
5. `pnpm build:miniapp` 后用开发者工具上传，提交审核。

## 内容安全接入

- 图片/文本审核：数美、腾讯云天御等（学生团队可申请试用额度）；
- 在 `apps/server/.env` 配置 `AUDIT_*` 并在上传/发消息路径接入 SDK。

## 定时任务

每日派单生成建议用服务器 crontab 或 GitHub Actions 定时调用：

```cron
0 2 * * * curl -X POST -H "Authorization: Bearer <service-token>" https://api.xxx.com/api/matching/batch
```

（骨架暂以 `POST /matching/generate` 幂等接口替代，批量版接口待实现。）
