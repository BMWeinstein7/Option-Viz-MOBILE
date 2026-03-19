import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { Colors } from "@/constants/colors";
import { useAppContext, SavedStrategy, OpenTrade, TradeLeg } from "@/context/AppContext";
import { Analytics, AnalyticsEvents } from "@/lib/analytics";
import { api, OptionsChain } from "@/hooks/useApi";
import { LegRow } from "@/components/LegRow";
import { PnLChart } from "@/components/PnLChart";
import { MetricCard } from "@/components/MetricCard";
import { GreeksBar } from "@/components/GreeksBar";
import { ProfileButton } from "@/components/ProfileMenu";

type PortfolioTab = "dashboard" | "strategies" | "trades";
type Timeframe = "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";

const TIMEFRAME_MS: Record<Timeframe, number> = {
  "1W": 7 * 86400000,
  "1M": 30 * 86400000,
  "3M": 90 * 86400000,
  "6M": 180 * 86400000,
  "1Y": 365 * 86400000,
  "ALL": Infinity,
};

function useLivePnL(trade: OpenTrade) {
  const firstLeg = trade.legs?.[0];
  const expiration = firstLeg?.expiration || "";
  const { data: chain } = useQuery({
    queryKey: ["live-chain", trade.ticker, expiration],
    queryFn: () => api.getChain(trade.ticker, expiration),
    enabled: trade.status === "open" && !!expiration && !!trade.legs?.length,
    refetchInterval: 5000,
    staleTime: 3000,
  });

  if (!chain || !trade.legs?.length || trade.status !== "open") {
    return { currentValue: null, unrealizedPnL: null, legs: trade.legs || [] };
  }

  let currentValue = 0;
  const updatedLegs = trade.legs.map((tl) => {
    const contracts = tl.type === "call" ? chain.calls : chain.puts;
    if (!contracts || contracts.length === 0) {
      const legValue = tl.entryMid * tl.quantity * 100;
      currentValue += tl.action === "buy" ? legValue : -legValue;
      return { ...tl, currentMid: tl.entryMid, currentBid: tl.entryBid, currentAsk: tl.entryAsk };
    }
    const match = contracts.reduce(
      (best, c) => (Math.abs(c.strike - tl.strike) < Math.abs(best.strike - tl.strike) ? c : best),
      contracts[0]
    );
    const currentMid = match ? (match.bid + match.ask) / 2 : tl.entryMid;
    const legValue = currentMid * tl.quantity * 100;
    currentValue += tl.action === "buy" ? legValue : -legValue;
    return { ...tl, currentMid, currentBid: match?.bid, currentAsk: match?.ask };
  });

  const unrealizedPnL = currentValue - trade.entryNetCost;
  return { currentValue, unrealizedPnL, legs: updatedLegs };
}

