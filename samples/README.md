# 测试合同样本集

8 份虚构脱敏合同，覆盖自由职业者常见场景与不同风险组合，用于产品演示与人工测试。

> ⚠️ 全部为虚构内容（公司名、人名均为杜撰），可安全提交版本库与公开测试。

## 样本索引

| # | 文件 | 场景 | 风险特点 | 预期等级 |
|---|---|---|---|---|
| 1 | `01-website-dev-mixed.txt` | 网站建设外包 | 付款良好但 IP 模糊（未约定付款前权属 + 背景 IP 转让 + 无署名） | 中 |
| 2 | `02-app-dev-highrisk.txt` | App 开发合作 | 全条款高风险（Net-90 + pay-when-paid + 主观验收 + IP 全归 + 无限连带 + 单方终止 + 3 年无补偿竞业 + 永久单向保密 + 无 kill fee） | 高 |
| 3 | `03-design-no-credit.txt` | 平面设计委托 | IP 全归甲方 + 无署名 + 不得展示，其他良好 | 中 |
| 4 | `04-translation-scope-creep.txt` | 翻译服务 | scope 模糊"及其他"+ 无限修改 + 无变更机制 + Net-60 + 无违约金 + IP 全归 + 无限责任 + 单方终止 + 永久单向保密 + 2 年无补偿竞业 | 高 |
| 5 | `05-video-editing-termination.txt` | 视频剪辑外包 | 付款/IP/责任/保密/kill fee 良好，但终止条款单方极不对等 | 中 |
| 6 | `06-wechat-ops-noncompete.txt` | 公众号代运营 | 大部分良好，但竞业 3 年 + 无补偿 + 范围过宽 | 中 |
| 7 | `07-consulting-fair-nda.txt` | 咨询顾问协议 | 全面良好，NDA 3 年双向 + 例外，所有条款合规 | 低 |
| 8 | `08-ui-design-bg-ip.txt` | UI 设计外包 | 全面良好，背景 IP 保留 + 署名 + 8 类条款全合规 | 低 |

## 测试方式

### 浏览器手动测试

1. 启动 dev server：`npm run dev`
2. 访问 http://localhost:3000
3. 复制任一样本文件内容，粘贴到「粘贴文本」框
4. 点击「开始审查」查看 AI 报告

### 命令行批量测试

可参考 `tests/regression.mjs`，把 `tests/fixtures/contracts/` 路径换成 `samples/contracts/` 即可对这 8 份样本跑在线回归。

## 与 tests/fixtures 的区别

| 用途 | 目录 | 数量 |
|---|---|---|
| 自动化回归测试（含 expected 断言） | `tests/fixtures/contracts/` | 5 份 |
| 产品演示与人工测试（无断言） | `samples/contracts/`（本目录） | 8 份 |

本目录的样本不附带 expected JSON，仅供人肉测试与演示。如需为某份样本加自动断言，可参考 `tests/fixtures/expected/` 格式新增对应 JSON 并迁移到 `tests/fixtures/`。
