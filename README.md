# SDUMeet 🏫❤️

**山大人的专属相亲角——由算法替你迈出第一步。**

面向山东大学在校学生的校园实名恋爱匹配平台，灵感来自上海交通大学 [SJTU Date](https://github.com/PenguinYYDS/SDUMeet)（2026 年 3 月上线，一周内近万人涌入、配对 2400+ 人）。完整设计思路见 [DESIGN.md](./DESIGN.md)。

> ⚠️ **免责声明**：本仓库为山大学生团队发起的独立项目，与山东大学官方无关，不以学校名义运营。仅限山东大学在校学生使用。

## ✨ 特性

| 特性 | 说明 |
|---|---|
| 🎓 校园实名认证 | 学号 + 山大校园邮箱验证（优先对接统一身份认证），一人一号 |
| 🧭 跨校区匹配引擎 | 覆盖济南/青岛/威海 8 大校区，支持「同校区 / 同城 / 异地」三档距离意愿 |
| 🧠 价值观测评 | 5 维度问卷驱动匹配（消费观/婚恋观/家庭观/职业规划/相处模式） |
| 📮 每日限量派单 | 每天 3–5 个推荐 + 「为什么是 TA」匹配报告 |
| 💞 双向心动解锁 | 互相心动才解锁聊天，单方喜欢不打扰对方（防骚扰核心机制） |
| 💬 实时聊天 | WebSocket 1v1 会话，支持举报/拉黑 |
| 🛡️ 安全合规 | 敏感词 + AI 内容审核、举报 24h 处理、一键注销（PIPL 合规） |

## 🏗️ 架构

```
┌─────────────────────┐     HTTPS/JSON      ┌──────────────────────────┐
│  微信小程序 (Taro)    │ ─────────────────▶ │  NestJS API (apps/server) │
│  每日派单/测评/聊天    │ ◀───────────────── │  认证/用户/测评/匹配/聊天   │
└─────────┬───────────┘                    └──────┬─────────┬─────────┘
          │ WebSocket (Socket.IO)                 │         │
          └───────────────────────────────────────┘         │
                                    PostgreSQL  ←── Redis 缓存
                                    （用户/档案/推荐/配对/消息）
```

详见 [docs/architecture.md](./docs/architecture.md)。

## 📁 目录结构

```
.
├── apps/
│   ├── miniapp/            # 微信小程序（Taro 4 + React + TS）
│   │   ├── config/         # Taro 构建配置（dev/prod 环境变量）
│   │   └── src/
│   │       ├── pages/      # 每日派单 / 认证 / 测评 / 消息 / 聊天 / 我的
│   │       └── services/   # 请求封装 + 类型化 API 客户端
│   └── server/             # 后端（NestJS + TypeORM + PostgreSQL）
│       └── src/modules/
│           ├── auth/       # 学号+校园邮箱验证，JWT 签发
│           ├── users/      # 用户档案（含跨校区距离偏好）
│           ├── survey/     # 价值观问卷与向量计算
│           ├── matching/   # 匹配引擎（硬过滤+软打分+每日派单+双向心动）
│           ├── chat/       # WebSocket 聊天
│           └── health/     # 健康检查
├── packages/
│   └── shared/             # 三端共享：枚举/类型/八校区常量/问卷题库/向量算法
├── docs/                   # 架构/API/数据库/匹配算法/问卷/部署/公约/路线图
├── .github/                # CI 与 Issue/PR 模板
├── docker-compose.yml      # 本地 Postgres + Redis
├── DESIGN.md               # 产品设计思路
├── CONTRIBUTING.md         # 贡献指南
├── CODE_OF_CONDUCT.md      # 行为准则
└── SECURITY.md             # 安全上报与数据保护承诺
```

## 🚀 快速开始

### 0. 环境要求

- Node.js >= 20，[pnpm](https://pnpm.io/zh/) >= 9
- Docker（跑本地 Postgres/Redis，也可以自装）
- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动基础设施

```bash
docker compose up -d          # Postgres:5432 / Redis:6379
```

### 3. 配置后端环境变量

```bash
cp apps/server/.env.example apps/server/.env
# 至少修改 JWT_SECRET 为随机值（生产必改）
```

### 4. 启动后端

```bash
pnpm dev:server               # http://127.0.0.1:3000/api/health
```

### 5. 启动小程序

```bash
pnpm dev:miniapp              # 编译产物在 apps/miniapp/dist
```

用微信开发者工具打开 `apps/miniapp`（开发阶段可用测试号，`project.config.json` 已配置 `urlCheck: false` 以允许本地请求）。

### 6. 跑测试

```bash
pnpm test                     # 匹配引擎单元测试
pnpm typecheck                # 全仓库类型检查
```

## 🔐 环境变量说明（apps/server/.env）

| 变量 | 说明 |
|---|---|
| `DATABASE_URL` | PostgreSQL 连接串 |
| `JWT_SECRET` | JWT 签名密钥（生产必须高强度随机值） |
| `JWT_EXPIRES_IN` | 登录有效期，默认 7d |
| `CAS_BASE_URL` 等 | 校园统一身份认证对接参数（对接前为占位符） |
| `SMTP_*` | 校园邮箱验证码发送（生产接入真实邮件服务） |
| `AUDIT_*` | 内容安全审核服务（数美/腾讯云天御等） |

## 🤝 贡献

欢迎山大学子参与！请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 与 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)。安全问题请走 [SECURITY.md](./SECURITY.md) 私下上报，勿提公开 Issue。

## 🗺️ 路线图

见 [docs/roadmap.md](./docs/roadmap.md)。当前处于 P1（MVP 骨架）阶段。

## 📄 License

[MIT](./LICENSE) © 2026 SDUMeet Contributors

*灵感致谢：上海交通大学 SJTU Date 团队。*
