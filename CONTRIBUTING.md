# 贡献指南

感谢你对 SDUMeet 的关注！本项目由山大学生发起，欢迎任何形式的贡献：代码、产品建议、文档、测试、UI 设计。

## 参与前必读

- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) 行为准则
- [DESIGN.md](./DESIGN.md) 产品设计思路
- [docs/](./docs/) 各模块设计文档

## 开发流程

1. Fork 本仓库并 clone 到本地；
2. 按 [README.md](./README.md) 的「快速开始」搭建本地环境；
3. 从 `develop` 分支切出功能分支：`feat/xxx`、`fix/xxx`、`docs/xxx`；
4. 开发完成并自测后提交 PR 到 `develop`。

## Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：

```
feat(matching): 支持跨城市距离档位
fix(auth): 修复验证码过期判断
docs(api): 补充每日派单接口说明
```

## PR 自检清单

- [ ] `pnpm typecheck` 通过（全部包）
- [ ] 后端改动通过 `pnpm --filter @sdumeet/server test`
- [ ] 修改了接口则同步更新 `docs/api.md`
- [ ] 修改了表结构则同步更新 `docs/database.md`
- [ ] 修改了匹配逻辑则同步更新 `docs/matching.md`
- [ ] **不提交任何真实学号/手机号/邮箱等个人数据**（测试数据一律用假数据）

## 敏感数据红线

- 严禁提交 `.env`、密钥、令牌、真实用户数据；
- 测试用例只允许使用虚构学号（如 202400010001）与虚构邮箱；
- 截图必须先打码再上传 Issue；
- 发现已泄露的敏感信息，立即按 [SECURITY.md](./SECURITY.md) 上报并删除。

## 代码风格

- 统一使用仓库根目录的 `.prettierrc`（提交前执行 `pnpm format`）；
- 共享枚举与类型放 `packages/shared`，禁止在三端重复定义；
- 匹配算法纯函数放 `apps/server/src/modules/matching/matcher.ts`，并配套单元测试。

## 新手任务

可在 Issue 中筛选 `good first issue` 标签；也可以从以下方向切入：

1. 补齐 `docs/survey.md` 问卷的计分权重；
2. 为小程序页面补写组件测试/快照；
3. 实现管理端审核后台（`apps/admin`，尚未创建）。
