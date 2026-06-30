# 自由职业者合同审查 PWA — 实现计划

## Context（背景）

**要解决的问题**：中国 2 亿+ 灵活就业者（程序员接私活、设计师接单、自媒体/MCN、外包、咨询）签合同时看不懂条款，常被 IP 卷走、付款拖延、scope creep、竞业限制坑害。律师审合同 500-2000 元/份，普通人消费不起。

**市场空白**：海外有 ReviewMyContract.ai、ClauseShield、Flag Red 等专做自由职业者合同审查的工具，**全是英文**；国内通用合同工具（方效AI、火眼审阅、贤律助、小包公）做泛合同审查，**不专精自由职业者场景**。空白点 = **中文 + 自由职业者专精 + PWA**。

**预期结果**：1-2 周交付 MVP，单人开发，月成本百元级，freemium 模式验证付费意愿。差异化卖点：8 类条款专精（付款/IP/竞业/NDA/kill fee/责任/终止/scope）+ 中国法律依据引用 + 谈判话术（不只诊断，还教怎么谈）+ 隐私优先（文件浏览器本地解析不上传）。

## 产品定位与 MVP 功能

**目标用户**：中国自由职业者/接外包者
**形态**：PWA（浏览器即用 + 可装主屏，PC+移动通用）
**核心流程**：上传 PDF/Word 或粘贴文本 → AI 分析 8 类条款 → 风险评分 + 逐条款解读 + 修改建议 + 谈判话术 + 法律依据 → 导出/分享

**8 类条款**（基于自由职业者真实痛点）：
| 条款 | 权重 | 高风险信号 |
|---|---|---|
| 付款 | 0.20 | 无节点、尾款<30%、无逾期违约金、验收即全款 |
| 知识产权 | 0.18 | 著作权全归甲方、无署名权、未约定未付款前权属 |
| 责任限制 | 0.15 | 无上限/无限责任、含间接损失 |
| 终止 | 0.13 | 甲方随时无因终止、无通知期、不结算已发生费用 |
| scope 范围 | 0.12 | 范围模糊、无交付物清单、无限修改 |
| 竞业限制 | 0.08 | 超两年、无补偿、范围过宽 |
| NDA 保密 | 0.08 | 单向保密、期限过长、无例外 |
| kill fee 取消费 | 0.06 | 无取消费、甲方取消无赔偿 |

**freemium 分层**：免费=基础分析+评分+前3类条款解读+缺失保护；会员=全部8类+修改建议+谈判话术+法律依据全文+导出+分享+深度分析。

## 技术栈（明确推荐）

| 维度 | 选型 | 理由 |
|---|---|---|
| 前端框架 | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui | AI 辅助编程资料最密，单人出活最快，API Routes 前后端一体 |
| AI API | DeepSeek V4 Flash（`deepseek-chat` 非思考模式） | 中文法律理解强、最便宜（¥2/百万输出 tokens）、国内直连、原生 JSON Output |
| PDF/Word 解析 | 前端 `pdfjs-dist` + `mammoth.js` | 文件浏览器本地解析，不上传服务器，落实隐私承诺+零服务端成本 |
| 部署 | Zeabur（亚洲节点） | 国内直连无污染（Vercel 国内被墙是硬伤），免费额度够 MVP |
| PWA | `@serwist/next`（Serwist） | `next-pwa` 已停更三年，Serwist 活跃维护 |
| 数据库 | Zeabur Postgres + Prisma | 关系型适合会员/报告/邀请码 |
| 状态/表单 | Zustand + react-hook-form + zod | zod 复用做 AI JSON 校验 |
| 支付 | MVP 不接，邀请码验证；后期 ZPAY/个体工商户微信支付 | 1-2 周排期容不下支付接入 |

**备用 AI**：`deepseek-reasoner`（V4 Pro）用于会员深度分析（修改建议+谈判话术），成本高 3 倍但只对会员调用。

## 文件结构（关键部分）

