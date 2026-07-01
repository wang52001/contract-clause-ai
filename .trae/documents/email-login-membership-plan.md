# 邮箱登录 + 管理员确认收款 + D1 会员系统 实现计划

## 背景与目标

当前 MVP 的会员状态保存在浏览器 `localStorage` 中，使用邀请码激活。用户希望升级为：
- **必须登录** 才能付款/解锁会员
- 使用 **邮箱登录**（不依赖手机号）
- 付款后生成订单，管理员在后台点击"确认收款"
- 确认后该用户自动解锁会员，且会员状态跨设备持久化

本计划使用 Cloudflare 免费服务（D1 数据库 + Pages Functions）实现，保持现有"个人收款码 + 手动确认"的低成本模式。

---

## 数据库设计（Cloudflare D1）

创建 `migrations/0001_init.sql`：

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 990,
  status TEXT NOT NULL CHECK(status IN ('pending','paid','cancelled')),
  payment_method TEXT,
  note TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  paid_at INTEGER,
  confirmed_by TEXT
);

CREATE TABLE IF NOT EXISTS memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  active INTEGER NOT NULL DEFAULT 1,
  starts_at INTEGER NOT NULL,
  expires_at INTEGER,
  order_id INTEGER REFERENCES orders(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email, created_at);
