export type ClauseType =
  | "payment"
  | "ip"
  | "liability"
  | "termination"
  | "scope"
  | "non_compete"
  | "nda"
  | "kill_fee";

export interface ClauseDef {
  type: ClauseType;
  title: string;
  weight: number;
  description: string;
  highRiskSignals: string[];
  fairProtections: string[];
}

export const CLAUSE_DEFS: Record<ClauseType, ClauseDef> = {
  payment: {
    type: "payment",
    title: "付款条款",
    weight: 0.2,
    description: "付款节点、比例、触发条件、逾期违约金等",
    highRiskSignals: [
      "无明确付款节点或时间表",
      "尾款比例低于 30%",
      "以“验收合格”作为付款前提且验收标准主观",
      "无逾期付款违约金",
      "付款周期超 60 天（Net-60 以上）",
      "“pay-when-paid”转嫁甲方收款风险",
    ],
    fairProtections: [
      "按里程碑分阶段付款（如 30% 预付 / 40% 中期 / 30% 验收）",
      "明确验收标准与客观触发条件",
      "逾期付款按日计违约金（如 0.05%/日）",
      "付款周期 Net-15 至 Net-30",
    ],
  },
  ip: {
    type: "ip",
    title: "知识产权",
    weight: 0.18,
    description: "著作权归属、署名权、背景 IP、衍生作品",
    highRiskSignals: [
      "著作权全部归甲方且未约定未付款前权属",
      "“work made for hire”一揽子条款剥夺全部权利",
      "无署名权或展示权",
      "背景 IP（既有工具/模板/框架）被一并转让",
      "衍生作品权全部归甲方",
    ],
    fairProtections: [
      "著作权在付清全款后方转移",
      "明确保留背景 IP 所有权",
      "保留署名权与作品集展示权",
      "仅转让本项目交付物的具体使用权",
    ],
  },
  liability: {
    type: "liability",
    title: "责任限制",
    weight: 0.15,
    description: "损害赔偿上限、间接损失、 indemnification",
    highRiskSignals: [
      "无责任上限（无限责任）",
      "含间接损失、利润损失赔偿",
      "赔偿无封顶",
      "单方 indemnification（仅乙方赔偿甲方）",
      "个人财产承担无限连带责任",
    ],
    fairProtections: [
      "责任上限以本合同已收总额为限",
      "排除间接损失、后果性损失",
      "双向 indemnification 或对等条款",
    ],
  },
  termination: {
    type: "termination",
    title: "终止条款",
    weight: 0.13,
    description: "解约权、通知期、终止后结算",
    highRiskSignals: [
      "甲方可随时无因终止且无通知期",
      "终止时不结算已发生费用",
      "单方终止权（仅甲方有）",
      "终止后仍约束乙方竞业或保密",
    ],
    fairProtections: [
      "终止需提前 15-30 天书面通知",
      "终止时按已完成工作量结算",
      "双方对等终止权",
    ],
  },
  scope: {
    type: "scope",
    title: "工作范围",
    weight: 0.12,
    description: "交付物、修改次数、scope creep",
    highRiskSignals: [
      "范围模糊（“及其他相关任务”）",
      "无具体交付物清单",
      "无限次免费修改",
      "无变更订单（change order）机制",
    ],
    fairProtections: [
      "明确交付物清单与验收标准",
      "修改次数上限（如 3 轮）",
      "超范围工作需签变更订单并另收费",
    ],
  },
  non_compete: {
    type: "non_compete",
    title: "竞业限制",
    weight: 0.08,
    description: "竞业范围、期限、补偿",
    highRiskSignals: [
      "竞业期限超 2 年",
      "无竞业补偿金",
      "竞业范围过宽（“互联网及相关行业”）",
      "对自由职业者施加员工级竞业义务",
    ],
    fairProtections: [
      "竞业期限 6-12 个月",
      "按月支付竞业补偿（不低于离职前月均工资 30%）",
      "竞业范围具体且合理",
    ],
  },
  nda: {
    type: "nda",
    title: "保密条款",
    weight: 0.08,
    description: "保密范围、期限、例外",
    highRiskSignals: [
      "单向保密（仅约束乙方）",
      "保密期限过长或无限期",
      "“保密信息”定义过宽（含所有信息）",
      "无例外条款（公开信息、合法获得等）",
    ],
    fairProtections: [
      "双向保密",
      "保密期限 2-3 年（商业秘密除外）",
      "明确例外（已公开、独立开发、合法获得）",
    ],
  },
  kill_fee: {
    type: "kill_fee",
    title: "取消费条款",
    weight: 0.06,
    description: "项目取消时的补偿",
    highRiskSignals: [
      "无取消费 / kill fee 条款",
      "甲方可无赔偿取消项目",
      "取消后已做工作不结算",
    ],
    fairProtections: [
      "取消需按已发生工作量补偿",
      "按取消阶段分级补偿（如开工后 30%、过半 60%）",
      "不可抗力以外的取消需赔偿",
    ],
  },
};

export const CLAUSE_ORDER: ClauseType[] = [
  "payment",
  "ip",
  "liability",
  "termination",
  "scope",
  "non_compete",
  "nda",
  "kill_fee",
];

export const TOTAL_WEIGHT = CLAUSE_ORDER.reduce(
  (sum, t) => sum + CLAUSE_DEFS[t].weight,
  0
);