```
d:\Desktop\test2\
├── app/
│   ├── layout.tsx                    # 根布局，PWA 注册
│   ├── page.tsx                      # 首页：上传/粘贴入口
│   ├── manifest.ts                   # PWA Web App Manifest
│   ├── sw.ts                         # Serwist Service Worker
│   ├── analyze/page.tsx              # 分析结果页
│   ├── report/[id]/page.tsx          # 分享报告页（SSR）
│   ├── pricing/page.tsx              # 会员/邀请码页
│   └── api/
│       ├── analyze/route.ts          # ★ AI 调用代理（密钥/限流/校验/会员判断）
│       ├── report/route.ts           # 报告存取
│       └── invite/verify/route.ts    # 邀请码验证
├── components/
│   ├── ui/                           # shadcn/ui 基础组件
│   ├── upload/{FileDropzone,TextPaste}.tsx
│   ├── analyze/{RiskScore,ClauseCard,ClauseList,MissingAlerts,NegotiationTips,LegalBasis}.tsx
│   ├── report/{ReportExport,ShareButton}.tsx
│   └── layout/{Header,InstallPrompt,Footer}.tsx
├── lib/
│   ├── parser/{pdf,word,index}.ts    # ★ 前端解析统一入口
│   ├── ai/
│   │   ├── deepseek.ts               # DeepSeek 客户端
│   │   ├── prompts.ts                # ★ System prompt（产品灵魂）
│   │   ├── schema.ts                 # ★ zod 8 类条款 JSON 结构
│   │   └── parse.ts                  # 响应校验+容错重试
│   ├── scoring/risk.ts               # ★ 8 类加权评分算法
│   ├── auth/session.ts               # 匿名 session
│   ├── db/{index.ts,schema.prisma}   # Prisma
│   ├── crypto.ts                     # 报告加密
│   └── constants/{clauses,laws}.ts   # 条款定义 + 中国法律白名单
├── public/{icons,pdf-workers,og-image.png}
├── tests/{prompts,fixtures}/         # prompt 黄金集 + 脱敏合同样本
├── .env.local                        # DEEPSEEK_API_KEY, DATABASE_URL
├── next.config.mjs                   # Serwist 配置
└── package.json
```

★ = 业务核心文件

## 核心模块设计要点

**1. 上传解析（隐私优先）**：PDF/Word 在浏览器本地解析为纯文本，原始文件永不离开浏览器，仅提取的文本经 `/api/analyze` 发往服务端且不落库。扫描版 PDF 提示用户粘贴文本（MVP 不做 OCR）。

**2. AI 分析（服务端代理）**：`/api/analyze` 组装 system+user prompt → 调 DeepSeek `response_format: json_object` → zod 校验 → 失败重试 1 次 → 评分算法 → 返回前端。密钥不暴露，统一限流+计费埋点。

**3. 风险评分**：每条款模型输出 severity + 0-100 子分，缺失条款按"应有但缺失"单独触发并扣分。总分=Σ(子分×权重)，映射三色：≥70 绿 / 40-69 黄 / <40 红。每个扣分项关联原文片段，可解释。

**4. AI Prompt 设计（核心差异化）**：
- 角色：中国自由职业者合同审查专家，精通《民法典》《著作权法》《劳动合同法》《反不正当竞争法》
- 强制 JSON 输出，system prompt 内嵌完整 schema + 8 类条款知识（每类的风险信号/保护表述/法律条文/修改建议模板/谈判话术模板）
- **防幻觉**：`original_text` 字段必须来自输入原文；`legal_basis` 用 `lib/constants/laws.ts` 白名单二次核对；输出 `confidence` 置信度，低置信度 UI 标"建议人工复核"
- 两段式：Flash 快速识别（免费层）+ reasoner 深度生成修改建议/谈判话术（会员）

**5. 付费墙**：匿名 session（cookie），邀请码激活会员，`<Paywall>` 组件包裹会员内容，免费用户每日 3 次（IP+session 防刷）。

## AI 输出 JSON 结构（zod schema 核心）

```json
{
  "overall": { "summary": "一句话总评", "top_risks": ["风险1","风险2","风险3"] },
  "clauses": [
    {
      "type": "payment|ip|non_compete|nda|kill_fee|liability|termination|scope",
      "title": "付款条款",
      "severity": "high|medium|low|missing",
      "sub_score": 0-100,
      "original_text": "合同原文片段（必须来自输入）",
      "plain_explanation": "大白话解读",
      "risks": ["具体风险点"],
      "suggested_revision": "建议替换文字（会员）",
      "negotiation_script": "可发给甲方的话术（会员）",
      "legal_basis": [{ "law":"著作权法","article":"第十九条","text":"条文摘要" }],
      "confidence": 0.0-1.0
    }
  ],
  "missing_protections": [
    { "type":"kill_fee","why_needed":"为什么需要","suggested_text":"建议补充文字" }
  ]
}
```

## 开发排期（1-2 周）

