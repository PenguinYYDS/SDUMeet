# API 设计草案

- Base URL：`http://127.0.0.1:3000/api`（生产为备案 HTTPS 域名）
- 认证方式：`Authorization: Bearer <accessToken>`
- 统一响应包裹：`{ "code": 0, "message": "ok", "data": ... }`，非 0 为业务错误，HTTP 状态码与 code 一致
- WebSocket：`ws://host/chat?token=<accessToken>`

## 认证

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| POST | `/auth/request-code` | 发送邮箱验证码（开发环境返回 devCode 便于调试） | 否 |
| POST | `/auth/verify` | 学号 + 校园邮箱 + 验证码换取 JWT | 否 |

`verify` 请求体：

```json
{ "studentId": "202400010001", "email": "xxx@sdu.edu.cn", "code": "123456" }
```

响应：

```json
{ "code": 0, "message": "ok", "data": { "accessToken": "eyJ...", "expiresIn": 604800 } }
```

## 用户档案

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/users/me` | 我的档案摘要 | ✓ |
| PUT | `/users/me/profile` | 完善/更新档案（性别、校区、距离偏好等） | ✓ |
| DELETE | `/users/me` | 注销账户（软删除+匿名化） | ✓ |

## 测评

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/survey/questions` | 获取问卷题目（不下发计分权重） | ✓ |
| POST | `/survey/answers` | 提交作答，服务端计算价值观向量 | ✓ |

## 匹配

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/matching/today` | 今日推荐批次（含匹配报告） | ✓ |
| POST | `/matching/generate` | 触发生成今日推荐（幂等；生产由定时任务调用） | ✓ |
| POST | `/matching/:id/decide` | 心动/跳过；双向心动返回 matched=true | ✓ |

`decide` 请求体：`{ "decision": "LIKE" }`（或 `"PASS"`）

`today` 响应示例：

```json
{
  "code": 0, "message": "ok",
  "data": [{
    "id": "rec-uuid",
    "score": 0.83,
    "distanceTier": 1,
    "report": { "sharedInterests": ["篮球"], "sharedValueDims": [0, 3] },
    "candidate": {
      "id": "user-uuid", "nickname": "山大同学0001",
      "campus": "HONGJIALOU", "city": "济南", "department": "外国语学院",
      "grade": 2023, "mbti": "INFJ", "bio": "……", "interests": ["篮球", "摄影"],
      "verifyStatus": "VERIFIED"
    }
  }]
}
```

## 聊天

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/chat/conversations` | 会话列表（含对端摘要） | ✓ |
| GET | `/chat/conversations/:id/messages?limit=50` | 历史消息（倒序取回后正序返回） | ✓ |

WebSocket 事件（namespace `/chat`）：

| 方向 | 事件 | 载荷 |
|---|---|---|
| C→S | `conversation:join` | `{ "conversationId": "..." }` |
| C→S | `message:send` | `{ "conversationId": "...", "content": "你好", "type": "TEXT" }` |
| S→C | `message:new` | `{ "id", "senderId", "type", "content", "createdAt" }` |

## 健康检查

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/health` | `{ "status": "ok", "version": "0.1.0", "uptime": 12 }` |

## 通用约定

- 所有输入经 class-validator 白名单校验；
- 分页统一 `page` / `pageSize`（默认 1/20，最大 100）；
- 时间统一 ISO 8601 UTC 字符串；
- 错误响应示例：`{ "code": 401, "message": "登录已过期，请重新登录", "data": null }`。