function PerformanceDashboard({ trades, timeframe, onTimeframeChange }: {
  trades: OpenTrade[];
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
}) {
  const cutoff = timeframe === "ALL" ? 0 : Date.now() - TIMEFRAME_MS[timeframe];

  const closedInRange = trades.filter(
    (t) => t.status === "closed" && (t.closedAt ?? 0) >= cutoff
  );
  const openTrades = trades.filter((t) => t.status === "open");

  const totalRealized = closedInRange.reduce((s, t) => s + (t.realizedPnL ?? 0), 0);
  const winners = closedInRange.filter((t) => (t.realizedPnL ?? 0) > 0);
  const losers = closedInRange.filter((t) => (t.realizedPnL ?? 0) < 0);
  const winRate = closedInRange.length > 0 ? (winners.length / closedInRange.length * 100) : 0;
  const avgWin = winners.length > 0 ? winners.reduce((s, t) => s + (t.realizedPnL ?? 0), 0) / winners.length : 0;
  const avgLoss = losers.length > 0 ? losers.reduce((s, t) => s + (t.realizedPnL ?? 0), 0) / losers.length : 0;
  const bestTrade = closedInRange.length > 0 ? Math.max(...closedInRange.map((t) => t.realizedPnL ?? 0)) : 0;
  const worstTrade = closedInRange.length > 0 ? Math.min(...closedInRange.map((t) => t.realizedPnL ?? 0)) : 0;
  const profitFactor = Math.abs(avgLoss) > 0 ? Math.abs(avgWin / avgLoss) : 0;

  return (
    <View style={styles.dashSection}>
      <View style={styles.tfRow}>
        {(["1W", "1M", "3M", "6M", "1Y", "ALL"] as Timeframe[]).map((tf) => (
          <Pressable
            key={tf}
            style={[styles.tfChip, timeframe === tf && styles.tfChipActive]}
            onPress={() => onTimeframeChange(tf)}
          >
            <Text style={[styles.tfText, timeframe === tf && styles.tfTextActive]}>{tf}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.mainPnlCard}>
        <Text style={styles.mainPnlLabel}>REALIZED P&L</Text>
        <Text style={[styles.mainPnlValue, { color: totalRealized >= 0 ? Colors.accent : Colors.red }]}>
          {totalRealized >= 0 ? "+$" : "-$"}{Math.abs(totalRealized).toFixed(0)}
        </Text>
        <Text style={styles.mainPnlSub}>
          {closedInRange.length} closed trade{closedInRange.length !== 1 ? "s" : ""} · {openTrades.length} open
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>WIN RATE</Text>
          <Text style={[styles.statValue, { color: winRate >= 50 ? Colors.accent : Colors.red }]}>
            {winRate.toFixed(0)}%
          </Text>
          <Text style={styles.statSub}>{winners.length}W / {losers.length}L</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>PROFIT FACTOR</Text>
          <Text style={[styles.statValue, { color: profitFactor >= 1 ? Colors.accent : Colors.red }]}>
            {profitFactor > 0 ? profitFactor.toFixed(2) : "—"}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>AVG WIN</Text>
          <Text style={[styles.statValue, { color: Colors.accent }]}>
            {avgWin > 0 ? `+$${avgWin.toFixed(0)}` : "—"}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>AVG LOSS</Text>
          <Text style={[styles.statValue, { color: Colors.red }]}>
            {avgLoss < 0 ? `-$${Math.abs(avgLoss).toFixed(0)}` : "—"}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>BEST TRADE</Text>
          <Text style={[styles.statValue, { color: Colors.accent }]}>
            {bestTrade > 0 ? `+$${bestTrade.toFixed(0)}` : "—"}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>WORST TRADE</Text>
          <Text style={[styles.statValue, { color: Colors.red }]}>
            {worstTrade < 0 ? `-$${Math.abs(worstTrade).toFixed(0)}` : "—"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function StrategyCard({
  strategy,
  onDelete,
  onOpenTrade,
}: {
  strategy: SavedStrategy;
  onDelete: () => void;
  onOpenTrade: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const { data: analysis, isLoading } = useQuery({
    queryKey: ["analysis", strategy.id],
    queryFn: () =>
      api.analyzeStrategy({
        ticker: strategy.ticker,
        spotPrice: strategy.spotPrice,
        legs: strategy.legs,
      }),
    enabled: expanded,
    staleTime: Infinity,
  });

  const fmtMoney = (n: number | null | undefined) => {
    if (n == null) return "\u2014";
    const abs = Math.abs(n);
    if (abs >= 1000) return `${n >= 0 ? "+" : "-"}$${(abs / 1000).toFixed(1)}k`;
    return `${n >= 0 ? "+" : "-"}$${abs.toFixed(0)}`;
  };

  return (
    <View style={styles.strategyCard}>
      <Pressable
        style={styles.strategyHeader}
        onPress={() => {
          setExpanded(!expanded);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <View style={styles.strategyHeaderLeft}>
          <View style={styles.tickerBadge}>
            <Text style={styles.tickerBadgeText}>{strategy.ticker}</Text>
          </View>
          <View>
            <Text style={styles.strategyName}>{strategy.name}</Text>
            <Text style={styles.strategyDate}>{new Date(strategy.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
        <View style={styles.strategyHeaderRight}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              Alert.alert(
                "Delete Strategy",
                `Remove "${strategy.name}" on ${strategy.ticker}? This cannot be undone.`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                      onDelete();
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    },
                  },
                ]
              );
            }}
            hitSlop={12}
            style={styles.deleteStratBtn}
          >
            <Feather name="trash-2" size={16} color={Colors.red} />
          </Pressable>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={Colors.textMuted} />
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.strategyBody}>
          <Text style={styles.subLabel}>Spot at save: ${strategy.spotPrice.toFixed(2)}</Text>
          {strategy.legs.map((leg) => (
            <View key={leg.id} style={{ marginBottom: 6 }}>
              <LegRow leg={leg} />
            </View>
          ))}
          {isLoading && <ActivityIndicator color={Colors.accent} style={{ marginVertical: 20 }} />}
          {analysis && (
            <>
              <View style={styles.chartWrapper}>
                <PnLChart data={analysis.pnlAtExpiry} spotPrice={strategy.spotPrice} breakEvenPoints={analysis.breakEvenPoints} height={180} />
              </View>
              <View style={styles.metricsRow}>
                <MetricCard label="Max Profit" value={analysis.maxProfit != null ? fmtMoney(analysis.maxProfit) : "Unlimited"} color={Colors.accent} small />
                <MetricCard label="Max Loss" value={analysis.maxLoss != null ? fmtMoney(analysis.maxLoss) : "Unlimited"} color={Colors.red} small />
              </View>
              <View style={styles.greeksSection}>
                <Text style={styles.subLabel}>Greeks</Text>
                <GreeksBar delta={analysis.greeks.delta} gamma={analysis.greeks.gamma} theta={analysis.greeks.theta} vega={analysis.greeks.vega} rho={analysis.greeks.rho} />
              </View>
            </>
          )}
          <Pressable style={styles.openTradeBtn} onPress={onOpenTrade}>
            <Feather name="play-circle" size={16} color={Colors.blue} />
            <Text style={styles.openTradeBtnText}>Open Trade (Live Mid Prices)</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function TradeCard({ trade, onDelete }: { trade: OpenTrade; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [exitInput, setExitInput] = useState("");
  const [editEntry, setEditEntry] = useState(String(trade.entryNetCost));
  const [editLegs, setEditLegs] = useState<TradeLeg[]>(trade.legs || []);
  const [editNotes, setEditNotes] = useState("");
  const { closeTrade, updateTrade, deleteTrade } = useAppContext();

  const { currentValue, unrealizedPnL, legs: liveLegData } = useLivePnL(trade);
  const isOpen = trade.status === "open";
  const pnl = isOpen ? unrealizedPnL : trade.realizedPnL;

  const handleClose = useCallback(async () => {
    const exit = parseFloat(exitInput);
    if (isNaN(exit)) return;
    await closeTrade(trade.id, exit);
    setCloseModal(false);
    setExitInput("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [exitInput, trade.id, closeTrade]);

  const handleCloseAtLive = useCallback(async () => {
    if (currentValue == null) return;
    await closeTrade(trade.id, Math.round(currentValue * 100) / 100);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [currentValue, trade.id, closeTrade]);

  const handleEditLegQty = useCallback((index: number, delta: number) => {
    setEditLegs((prev) => {
      const updated = [...prev];
      const newQty = Math.max(1, updated[index].quantity + delta);
      updated[index] = { ...updated[index], quantity: newQty };
      const newCost = updated.reduce((sum, tl) => {
        const cost = tl.entryMid * tl.quantity * 100;
        return sum + (tl.action === "buy" ? cost : -cost);
      }, 0);
      setEditEntry(String(Math.round(newCost * 100) / 100));
      return updated;
    });
  }, []);

  const handleEditLegQtyDirect = useCallback((index: number, value: string) => {
    const parsed = parseInt(value, 10);
    if (value === "") {
      setEditLegs((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], quantity: 1 };
        return updated;
      });
      return;
    }
    if (isNaN(parsed) || parsed < 1) return;
    setEditLegs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: parsed };
      const newCost = updated.reduce((sum, tl) => {
        const cost = tl.entryMid * tl.quantity * 100;
        return sum + (tl.action === "buy" ? cost : -cost);
      }, 0);
      setEditEntry(String(Math.round(newCost * 100) / 100));
      return updated;
    });
  }, []);

  const handleEdit = useCallback(async () => {
    const entry = parseFloat(editEntry);
    if (isNaN(entry)) return;
    await updateTrade(trade.id, { entryNetCost: entry, legs: editLegs });
    Analytics.track(AnalyticsEvents.TRADE_EDIT_SAVED, {
      trade_id: trade.id,
      strategy_name: trade.strategyName,
      ticker: trade.ticker,
      new_entry_cost: entry,
      leg_quantities: editLegs.map((l) => l.quantity),
    });
    setEditModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [editEntry, editLegs, trade.id, trade.strategyName, trade.ticker, updateTrade]);

  return (
    <View style={styles.tradeCard}>
      <Pressable
        style={styles.tradeHeader}
        onPress={() => {
          setExpanded(!expanded);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <View style={styles.tradeHeaderLeft}>
          <View style={[styles.tradeBadge, { backgroundColor: isOpen ? Colors.accentDim : Colors.glassElevated }]}>
            <Text style={[styles.tradeBadgeText, { color: isOpen ? Colors.accent : Colors.textMuted }]}>
              {isOpen ? "OPEN" : "CLOSED"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tradeTitle}>{trade.strategyName}</Text>
            <Text style={styles.tradeTicker}>{trade.ticker}</Text>
          </View>
        </View>
        <View style={styles.tradePnlCol}>
          {pnl != null && (
            <Text style={[styles.tradePnlValue, { color: pnl >= 0 ? Colors.accent : Colors.red }]}>
              {pnl >= 0 ? "+" : ""}{pnl >= 0 ? "$" : "-$"}{Math.abs(pnl).toFixed(0)}
            </Text>
          )}
          {isOpen && unrealizedPnL != null && (
            <View style={styles.unrealizedBadge}>
              <View style={styles.liveDotSmall} />
              <Text style={styles.unrealizedLabel}>LIVE</Text>
            </View>
          )}
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={Colors.textMuted} />
      </Pressable>

      {expanded && (
        <View style={styles.tradeBody}>
          <View style={styles.tradeDetails}>
            <View style={styles.tradeDetail}>
              <Text style={styles.tradeDetailLabel}>ENTRY COST</Text>
              <Text style={styles.tradeDetailValue}>
                {trade.entryNetCost >= 0 ? `$${trade.entryNetCost.toFixed(0)}` : `-$${Math.abs(trade.entryNetCost).toFixed(0)}`}
              </Text>
            </View>
            {isOpen && currentValue != null && (
              <View style={styles.tradeDetail}>
                <Text style={styles.tradeDetailLabel}>CURRENT VALUE</Text>
                <Text style={[styles.tradeDetailValue, { color: Colors.blue }]}>${currentValue.toFixed(0)}</Text>
              </View>
            )}
            {trade.exitValue != null && (
              <View style={styles.tradeDetail}>
                <Text style={styles.tradeDetailLabel}>EXIT VALUE</Text>
                <Text style={styles.tradeDetailValue}>${trade.exitValue.toFixed(0)}</Text>
              </View>
            )}
            <View style={styles.tradeDetail}>
              <Text style={styles.tradeDetailLabel}>SPOT AT ENTRY</Text>
              <Text style={styles.tradeDetailValue}>${(trade.entrySpotPrice ?? 0).toFixed(2)}</Text>
            </View>
            <View style={styles.tradeDetail}>
              <Text style={styles.tradeDetailLabel}>OPENED</Text>
              <Text style={styles.tradeDetailValue}>{new Date(trade.openedAt).toLocaleDateString()}</Text>
            </View>
            {trade.closedAt && (
              <View style={styles.tradeDetail}>
                <Text style={styles.tradeDetailLabel}>CLOSED</Text>
                <Text style={styles.tradeDetailValue}>{new Date(trade.closedAt).toLocaleDateString()}</Text>
              </View>
            )}
          </View>

          {trade.legs && trade.legs.length > 0 && (
            <>
              <Text style={styles.subLabel}>Legs (Entry Mid)</Text>
              {trade.legs.map((tl, i) => {
                const live = (liveLegData as any[])?.[i];
                return (
                  <View key={`${tl.strike}-${tl.type}-${i}`} style={styles.tradeLegRow}>
                    <View style={[styles.miniActionBadge, { backgroundColor: tl.action === "buy" ? Colors.accentDim : Colors.redDim }]}>
                      <Text style={[styles.miniActionText, { color: tl.action === "buy" ? Colors.accent : Colors.red }]}>{tl.action.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.miniTypeBadge, { backgroundColor: tl.type === "call" ? Colors.blueDim : Colors.purpleDim }]}>
                      <Text style={[styles.miniTypeText, { color: tl.type === "call" ? Colors.blue : Colors.purple }]}>{tl.type.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.tradeLegStrike}>${tl.strike}</Text>
                    <Text style={styles.tradeLegQty}>x{tl.quantity}</Text>
                    <View style={{ flex: 1, alignItems: "flex-end" }}>
                      <Text style={styles.tradeLegEntry}>Entry: ${tl.entryMid.toFixed(2)}</Text>
                      {isOpen && live?.currentMid != null && (
                        <Text style={[styles.tradeLegLive, { color: live.currentMid >= tl.entryMid ? Colors.accent : Colors.red }]}>
                          Now: ${live.currentMid.toFixed(2)}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </>
          )}

          <View style={styles.tradeActions}>
            {isOpen && (
              <>
                {currentValue != null && (
                  <Pressable style={styles.closeAtLiveBtn} onPress={handleCloseAtLive}>
                    <Feather name="zap" size={15} color={Colors.gold} />
                    <Text style={styles.closeAtLiveBtnText} numberOfLines={1}>
                      Close @ Live
                    </Text>
                    <Text style={styles.closeAtLiveValue} numberOfLines={1}>
                      ${Math.abs(currentValue).toFixed(0)}
                    </Text>
                  </Pressable>
                )}
                <Pressable style={styles.closeTradeBtn} onPress={() => setCloseModal(true)}>
                  <Feather name="stop-circle" size={15} color={Colors.red} />
                  <Text style={styles.closeTradeBtnText}>Close Manual</Text>
                </Pressable>
              </>
            )}
            <View style={styles.tradeActionsSecondary}>
              {isOpen && (
                <Pressable style={styles.editTradeBtn} onPress={() => { setEditLegs([...trade.legs]); setEditEntry(String(trade.entryNetCost)); setEditModal(true); }}>
                  <Feather name="edit-2" size={14} color={Colors.textSecondary} />
                  <Text style={styles.editTradeBtnText}>Edit</Text>
                </Pressable>
              )}
              <Pressable style={styles.deleteTradeBtn} onPress={() => Alert.alert("Delete Trade", "Remove this trade from your history?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: onDelete }])}>
                <Feather name="trash-2" size={14} color={Colors.red} />
                <Text style={styles.deleteTradeBtnText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <Modal visible={closeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Close Trade</Text>
            <Text style={styles.modalSub}>Enter the exit value for this trade</Text>
            <TextInput style={styles.modalInput} placeholder="Exit value (e.g. 600)" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={exitInput} onChangeText={setExitInput} />
            <View style={styles.modalBtns}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setCloseModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalConfirmBtn} onPress={handleClose}>
                <Text style={styles.modalConfirmText}>Close Trade</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }} keyboardShouldPersistTaps="handled">
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Trade</Text>
            <Text style={styles.modalSub}>Adjust contracts per leg and entry cost</Text>
            <View style={{ gap: 12 }}>
              {editLegs.map((leg, i) => (
                <View key={`edit-leg-${i}`} style={styles.editLegRow}>
                  <View style={styles.editLegInfo}>
                    <View style={[styles.miniActionBadge, { backgroundColor: leg.action === "buy" ? Colors.accentDim : Colors.redDim }]}>
                      <Text style={[styles.miniActionText, { color: leg.action === "buy" ? Colors.accent : Colors.red }]}>{leg.action.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.miniTypeBadge, { backgroundColor: leg.type === "call" ? Colors.blueDim : Colors.purpleDim }]}>
                      <Text style={[styles.miniTypeText, { color: leg.type === "call" ? Colors.blue : Colors.purple }]}>{leg.type.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.editLegStrike}>${leg.strike}</Text>
                  </View>
                  <View style={styles.editQtyControls}>
                    <Pressable style={styles.editQtyBtn} onPress={() => handleEditLegQty(i, -1)}>
                      <Feather name="minus" size={14} color={Colors.textSecondary} />
                    </Pressable>
                    <TextInput
                      style={styles.editQtyInput}
                      keyboardType="numeric"
                      value={String(leg.quantity)}
                      onChangeText={(v) => handleEditLegQtyDirect(i, v)}
                    />
                    <Pressable style={styles.editQtyBtn} onPress={() => handleEditLegQty(i, 1)}>
                      <Feather name="plus" size={14} color={Colors.textSecondary} />
                    </Pressable>
                  </View>
                </View>
              ))}
              <View>
                <Text style={styles.editLabel}>Entry Net Cost</Text>
                <TextInput style={styles.modalInput} keyboardType="numeric" value={editEntry} onChangeText={setEditEntry} />
              </View>
            </View>
            <View style={styles.modalBtns}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setEditModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalConfirmBtn} onPress={handleEdit}>
                <Text style={styles.modalConfirmText}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<PortfolioTab>("dashboard");
  const [timeframe, setTimeframe] = useState<Timeframe>("ALL");
  const { user, savedStrategies, openTrades, deleteStrategy, openTrade, deleteTrade } = useAppContext();

  const handleOpenTradeFromStrategy = useCallback(async (strategy: SavedStrategy) => {
    let entryNetCost = 0;
    const tradeLegs: TradeLeg[] = [];

    try {
      const firstExp = strategy.legs[0]?.expiration;
      if (firstExp) {
        const chain = await api.getChain(strategy.ticker, firstExp);
        for (const leg of strategy.legs) {
          const contracts = leg.type === "call" ? chain.calls : chain.puts;
          const match = contracts.reduce(
            (best, c) => (Math.abs(c.strike - leg.strike) < Math.abs(best.strike - leg.strike) ? c : best),
            contracts[0]
          );
          const mid = match ? (match.bid + match.ask) / 2 : leg.premium;
          const cost = mid * leg.quantity * 100;
          entryNetCost += leg.action === "buy" ? cost : -cost;
          tradeLegs.push({
            action: leg.action,
            type: leg.type,
            strike: leg.strike,
            quantity: leg.quantity,
            expiration: leg.expiration,
            entryMid: Math.round(mid * 100) / 100,
            entryBid: match?.bid ?? mid,
            entryAsk: match?.ask ?? mid,
          });
        }
      }
    } catch {
      for (const leg of strategy.legs) {
        const cost = leg.premium * leg.quantity * 100;
        entryNetCost += leg.action === "buy" ? cost : -cost;
        tradeLegs.push({
          action: leg.action,
          type: leg.type,
          strike: leg.strike,
          quantity: leg.quantity,
          expiration: leg.expiration,
          entryMid: leg.premium,
          entryBid: leg.premium,
          entryAsk: leg.premium,
        });
      }
    }

    await openTrade({
      strategyId: strategy.id,
      strategyName: strategy.name,
      ticker: strategy.ticker,
      openedAt: Date.now(),
      entryNetCost: Math.round(entryNetCost * 100) / 100,
      entrySpotPrice: strategy.spotPrice,
      legs: tradeLegs,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Trade Opened!", `Entry: $${Math.abs(entryNetCost).toFixed(0)} ${entryNetCost >= 0 ? "debit" : "credit"} (live midpoints)`);
    setTab("trades");
  }, [openTrade]);

  return (
    <View style={[styles.root, {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
      paddingBottom: Platform.OS === "web" ? 34 : 0,
    }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Portfolio</Text>
          {user && <Text style={styles.headerSub}>{user.email || [user.firstName, user.lastName].filter(Boolean).join(" ") || ""}</Text>}
        </View>
        <ProfileButton />
      </View>

      <View style={styles.tabRow}>
        {(["dashboard", "strategies", "trades"] as PortfolioTab[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === "dashboard" ? "Dashboard" : t === "strategies" ? `Saved (${savedStrategies.length})` : `Trades (${openTrades.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {tab === "dashboard" && (
          <PerformanceDashboard
            trades={openTrades}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
          />
        )}

        {tab === "strategies" && (
          <>
            {savedStrategies.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="bookmark" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No saved strategies</Text>
                <Text style={styles.emptyDesc}>
                  {user ? "Build a strategy in the Builder tab and save it here" : "Sign in to save strategies across devices"}
                </Text>
              </View>
            ) : (
              savedStrategies.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  onDelete={() => deleteStrategy(strategy.id)}
                  onOpenTrade={() => handleOpenTradeFromStrategy(strategy)}
                />
              ))
            )}
          </>
        )}

        {tab === "trades" && (
          <>
            {openTrades.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="activity" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No trades yet</Text>
                <Text style={styles.emptyDesc}>Open a trade from the Builder or your saved strategies</Text>
              </View>
            ) : (
              <>
                {openTrades.filter((t) => t.status === "open").length > 0 && (
                  <Text style={styles.tradeGroupLabel}>Open Positions</Text>
                )}
                {openTrades.filter((t) => t.status === "open").map((trade) => (
                  <TradeCard key={trade.id} trade={trade} onDelete={() => deleteTrade(trade.id)} />
                ))}
                {openTrades.filter((t) => t.status === "closed").length > 0 && (
                  <Text style={styles.tradeGroupLabel}>Closed Trades</Text>
                )}
                {openTrades.filter((t) => t.status === "closed").map((trade) => (
                  <TradeCard key={trade.id} trade={trade} onDelete={() => deleteTrade(trade.id)} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  tabRow: { flexDirection: "row", paddingHorizontal: 20, gap: 6, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center", backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder },
  tabBtnActive: { backgroundColor: Colors.accentDim, borderColor: Colors.accent + "30" },
  tabBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  tabBtnTextActive: { color: Colors.accent, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120, gap: 12 },
  dashSection: { gap: 12 },
  tfRow: { flexDirection: "row", gap: 6 },
  tfChip: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center", backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder },
  tfChipActive: { backgroundColor: Colors.accentDim, borderColor: Colors.accent + "30" },
  tfText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.textMuted },
  tfTextActive: { color: Colors.accent },
  mainPnlCard: { backgroundColor: Colors.glassElevated, borderRadius: 20, padding: 24, alignItems: "center", gap: 6, borderWidth: 1, borderColor: Colors.glassBorder },
  mainPnlLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.textMuted, letterSpacing: 1 },
  mainPnlValue: { fontSize: 36, fontFamily: "Inter_700Bold" },
  mainPnlSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  statsGrid: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: Colors.glassElevated, borderRadius: 14, padding: 14, gap: 4, borderWidth: 1, borderColor: Colors.glassBorder, alignItems: "center" },
  statLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", color: Colors.textMuted, letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  emptyDesc: { fontSize: 14, color: Colors.textMuted, fontFamily: "Inter_400Regular", textAlign: "center", maxWidth: 260 },
  strategyCard: { backgroundColor: Colors.glassElevated, borderRadius: 16, borderWidth: 1, borderColor: Colors.glassBorder, overflow: "hidden" },
  strategyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  strategyHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  strategyHeaderRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  deleteStratBtn: { padding: 6, borderRadius: 8, backgroundColor: Colors.redDim },
  tickerBadge: { backgroundColor: Colors.accentDim, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: Colors.accent + "25" },
  tickerBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.accent },
  strategyName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.textPrimary },
  strategyDate: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  strategyBody: { padding: 14, paddingTop: 10, gap: 10, borderTopWidth: 1, borderTopColor: Colors.glassBorder },
  subLabel: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_500Medium" },
  chartWrapper: { backgroundColor: Colors.glass, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: Colors.glassBorder },
  metricsRow: { flexDirection: "row", gap: 8 },
  greeksSection: { gap: 8 },
  openTradeBtn: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", backgroundColor: Colors.blueDim, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: Colors.blue + "25" },
  openTradeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.blue },
  tradeGroupLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 8, marginBottom: -4 },
  tradeCard: { backgroundColor: Colors.glassElevated, borderRadius: 14, borderWidth: 1, borderColor: Colors.glassBorder, overflow: "hidden" },
  tradeHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  tradeHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  tradeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  tradeBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  tradeTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.textPrimary },
  tradeTicker: { fontSize: 12, color: Colors.textMuted, fontFamily: "Inter_400Regular" },
  tradePnlCol: { alignItems: "flex-end", gap: 4 },
  tradePnlValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  unrealizedBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  liveDotSmall: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accent },
  unrealizedLabel: { fontSize: 8, fontFamily: "Inter_700Bold", color: Colors.accent, letterSpacing: 0.5 },
  tradeBody: { padding: 14, paddingTop: 0, gap: 10, borderTopWidth: 1, borderTopColor: Colors.glassBorder },
  tradeDetails: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  tradeDetail: { gap: 3, minWidth: 80 },
  tradeDetailLabel: { fontSize: 9, color: Colors.textMuted, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  tradeDetailValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.textPrimary },
  tradeLegRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.glassBorder },
  miniActionBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  miniActionText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  miniTypeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  miniTypeText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  tradeLegStrike: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.textPrimary },
  tradeLegQty: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  tradeLegEntry: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  tradeLegLive: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  tradeActions: { gap: 10, marginTop: 6 },
  tradeActionsSecondary: { flexDirection: "row", gap: 8 },
  editTradeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, paddingHorizontal: 16, backgroundColor: Colors.glass, borderRadius: 12, borderWidth: 1, borderColor: Colors.glassBorder },
  editTradeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  closeAtLiveBtn: { alignSelf: "stretch" as const, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, paddingHorizontal: 20, backgroundColor: Colors.goldDim, borderRadius: 12, borderWidth: 1, borderColor: Colors.gold + "25" },
  closeAtLiveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.gold },
  closeAtLiveValue: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.gold },
  closeTradeBtn: { alignSelf: "stretch" as const, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, paddingHorizontal: 20, backgroundColor: Colors.redDim, borderRadius: 12, borderWidth: 1, borderColor: Colors.red + "20" },
  closeTradeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.red },
  deleteTradeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, paddingHorizontal: 16, backgroundColor: Colors.glass, borderRadius: 12, borderWidth: 1, borderColor: Colors.red + "15" },
  deleteTradeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.red },
  editLegRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.glassElevated, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: Colors.glassBorder },
  editLegInfo: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  editLegStrike: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.textPrimary },
  editQtyControls: { flexDirection: "row", alignItems: "center", gap: 4 },
  editQtyBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder, alignItems: "center", justifyContent: "center" },
  editQtyInput: { width: 44, height: 32, borderRadius: 8, backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder, textAlign: "center", color: Colors.textPrimary, fontFamily: "Inter_600SemiBold", fontSize: 14 },
  editLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary, marginBottom: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16, borderWidth: 1, borderColor: Colors.glassBorder, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.textPrimary },
  modalSub: { fontSize: 14, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  modalInput: { backgroundColor: Colors.glassElevated, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: Colors.textPrimary, fontFamily: "Inter_500Medium", fontSize: 16, borderWidth: 1, borderColor: Colors.glassBorder },
  modalBtns: { flexDirection: "row", gap: 10 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", backgroundColor: Colors.glassElevated, borderWidth: 1, borderColor: Colors.glassBorder },
  modalCancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.accent, alignItems: "center" },
  modalConfirmText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.bg },
});
