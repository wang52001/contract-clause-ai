import { z } from "zod";
import { CLAUSE_ORDER } from "@/lib/constants/clauses";

export const ClauseTypeEnum = z.enum([
  "payment",
  "ip",
  "liability",
  "termination",
  "scope",
  "non_compete",
  "nda",
  "kill_fee",
]);

export const SeverityEnum = z.enum(["high", "medium", "low", "missing"]);

export const LegalBasisSchema = z.object({
  law: z.string().describe("法律名称，如“中华人民共和国著作权法”"),
  article: z.string().describe("条号，如“第十九条”"),
  text: z.string().describe("条文摘要"),
});

export const ClauseSchema = z.object({
  type: ClauseTypeEnum,
  title: z.string().describe("条款中文名称"),
  severity: SeverityEnum,
  sub_score: z.number().min(0).max(100).describe("该条款风险子分，0=无风险，100=极高风险；缺失时填 100"),
  original_text: z.string().describe("合同原文片段，必须逐字来自输入合同，找不到则填空字符串"),
  plain_explanation: z.string().describe("大白话解读，口语化中文，告诉自由职业者这条意味着什么"),
  risks: z.array(z.string()).describe("具体风险点列表"),
  suggested_revision: z.string().nullable().describe("建议替换的具体文字（可发给甲方），缺失条款填建议补充文字"),
  negotiation_script: z.string().nullable().describe("可直接发给甲方的谈判话术，含理由与诉求"),
  legal_basis: z.array(LegalBasisSchema).describe("中国法律依据，仅引用真实存在条文，不确定则留空数组"),
  confidence: z.number().min(0).max(1).describe("置信度 0-1，低于 0.6 表示不确定"),
});

export const MissingProtectionSchema = z.object({
  type: ClauseTypeEnum,
  why_needed: z.string().describe("为什么自由职业者需要这个条款"),
  suggested_text: z.string().describe("建议补充的具体条款文字"),
});

export const OverallSchema = z.object({
  summary: z.string().describe("一句话总评"),
  top_risks: z.array(z.string()).max(3).describe("最严重的前 3 个风险"),
});

export const AnalysisResultSchema = z.object({
  overall: OverallSchema,
  clauses: z.array(ClauseSchema),
  missing_protections: z.array(MissingProtectionSchema),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type Clause = z.infer<typeof ClauseSchema>;
export type Severity = z.infer<typeof SeverityEnum>;
export type ClauseType = z.infer<typeof ClauseTypeEnum>;
export type LegalBasis = z.infer<typeof LegalBasisSchema>;
export type MissingProtection = z.infer<typeof MissingProtectionSchema>;

export const CLAUSE_TYPE_LIST = CLAUSE_ORDER;
