export interface Order {
  outTradeNo: string;
  money: string;
  type: "alipay" | "wxpay" | "qqpay";
  status: "pending" | "paid" | "failed";
  createdAt: number;
  paidAt?: number;
  tradeNo?: string;
  userId?: string;
}

const TTL_MS = 1000 * 60 * 30;

const store = new Map<string, Order>();

export function createOrder(input: {
  outTradeNo: string;
  money: string;
  type: Order["type"];
  userId?: string;
}): Order {
  const order: Order = {
    outTradeNo: input.outTradeNo,
    money: input.money,
    type: input.type,
    status: "pending",
    createdAt: Date.now(),
    userId: input.userId,
  };
  store.set(input.outTradeNo, order);
  return order;
}

export function getOrder(outTradeNo: string): Order | undefined {
  return store.get(outTradeNo);
}

export function markPaid(outTradeNo: string, tradeNo: string): Order | undefined {
  const order = store.get(outTradeNo);
  if (!order) return undefined;
  if (order.status === "paid") return order;
  order.status = "paid";
  order.paidAt = Date.now();
  order.tradeNo = tradeNo;
  return order;
}

export function listPending(): Order[] {
  return Array.from(store.values()).filter((o) => o.status === "pending");
}

export function cleanup(): void {
  const now = Date.now();
  for (const [id, order] of store) {
    if (order.status === "pending" && now - order.createdAt > TTL_MS) {
      order.status = "failed";
      store.delete(id);
    }
  }
}
