# 接单护身符 · 自由职业者合同审查 PWA

专为中国自由职业者/接外包者打造的 AI 合同审查工具。上传外包合同、NDA、合作协议，AI 识别 8 类条款风险，给修改建议与谈判话术，引用中国法律依据。文件在浏览器本地解析，不上传服务器。

## 功能

- **8 类条款专精审查**：付款、知识产权、责任限制、终止、工作范围、竞业限制、保密、取消费
- **风险评分**：0-100 加权评分，三色风险等级
- **大白话解读**：口语化解释每条对你意味着什么
- **修改建议**：可直接发给甲方的替代条款文字（会员）
- **谈判话术**：不只诊断，还教怎么跟甲方谈（会员，差异化卖点）
- **中国法律依据**：引用《著作权法》《民法典》《劳动合同法》《反不正当竞争法》
- **缺失保护提示**：应有但缺失的条款单独预警
- **隐私优先**：PDF/Word 在浏览器本地解析，原文不上传服务器
- **PWA**：浏览器即用，可安装到手机/桌面主屏
- **分享链接**：报告可压缩为 Base64 URL 分享，无需数据库
- **在线支付骨架**：ZPAY 微信/支付宝通道（未配置时降级为邀请码激活）

## 技术栈

| 维度 | 选型 |
|---|---|
| 前端 | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui |
| AI | DeepSeek V4 Flash（`deepseek-chat`） |
| 文件解析 | pdfjs-dist + mammoth.js（前端本地解析） |
| PWA | @serwist/next |
| 分享 | lz-string（报告 JSON → Base64 URL） |
| 状态 | zustand |
| 部署 | Zeabur（国内直连） / Docker |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`，填入 DeepSeek API Key：

```bash
cp .env.example .env.local
```

```
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
# 以下为可选支付配置（不填则仅邀请码激活会员）
ZPAY_PID=
ZPAY_KEY=
ZPAY_API_URL=https://api.z-pay.uk/api/pay/create
```

API Key 申请：https://platform.deepseek.com/

### 3. 生成 PWA 图标（首次需要）

`app/manifest.ts` 引用了 3 个 PNG 图标。可用源文件 `public/icons/icon.svg` 生成：

```bash
node scripts/generate-icons.mjs
```

> 未生成图标不影响开发运行，仅影响 PWA 安装体验。

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 5. 生产构建

```bash
npm run build
npm start
```

## 使用说明

1. 上传 PDF/Word 合同文件，或直接粘贴合同文本
2. 点击「开始审查」
3. 查看风险评分、8 类条款详情、缺失保护提示
4. 会员可查看修改建议、谈判话术、法律依据全文，并可导出/分享报告

### 邀请码（MVP 阶段）

MVP 不接入支付，通过邀请码激活会员验证付费意愿。内置邀请码：

- `FREELANCER2026`
- `JIEBAO2026`
- `EARLYBIRD2026`

在 `/pricing` 页面输入邀请码激活。激活状态存储在 localStorage。

## 测试

### 离线 fixture 完整性检查

无需 API key、无需 dev server，验证 5 份脱敏合同样本与期望断言结构自洽：

```bash
npm test
```

### 在线 AI 回归

需要 dev server 运行且配置 `DEEPSEEK_API_KEY`：

```bash
# 终端 1
npm run dev

# 终端 2（PowerShell）
$env:BASE_URL="http://localhost:3000"; node tests/regression.mjs
```

回归脚本会对 5 份样本（标准 NDA、付款风险、IP 模糊、缺 kill fee、全面合规）调用 `/api/analyze`，断言识别出的条款类型、severity、缺失保护、风险等级与期望一致。详见 `tests/README.md`。

## 部署

### 方式一：Zeabur（推荐，国内直连免备案）

1. 注册 https://zeabur.com
2. 新建项目，连接 GitHub 仓库
3. Zeabur 自动检测 `Dockerfile` 并构建（`output: "standalone"` 已启用）
4. 添加环境变量：
   - `DEEPSEEK_API_KEY`（必需）
   - `ZPAY_PID`、`ZPAY_KEY`（可选，启用在线支付）
5. 部署，获取 `*.zeabur.app` 域名
6. 健康检查端点：`/api/health`

### 方式二：Docker 自托管

```bash
docker build -t freelancer-contract-guard .
docker run -p 3000:3000 \
  -e DEEPSEEK_API_KEY=sk-xxx \
  -e ZPAY_PID=xxx \
  -e ZPAY_KEY=xxx \
  freelancer-contract-guard
```

### 方式三：Vercel

不推荐（国内访问不稳定），但支持：导入仓库后自动识别 Next.js，添加环境变量即可。

## 项目结构

```
app/                    # Next.js App Router
  api/
    analyze/            # AI 调用代理（密钥/限流/校验）
    payment/
      create/           # 创建支付订单
      notify/           # 异步通知回调（验签）
      return/           # 同步返回页
    health/             # 健康检查
  page.tsx              # 首页（上传+结果）
  pricing/              # 定价/邀请码/在线支付页
  privacy/ terms/       # 隐私政策与用户协议
  report/               # 分享报告页（Base64 URL 解码）
  manifest.ts           # PWA manifest
  sw.ts                 # Service Worker
components/
  ui/                   # shadcn 基础组件
  upload/               # 文件上传/文本粘贴
  analyze/              # 风险评分/条款卡片/法律依据
  report/               # 报告视图/导出/分享
  layout/               # 头部/底部/安装引导
lib/
  ai/                   # DeepSeek 客户端/prompt/zod schema
  parser/               # PDF/Word 前端解析
  scoring/              # 风险评分算法
  payment/              # ZPAY 签名/订单管理
  constants/            # 8 类条款定义 + 中国法律白名单
  hooks/                # useMember
  store.ts              # zustand 状态
  share.ts              # 报告压缩/解压/分享 URL
tests/
  fixtures/
    contracts/          # 5 份脱敏合同样本
    expected/           # 期望断言 JSON
  regression.mjs        # 回归脚本
scripts/
  generate-icons.mjs    # PWA 图标生成
Dockerfile              # 容器化部署
zeabur.json             # Zeabur 模板配置
```

## 差异化定位

- **海外有 ReviewMyContract / ClauseShield / Flag Red**，但全是英文
- **国内通用合同工具**（方效AI、火眼审阅等）做泛合同，不专精自由职业者
- **本产品** = 中文 + 自由职业者专精 + PWA + 谈判话术（不只诊断，还教怎么谈）

## 合规与免责

- 本工具提供的分析由 AI 生成，仅供参考，**不构成法律意见**
- 本工具非律师事务所，不建立律师-客户关系
- 重大合同请咨询执业律师
- 文件在浏览器本地解析，原文不上传服务器（隐私优先）
- AI 输出经 zod 校验 + 法律条文白名单二次核对 + 原文锚定，但仍可能存在错误

## 成本估算

| 用户量 | 月成本 |
|---|---|
| 100 | ≈¥15 |
| 1,000 | ≈¥110 |
| 10,000 | ≈¥1,060 |

单次分析成本 ≈¥0.016（DeepSeek Flash）。

## License

MIT