**第 1 周（核心闭环）**
- D1：项目初始化（create-next-app + Tailwind + shadcn + Serwist + Zeabur 部署 hello world + DeepSeek key）
- D2：上传解析模块（pdfjs + mammoth 前端解析，FileDropzone/TextPaste，PWA manifest+图标）
- D3：AI 模块（deepseek 客户端 + prompts v1 + zod schema + /api/analyze，3 份测试合同调通 JSON）
- D4：评分算法 + RiskScore 仪表盘 + ClauseCard/ClauseList 渲染
- D5：MissingAlerts + LegalBasis（法律条文库）+ NegotiationTips + SuggestedRevision 组件
- D6：Prompt 优化 + 黄金集测试（10 份脱敏合同回归），扫描版 PDF 提示
- D7：报告导出 PDF + 分享链接（Postgres 存加密 JSON）+ PWA 安装引导

**第 2 周（付费+打磨+上线）**
- D8：付费墙（匿名 session + 邀请码 + Paywall 组件 + 每日次数限制）
- D9：深度分析（reasoner 第二段调用）+ UI 打磨（加载/空/错误态）
- D10：合规（法律免责声明页 + 隐私政策页 + 用户协议 + Footer 声明）
- D11：移动端适配 + PWA 离线缓存 + Lighthouse PWA 审计
- D12：错误处理与防刷（速率限制 + 长度校验 + 限流兜底 + 重试 + 埋点）
- D13：内测（5-10 位真实自由职业者试用，收集合同样本修 prompt）
- D14：上线（Zeabur 生产部署 + 域名 + OG 图 + SEO + 冷启动发帖）

核心闭环在 D7 完成，D8-14 是加固。

## 成本估算（月）

| 量级 | DeepSeek API | Zeabur 托管+DB | 域名 | 合计 |
|---|---|---|---|---|
| 100 用户 | ¥8 | 免费 | ¥6 | ≈¥15 |
| 1,000 用户 | ¥80 | 免费 | ¥6 | ≈¥110 |
| 10,000 用户 | ¥800 | ¥60 | ¥6 | ≈¥1,060 |

单次分析成本 ≈¥0.016（输入 8K + 输出 4K tokens）。若定价 ¥9.9/份，1000 付费用户=¥9,900 收入 vs ¥110 成本，毛利极佳。

## 风险与合规

- **法律免责**：全站 Footer + 报告页声明"仅供参考，不构成法律意见，非律师-客户关系，重大合同请咨询执业律师"（避免《律师法》第十三条非法从事法律服务风险）
- **数据不存储**：文件浏览器本地解析，API 不落库文本（除非用户主动生成分享链接，加密存且可删），隐私政策明示数据流
- **AI 幻觉防范**：原文锚定 + 法律白名单二次核对 + 置信度展示 + 人工兜底提示
- **备案**：MVP 用 `*.zeabur.app` 免备案；接国内支付/买国内域名则需个体工商户资质备案
- **DeepSeek 限流**：错峰调用 + 缓存常见片段 + 备用通义千问降级

## 验证方法

**开发期验证**：
1. `tests/fixtures/` 准备 5-10 份脱敏真实合同（租房/外包/NDA/竞业/MCN），每份人工标注期望风险点
2. `tests/prompts/` 黄金集回归：每次改 prompt 跑全部样本，对比输出与期望，准确率作为质量门禁
3. zod schema 校验 + `original_text` 原文存在性校验 + `legal_basis` 白名单核对，三项过才返回用户

**上线后验证**：
1. Lighthouse PWA 审计 ≥90 分（可安装、离线、快速）
2. 真实用户试用（D13）：5-10 位自由职业者，收集"是否看懂""是否敢据此谈判"反馈
3. 埋点监测：分析成功率、JSON 校验失败率、平均分析时长、免费→邀请码激活转化率
4. 移动端真机测试（iOS Safari + Android Chrome）：上传、解析、报告渲染、PWA 安装全流程

## 关键执行文件（优先级排序）

1. `lib/ai/prompts.ts` — System prompt，8 类条款知识 + 中国法律注入，决定分析质量与差异化（产品灵魂）
2. `lib/ai/schema.ts` — zod 8 类条款 JSON 结构，约束输出 + 防幻觉校验（稳定性基石）
3. `app/api/analyze/route.ts` — 服务端 AI 代理，密钥/限流/校验/会员判断/计费（核心后端）
4. `lib/scoring/risk.ts` — 8 类加权评分算法 + 三色映射 + 缺失扣分（专业可信度）
5. `lib/parser/index.ts` — PDF/Word 前端解析统一入口（落实隐私承诺）
