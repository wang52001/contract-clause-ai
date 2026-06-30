# 黄金集测试

针对自由职业者合同审查 AI 的回归测试套件，验证 Prompt 与 Schema 在典型合同样本上的稳定性。

## 目录结构

```
tests/
├── fixtures/
│   ├── contracts/         # 脱敏合同样本（5 份典型场景）
│   │   ├── nda-normal.txt          标准保密协议（缺多数条款）
│   │   ├── payment-risk.txt        付款条款重度风险
│   │   ├── ip-ambiguous.txt        IP 模糊但其他良好
│   │   ├── missing-killfee.txt     仅缺 kill fee
│   │   └── comprehensive-good.txt  全面合规的良好合同
│   └── expected/          # 每份样本的期望断言（JSON）
│       ├── nda-normal.json
│       ├── payment-risk.json
│       ├── ip-ambiguous.json
│       ├── missing-killfee.json
│       └── comprehensive-good.json
├── regression.mjs         # 回归脚本
└── README.md
```

## 期望断言格式

```json
{
  "name": "...",
  "description": "...",
  "expectedClauses": [
    { "type": "payment", "severityIn": ["high"] }
  ],
  "expectedMissingAnyOf": ["kill_fee"],
  "expectedRiskLevelIn": ["high"]
}
```

- `expectedClauses`：每类条款应被识别且 severity 落在 `severityIn` 列表内
- `expectedMissingAnyOf`：`missing_protections` 至少包含其中之一（空数组表示期望无缺失）
- `expectedRiskLevelIn`：`assessRisk` 总分等级（low/medium/high）应落在列表内

## 运行方式

### 离线：仅 fixture 完整性检查

无需 API key、无需 dev server，验证 fixtures 与 expected 结构自洽。

```bash
node tests/regression.mjs
```

### 在线：完整 AI 回归

需要 dev server 运行且配置 `DEEPSEEK_API_KEY`：

```bash
# 终端 1：启动 dev server
npm run dev

# 终端 2：跑回归（注意限流 5 次/分钟，5 份样本需 < 5 次则一次通过）
BASE_URL=http://localhost:3000 node tests/regression.mjs
```

## 注意事项

- 5 份样本的总字符数均满足 API 最低 80 字符门槛
- 在线回归受 dev server 限流（5 次/分钟）约束；如触发限流稍候重试
- AI 输出存在轻微非确定性，`severityIn` 与 `expectedRiskLevelIn` 已留出宽容范围
- fixtures 全部为虚构脱敏内容，可安全提交版本库
