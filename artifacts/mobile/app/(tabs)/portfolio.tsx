import React, { useState, useCallback } from "react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors } from "@/constants/colors";
import { useAppContext, SavedStrategy, OpenTrade } from "@/context/AppContext";
import { api } from "@/hooks/useApi";
import { LegRow } from "@/components/LegRow";
import { PnLChart } from "@/components/PnLChart";
import { MetricCard } from "@/components/MetricCard";
import { GreeksBar } from "@/components/GreeksBar";

type PortfolioTab = "strategies" | "trades";

function StrategyCard({
  strategy,
  onDelete,
  onOpenTrade,
}: {
  strategy: SavedStrategy;
  onDelete: () => void;
  onOpenTrade: (entryNetCost: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [tradeModal, setTradeModal] = useState(false);
  const [entryInput, setEntryInput] = useState("");

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

  const handleOpenTrade = useCallback(() => {
    const cost = parseFloat(entryInput);
    if (isNaN(cost)) return;
    onOpenTrade(cost);
    setTradeModal(false);
    setEntryInput("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [entryInput, onOpenTrade]);

  const fmtMoney = (n: number | null | undefined) => {
    if (n == null) return "—";
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
            <Text style={styles.strategyDate}>
              {new Date(strategy.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.strategyHeaderRight}>
          <Pressable
            onPress={() => {
              Alert.alert("Delete Strategy", "Are you sure?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: onDelete },
              ]);
            }}
            hitSlop={8}
          >
            <Feather name="trash-2" size={16} color={Colors.textMuted} />
          </Pressable>
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={Colors.textMuted}
          />
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.strategyBody}>
          <Text style={styles.subLabel}>Entry Price: ${strategy.spotPrice.toFixed(2)}</Text>

          {strategy.legs.map((leg) => (
            <View key={leg.id} style={{ marginBottom: 6 }}>
              <LegRow leg={leg} />
            </View>
          ))}

          {isLoading && (
            <ActivityIndicator color={Colors.accent} style={{ marginVertical: 20 }} />
          )}

          {analysis && (
            <>
              <View style={styles.chartWrapper}>
                <PnLChart
                  data={analysis.pnlAtExpiry}
                  spotPrice={strategy.spotPrice}
                  breakEvenPoints={analysis.breakEvenPoints}
                  height={180}
                />
              </View>
              <View style={styles.metricsRow}>
                <MetricCard
                  label="Max Profit"
                  value={analysis.maxProfit != null ? fmtMoney(analysis.maxProfit) : "Unlimited"}
                  color={Colors.accent}
                  small
                />
                <MetricCard
                  label="Max Loss"
                  value={analysis.maxLoss != null ? fmtMoney(analysis.maxLoss) : "Unlimited"}
                  color={Colors.red}
                  small
                />
              </View>
              <View style={styles.greeksSection}>
                <Text style={styles.subLabel}>Greeks</Text>
                <GreeksBar
                  delta={analysis.greeks.delta}
                  gamma={analysis.greeks.gamma}
                  theta={analysis.greeks.theta}
                  vega={analysis.greeks.vega}
                  rho={analysis.greeks.rho}
                />
              </View>
            </>
          )}

          <Pressable
            style={styles.openTradeBtn}
            onPress={() => setTradeModal(true)}
          >
            <Feather name="play-circle" size={16} color={Colors.blue} />
            <Text style={styles.openTradeBtnText}>Open Trade</Text>
          </Pressable>
        </View>
      )}

      <Modal visible={tradeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Open Trade</Text>
            <Text style={styles.modalSub}>Enter your net cost/credit (per contract)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 450 (debit) or -200 (credit)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={entryInput}
              onChangeText={setEntryInput}
            />
            <View style={styles.modalBtns}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setTradeModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmBtn}
                onPress={handleOpenTrade}
              >
                <Text style={styles.modalConfirmText}>Open Trade</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TradeCard({
  trade,
  onClose,
  onDelete,
}: {
  trade: OpenTrade;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [closeModal, setCloseModal] = useState(false);
  const [exitInput, setExitInput] = useState("");
  const { closeTrade } = useAppContext();

  const handleClose = useCallback(async () => {
    const exit = parseFloat(exitInput);
    if (isNaN(exit)) return;
    await closeTrade(trade.id, exit);
    setCloseModal(false);
    setExitInput("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [exitInput, trade.id, closeTrade]);

  const pnl = trade.realizedPnL;
  const isOpen = trade.status === "open";

  return (
    <View style={styles.tradeCard}>
      <View style={styles.tradeHeader}>
        <View style={styles.tradeHeaderLeft}>
          <View style={[styles.tradeBadge, { backgroundColor: isOpen ? Colors.accentDim : Colors.bgCardElevated }]}>
            <Text style={[styles.tradeBadgeText, { color: isOpen ? Colors.accent : Colors.textMuted }]}>
              {isOpen ? "OPEN" : "CLOSED"}
            </Text>
          </View>
          <View>
            <Text style={styles.tradeTitle}>{trade.strategyName}</Text>
            <Text style={styles.tradeTicker}>{trade.ticker}</Text>
          </View>
        </View>
        <Pressable onPress={onDelete} hitSlop={8}>
          <Feather name="trash-2" size={15} color={Colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.tradeDetails}>
        <View style={styles.tradeDetail}>
          <Text style={styles.tradeDetailLabel}>Entry</Text>
          <Text style={styles.tradeDetailValue}>
            {trade.entryNetCost >= 0 ? `$${trade.entryNetCost}` : `-$${Math.abs(trade.entryNetCost)}`}
          </Text>
        </View>
        {trade.exitValue != null && (
          <View style={styles.tradeDetail}>
            <Text style={styles.tradeDetailLabel}>Exit</Text>
            <Text style={styles.tradeDetailValue}>
              ${trade.exitValue}
            </Text>
          </View>
        )}
        {pnl != null && (
          <View style={styles.tradeDetail}>
            <Text style={styles.tradeDetailLabel}>P&L</Text>
            <Text style={[styles.tradeDetailValue, { color: pnl >= 0 ? Colors.accent : Colors.red }]}>
              {pnl >= 0 ? "+" : ""}{pnl >= 0 ? "$" : "-$"}{Math.abs(pnl).toFixed(0)}
            </Text>
          </View>
        )}
        <View style={styles.tradeDetail}>
          <Text style={styles.tradeDetailLabel}>Opened</Text>
          <Text style={styles.tradeDetailValue}>
            {new Date(trade.openedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {isOpen && (
        <Pressable style={styles.closeTradeBtn} onPress={() => setCloseModal(true)}>
          <Feather name="stop-circle" size={14} color={Colors.red} />
          <Text style={styles.closeTradeBtnText}>Close Trade</Text>
        </Pressable>
      )}

      <Modal visible={closeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Close Trade</Text>
            <Text style={styles.modalSub}>Enter exit value</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Exit value (e.g. 600)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={exitInput}
              onChangeText={setExitInput}
            />
            <View style={styles.modalBtns}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setCloseModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalConfirmBtn} onPress={handleClose}>
                <Text style={styles.modalConfirmText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<PortfolioTab>("strategies");
  const { savedStrategies, openTrades, deleteStrategy, openTrade, deleteTrade } = useAppContext();

  const closedTrades = openTrades.filter((t) => t.status === "closed");
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.realizedPnL ?? 0), 0);

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
          paddingBottom: Platform.OS === "web" ? 34 : 0,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Portfolio</Text>
        {closedTrades.length > 0 && (
          <View style={[styles.pnlBadge, { backgroundColor: totalPnL >= 0 ? Colors.accentDim : Colors.redDim }]}>
            <Text style={[styles.pnlBadgeText, { color: totalPnL >= 0 ? Colors.accent : Colors.red }]}>
              {totalPnL >= 0 ? "+" : ""}{totalPnL >= 0 ? "$" : "-$"}{Math.abs(totalPnL).toFixed(0)} realized
            </Text>
          </View>
        )}
      </View>

      <View style={styles.tabRow}>
        {(["strategies", "trades"] as PortfolioTab[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === "strategies"
                ? `Strategies (${savedStrategies.length})`
                : `Trades (${openTrades.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tab === "strategies" && (
          <>
            {savedStrategies.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="bookmark" size={44} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No saved strategies</Text>
                <Text style={styles.emptyDesc}>
                  Build a strategy in the Builder tab and save it here
                </Text>
              </View>
            ) : (
              savedStrategies.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  onDelete={() => deleteStrategy(strategy.id)}
                  onOpenTrade={(entryNetCost) =>
                    openTrade({
                      strategyId: strategy.id,
                      strategyName: strategy.name,
                      ticker: strategy.ticker,
                      openedAt: Date.now(),
                      entryNetCost,
                    })
                  }
                />
              ))
            )}
          </>
        )}

        {tab === "trades" && (
          <>
            {openTrades.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="activity" size={44} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No trades yet</Text>
                <Text style={styles.emptyDesc}>
                  Open a trade from your saved strategies
                </Text>
              </View>
            ) : (
              openTrades.map((trade) => (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  onClose={() => {}}
                  onDelete={() => deleteTrade(trade.id)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  pnlBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pnlBadgeText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.bgCard,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtnActive: {
    backgroundColor: Colors.bgCardElevated,
    borderColor: Colors.accent,
  },
  tabBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  tabBtnTextActive: {
    color: Colors.accent,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    maxWidth: 260,
  },
  strategyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  strategyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  strategyHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  strategyHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tickerBadge: {
    backgroundColor: Colors.accentDim,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.accent + "50",
  },
  tickerBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.accent,
  },
  strategyName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  strategyDate: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  strategyBody: {
    padding: 14,
    paddingTop: 0,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  subLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  chartWrapper: {
    backgroundColor: Colors.bgCardElevated,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
  },
  greeksSection: {
    gap: 8,
  },
  openTradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.blueDim,
    borderRadius: 10,
    paddingVertical: 12,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.blue + "50",
  },
  openTradeBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.blue,
  },
  tradeCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tradeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tradeHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tradeBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tradeBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  tradeTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  tradeTicker: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  tradeDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tradeDetail: {
    gap: 3,
  },
  tradeDetailLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tradeDetailValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  closeTradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.redDim,
    borderRadius: 8,
    paddingVertical: 10,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.red + "40",
  },
  closeTradeBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.red,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  modalSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  modalInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalBtns: {
    flexDirection: "row",
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.bgCardElevated,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.bg,
  },
});