```

---

## 认证流程：邮箱 OTP

采用 6 位数字验证码，原因：
- 比 Magic Link 实现简单，移动端输入方便
- 不需要构造带签名的链接
- 邮件模板简单

### 流程
1. 用户在 `/pricing` 点击"登录购买"，输入邮箱
2. 前端 POST `/api/auth/otp/send`
3. 后端生成 6 位验证码，写入 `verification_codes`，有效期 10 分钟
4. 通过邮件服务（Resend / console 模式）发送验证码
5. 用户输入验证码，POST `/api/auth/otp/verify`
6. 验证通过后创建/查询 `users`，生成 session，设置 `HttpOnly` cookie
7. 后续请求携带 cookie，服务端反查用户

### 安全限制
- 同一邮箱 60 秒内只能发一次验证码
- 同一 IP 10 分钟内最多发 5 次
- 同一验证码最多允许 5 次错误尝试
- Session 有效期 30 天

---

## 新增/修改的 API 路由

| 路由 | 方法 | 说明 |
|---|---|---|
| `/api/auth/otp/send` | POST | 发送邮箱验证码 |
| `/api/auth/otp/verify` | POST | 验证并建立 session |
| `/api/auth/me` | GET | 当前登录用户与会员状态 |
| `/api/auth/logout` | POST | 退出登录 |
| `/api/orders` | POST | 创建待付款订单 |
| `/api/orders` | GET | 当前用户订单列表 |
| `/api/admin/orders` | GET | 管理员查看 pending 订单 |
| `/api/admin/orders/[id]/confirm` | POST | 管理员确认收款并解锁会员 |

所有路由保持现有 edge runtime 约定。

---

## 客户端改动

### 1. `lib/hooks/useMember.ts`
- 将会员状态来源从 `localStorage` 改为服务端 `/api/auth/me`
- 增加 `user`、`login(email, code)`、`logout()`、`refresh()`
- 保留 `isMember` 和 `loaded` 接口，减少下游组件改动

### 2. `components/auth/LoginDialog.tsx`（新增）
- 两步：输入邮箱 → 输入验证码
- 成功后刷新 `useMember`

### 3. `app/pricing/page.tsx`
- 未登录：显示"登录后购买"，点击打开登录弹窗
- 已登录未会员：显示"创建订单"，生成订单后展示订单号和收款码，提示备注订单号
- 已会员：显示"已激活会员权益"
- 保留邀请码入口，但改为登录后验证并激活

### 4. `components/layout/Header.tsx`
- 右侧增加用户邮箱/登录按钮

### 5. `app/admin/page.tsx`（新增）
- 输入 `ADMIN_SECRET` 验证
- 拉取 pending 订单列表
- 每行显示：订单号、邮箱、金额、支付方式、创建时间
- "确认收款"按钮，调用确认 API

### 6. 会员门禁组件
- `app/page.tsx`、`app/report/page.tsx`、`components/report/ReportView.tsx`、`components/analyze/*` 等
- 这些组件已经在使用 `isMember`，只需确保 `useMember` 返回的是服务端状态

---

## Cloudflare 配置变更

### `wrangler.jsonc`

新增 D1 绑定：

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "contract-clause-ai",
  "compatibility_date": "2026-06-30",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "contract-clause-ai-db",
      "database_id": "<D1 database id>"
    }
  ]
}
```

### `.env.example`

新增：

```bash
# 已有
DEEPSEEK_API_KEY=

# 新增
ADMIN_SECRET=
RESEND_API_KEY=
FROM_EMAIL=
EMAIL_PROVIDER=resend   # resend | console
```

### 本地开发

由于 `next dev` 不会注入 D1，本地使用：

```bash
npx wrangler pages dev -- npm run dev
```

---

## 部署与迁移步骤

1. 安装开发依赖：`npm install -D @cloudflare/workers-types`
2. 创建 D1 数据库：`npx wrangler d1 create contract-clause-ai-db`
3. 把返回的 `database_id` 填入 `wrangler.jsonc`
4. 执行迁移：`npx wrangler d1 execute contract-clause-ai-db --file=./migrations/0001_init.sql`
5. 配置 Secrets：
   ```bash
   npx wrangler pages secret put DEEPSEEK_API_KEY
   npx wrangler pages secret put ADMIN_SECRET
   npx wrangler pages secret put RESEND_API_KEY
   npx wrangler pages secret put FROM_EMAIL
   ```
6. 提交代码，`git push origin main`
7. Cloudflare Pages 自动构建部署，D1 绑定通过 `wrangler.jsonc` 关联

### 旧用户迁移

旧版通过 `localStorage` 中的 `fcg_member_activated=1` 标记会员。新 `useMember` 检测到旧标记且用户已登录时，可调用一次性同步接口把本地状态写入 `memberships` 表。未登录旧用户登录后完成同步。

---

## 验证步骤

1. 数据库表创建成功：
   ```bash
   npx wrangler d1 execute contract-clause-ai-db --command="SELECT name FROM sqlite_master WHERE type='table';"
   ```
2. 本地发送/验证 OTP（`EMAIL_PROVIDER=console` 时终端查看验证码）
3. 登录后创建订单，查看订单号
4. 访问 `/admin`，输入 `ADMIN_SECRET`，确认订单
5. 刷新 `/pricing`，显示"已激活会员权益"
6. 换设备/浏览器用同一邮箱登录，会员状态保持一致
7. 运行 `npm test` 确保分析接口回归通过

---

## 关键文件清单

- `migrations/0001_init.sql` — 新建
- `wrangler.jsonc` — 修改
- `.env.example` — 修改
- `lib/db/d1.ts` — 新建（DB 获取封装）
- `lib/auth/session.ts` — 新建
- `lib/auth/otp.ts` — 新建
- `lib/hooks/useMember.ts` — 重写
- `components/auth/LoginDialog.tsx` — 新建
- `app/pricing/page.tsx` — 重写
- `app/admin/page.tsx` — 新建
- `components/layout/Header.tsx` — 修改
- `app/api/auth/otp/send/route.ts` — 新建
- `app/api/auth/otp/verify/route.ts` — 新建
- `app/api/auth/me/route.ts` — 新建
- `app/api/auth/logout/route.ts` — 新建
- `app/api/orders/route.ts` — 新建
- `app/api/admin/orders/route.ts` — 新建
- `app/api/admin/orders/[id]/confirm/route.ts` — 新建
