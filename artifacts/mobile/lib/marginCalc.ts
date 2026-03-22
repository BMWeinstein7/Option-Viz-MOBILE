export interface MarginLeg {
  action: "buy" | "sell";
  type: "call" | "put";
  strike: number;
  premium: number;
  quantity: number;
}

export interface MarginResult {
  requirement: number;
  type: string;
  description: string;
}

function nakedCallMargin(stockPrice: number, strike: number, premium: number, quantity: number): number {
  const otmAmount = Math.max(0, strike - stockPrice);
  const method1 = (0.20 * stockPrice - otmAmount + premium) * 100 * quantity;
  const method2 = (0.10 * stockPrice + premium) * 100 * quantity;
  const method3 = (50 + premium) * quantity;
  return Math.max(method1, method2, method3);
}

function nakedPutMargin(stockPrice: number, strike: number, premium: number, quantity: number): number {
  const otmAmount = Math.max(0, stockPrice - strike);
  const method1 = (0.20 * stockPrice - otmAmount + premium) * 100 * quantity;
  const method2 = (0.10 * strike + premium) * 100 * quantity;
  const method3 = (50 + premium) * quantity;
  return Math.max(method1, method2, method3);
}

export function calculateMargin(legs: MarginLeg[], stockPrice: number): MarginResult {
  if (legs.length === 0) {
    return { requirement: 0, type: "None", description: "No legs" };
  }

  const buyLegs = legs.filter((l) => l.action === "buy");
  const sellLegs = legs.filter((l) => l.action === "sell");

  if (sellLegs.length === 0) {
    const totalDebit = buyLegs.reduce((s, l) => s + l.premium * l.quantity * 100, 0);
    return {
      requirement: totalDebit,
      type: "Debit",
      description: "Long position — max risk is premium paid",
    };
  }

  if (buyLegs.length === 1 && sellLegs.length === 1) {
    const buy = buyLegs[0];
    const sell = sellLegs[0];
    if (buy.type === sell.type) {
      const width = Math.abs(buy.strike - sell.strike);
      const contracts = Math.min(buy.quantity, sell.quantity);
      const netPremium = (sell.premium - buy.premium) * contracts * 100;
      const isCredit = netPremium > 0;
      const maxLoss = isCredit
        ? width * contracts * 100 - netPremium
        : Math.abs(netPremium);
      return {
        requirement: Math.max(maxLoss, 0),
        type: isCredit ? "Credit Spread" : "Debit Spread",
        description: isCredit
          ? `Credit spread — width $${width} × ${contracts} contracts`
          : `Debit spread — max risk is premium paid`,
      };
    }
  }

  const sellCalls = sellLegs.filter((l) => l.type === "call");
  const sellPuts = sellLegs.filter((l) => l.type === "put");
  const buyCalls = buyLegs.filter((l) => l.type === "call");
  const buyPuts = buyLegs.filter((l) => l.type === "put");

  let totalMargin = 0;

  const usedBuyCalls = new Set<number>();
  const usedBuyPuts = new Set<number>();

  for (const sc of sellCalls) {
    const coverIdx = buyCalls.findIndex(
      (bc, i) => !usedBuyCalls.has(i) && bc.quantity >= sc.quantity
    );
    if (coverIdx >= 0) {
      usedBuyCalls.add(coverIdx);
      const width = Math.abs(sc.strike - buyCalls[coverIdx].strike);
      totalMargin += width * sc.quantity * 100;
    } else {
      totalMargin += nakedCallMargin(stockPrice, sc.strike, sc.premium, sc.quantity);
    }
  }

  for (const sp of sellPuts) {
    const coverIdx = buyPuts.findIndex(
      (bp, i) => !usedBuyPuts.has(i) && bp.quantity >= sp.quantity
    );
    if (coverIdx >= 0) {
      usedBuyPuts.add(coverIdx);
      const width = Math.abs(sp.strike - buyPuts[coverIdx].strike);
      totalMargin += width * sp.quantity * 100;
    } else {
      totalMargin += nakedPutMargin(stockPrice, sp.strike, sp.premium, sp.quantity);
    }
  }

  const hasNaked = sellCalls.some(
    (sc) => !buyCalls.some((bc) => bc.quantity >= sc.quantity)
  ) || sellPuts.some(
    (sp) => !buyPuts.some((bp) => bp.quantity >= sp.quantity)
  );

  return {
    requirement: Math.round(totalMargin),
    type: hasNaked ? "Naked" : "Defined Risk",
    description: hasNaked
      ? "Includes naked short options — high margin requirement"
      : "All short options are covered by long options",
  };
}
