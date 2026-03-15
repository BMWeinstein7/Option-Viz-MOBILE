import React, { useMemo, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Colors } from "@/constants/colors";
import { useAppContext, OpenTrade } from "@/context/AppContext";
import { Analytics, AnalyticsEvents } from "@/lib/analytics";

interface TradeWithPercent extends OpenTrade {
  pctReturn: number;
}

function usePerformanceData(trades: OpenTrade[]) {
  return useMemo(() => {
    const closedTrades = trades.filter((t) => t.status === "closed");
    const openCount = trades.filter((t) => t.status === "open").length;

    const totalRealizedPnL = closedTrades.reduce(
      (s, t) => s + (t.realizedPnL ?? 0),
      0
    );

    const winners = closedTrades.filter((t) => (t.realizedPnL ?? 0) > 0);
    const losers = closedTrades.filter((t) => (t.realizedPnL ?? 0) < 0);
    const winRate =
      closedTrades.length > 0
        ? (winners.length / closedTrades.length) * 100
        : 0;
    const avgGain =
      winners.length > 0
        ? winners.reduce((s, t) => s + (t.realizedPnL ?? 0), 0) /
          winners.length
        : 0;
    const avgLoss =
      losers.length > 0
        ? losers.reduce((s, t) => s + (t.realizedPnL ?? 0), 0) / losers.length
        : 0;

    const withPct: TradeWithPercent[] = closedTrades.map((t) => ({
      ...t,
      pctReturn:
        t.entryNetCost !== 0
          ? ((t.realizedPnL ?? 0) / Math.abs(t.entryNetCost)) * 100
          : 0,
    }));

    const winnersWithPct = withPct.filter((t) => (t.realizedPnL ?? 0) > 0);
    const losersWithPct = withPct.filter((t) => (t.realizedPnL ?? 0) < 0);

    const topByDollarGain = [...winnersWithPct]
      .sort((a, b) => (b.realizedPnL ?? 0) - (a.realizedPnL ?? 0))
      .slice(0, 5);
    const topByDollarLoss = [...losersWithPct]
      .sort((a, b) => (a.realizedPnL ?? 0) - (b.realizedPnL ?? 0))
      .slice(0, 5);
    const topByPctGain = [...winnersWithPct]
      .sort((a, b) => b.pctReturn - a.pctReturn)
      .slice(0, 5);
    const topByPctLoss = [...losersWithPct]
      .sort((a, b) => a.pctReturn - b.pctReturn)
      .slice(0, 5);

    return {
      closedCount: closedTrades.length,
      openCount,
      totalRealizedPnL,
      winRate,
      avgGain,
      avgLoss,
      topByDollarGain,
      topByDollarLoss,
      topByPctGain,
      topByPctLoss,
    };
  }, [trades]);
}

function fmtDollar(n: number) {
  const abs = Math.abs(n);
  const prefix = n >= 0 ? "+$" : "-$";
  return `${prefix}${abs.toFixed(0)}`;
}

function fmtPct(n: number) {
  const prefix = n >= 0 ? "+" : "";
  return `${prefix}${n.toFixed(1)}%`;
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

function RankedTradeCard({
  rank,
  trade,
}: {
  rank: number;
  trade: TradeWithPercent;
}) {
  const pnl = trade.realizedPnL ?? 0;
  const pnlColor = pnl >= 0 ? Colors.accent : Colors.red;

  return (
    <View style={styles.rankedCard}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>
      <View style={styles.rankedInfo}>
        <Text style={styles.rankedTicker}>{trade.ticker}</Text>
        <Text style={styles.rankedStrategy} numberOfLines={1}>
          {trade.strategyName}
        </Text>
      </View>
      <View style={styles.rankedPnl}>
        <Text style={[styles.rankedDollar, { color: pnlColor }]}>
          {fmtDollar(pnl)}
        </Text>
        <Text style={[styles.rankedPct, { color: pnlColor }]}>
          {fmtPct(trade.pctReturn)}
        </Text>
      </View>
    </View>
  );
}

function TopTradesSection({
  title,
  trades,
  icon,
  accentColor,
}: {
  title: string;
  trades: TradeWithPercent[];
  icon: React.ComponentProps<typeof Feather>["name"];
  accentColor: string;
}) {
  if (trades.length === 0) return null;
  return (
    <View style={styles.topSection}>
      <View style={styles.topSectionHeader}>
        <Feather name={icon} size={14} color={accentColor} />
        <Text style={[styles.topSectionTitle, { color: accentColor }]}>
          {title}
        </Text>
      </View>
      {trades.map((t, i) => (
        <RankedTradeCard key={t.id + title} rank={i + 1} trade={t} />
      ))}
    </View>
  );
}

function buildPdfHtml(data: ReturnType<typeof usePerformanceData>) {
  const tradeRowsHtml = (trades: TradeWithPercent[]) =>
    trades
      .map(
        (t, i) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #2a2a3a;color:#8B8B9E;">${i + 1}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #2a2a3a;font-weight:600;color:#EAEAF0;">${t.ticker}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #2a2a3a;color:#8B8B9E;">${t.strategyName}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #2a2a3a;font-weight:700;color:${(t.realizedPnL ?? 0) >= 0 ? "#0ABAB5" : "#F43F5E"};">${fmtDollar(t.realizedPnL ?? 0)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #2a2a3a;color:${t.pctReturn >= 0 ? "#0ABAB5" : "#F43F5E"};">${fmtPct(t.pctReturn)}</td>
      </tr>`
      )
      .join("");

  const tableBlock = (title: string, trades: TradeWithPercent[]) => {
    if (trades.length === 0) return "";
    return `
      <h3 style="color:#EAEAF0;font-size:14px;margin:20px 0 8px;">${title}</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="border-bottom:2px solid #2a2a3a;">
            <th style="padding:6px 8px;text-align:left;color:#4A4A5E;">#</th>
            <th style="padding:6px 8px;text-align:left;color:#4A4A5E;">Ticker</th>
            <th style="padding:6px 8px;text-align:left;color:#4A4A5E;">Strategy</th>
            <th style="padding:6px 8px;text-align:left;color:#4A4A5E;">P&amp;L</th>
            <th style="padding:6px 8px;text-align:left;color:#4A4A5E;">Return</th>
          </tr>
        </thead>
        <tbody>${tradeRowsHtml(trades)}</tbody>
      </table>`;
  };

  return `
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0D0D12; color: #EAEAF0; padding: 32px; margin: 0; }
        .header { text-align: center; margin-bottom: 24px; }
        .header h1 { font-size: 22px; margin: 0 0 4px; color: #EAEAF0; }
        .header p { font-size: 12px; color: #8B8B9E; margin: 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
        .stat-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px; text-align: center; }
        .stat-label { font-size: 9px; color: #4A4A5E; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .stat-value { font-size: 18px; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Trade Performance Report</h1>
        <p>Generated ${new Date().toLocaleDateString()}</p>
      </div>
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-label">Total P&amp;L</div>
          <div class="stat-value" style="color:${data.totalRealizedPnL >= 0 ? "#0ABAB5" : "#F43F5E"}">${fmtDollar(data.totalRealizedPnL)}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Closed Trades</div>
          <div class="stat-value" style="color:#EAEAF0">${data.closedCount}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Open Trades</div>
          <div class="stat-value" style="color:#EAEAF0">${data.openCount}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Win Rate</div>
          <div class="stat-value" style="color:${data.winRate >= 50 ? "#0ABAB5" : "#F43F5E"}">${data.winRate.toFixed(0)}%</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Avg Gain</div>
          <div class="stat-value" style="color:#0ABAB5">${data.avgGain > 0 ? fmtDollar(data.avgGain) : "—"}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Avg Loss</div>
          <div class="stat-value" style="color:#F43F5E">${data.avgLoss < 0 ? fmtDollar(data.avgLoss) : "—"}</div>
        </div>
      </div>
      ${tableBlock("Top Winners (by $)", data.topByDollarGain)}
      ${tableBlock("Top Losers (by $)", data.topByDollarLoss)}
      ${tableBlock("Top Winners (by %)", data.topByPctGain)}
      ${tableBlock("Top Losers (by %)", data.topByPctLoss)}
    </body>
    </html>`;
}

export default function PerformanceScreen() {
  const insets = useSafeAreaInsets();
  const { openTrades } = useAppContext();
  const [exporting, setExporting] = useState(false);
  const data = usePerformanceData(openTrades);

  const handleExportPdf = useCallback(async () => {
    setExporting(true);
    try {
      const html = buildPdfHtml(data);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share Performance Report",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("PDF Saved", `Report saved to: ${uri}`);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not generate PDF";
      Alert.alert("Export Failed", message);
    } finally {
      setExporting(false);
    }
  }, [data]);

  const hasClosedTrades = data.closedCount > 0;

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
        <Text style={styles.headerTitle}>Performance</Text>
        <Pressable
          style={[styles.exportBtn, !hasClosedTrades && styles.exportBtnDisabled]}
          onPress={handleExportPdf}
          disabled={!hasClosedTrades || exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={Colors.accent} />
          ) : (
            <>
              <Feather name="download" size={14} color={hasClosedTrades ? Colors.accent : Colors.textMuted} />
              <Text style={[styles.exportBtnText, !hasClosedTrades && { color: Colors.textMuted }]}>
                Export PDF
              </Text>
            </>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!hasClosedTrades ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="bar-chart-2" size={40} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No closed trades yet</Text>
            <Text style={styles.emptyDesc}>
              Close some trades in your Portfolio to see performance metrics here
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.mainPnlCard}>
              <Text style={styles.mainPnlLabel}>TOTAL REALIZED P&L</Text>
              <Text
                style={[
                  styles.mainPnlValue,
                  {
                    color:
                      data.totalRealizedPnL >= 0 ? Colors.accent : Colors.red,
                  },
                ]}
              >
                {fmtDollar(data.totalRealizedPnL)}
              </Text>
              <Text style={styles.mainPnlSub}>
                {data.closedCount} closed · {data.openCount} open
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                label="WIN RATE"
                value={`${data.winRate.toFixed(0)}%`}
                color={data.winRate >= 50 ? Colors.accent : Colors.red}
              />
              <StatCard
                label="TRADES"
                value={String(data.closedCount)}
                color={Colors.textPrimary}
              />
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                label="AVG GAIN"
                value={data.avgGain > 0 ? fmtDollar(data.avgGain) : "—"}
                color={Colors.accent}
              />
              <StatCard
                label="AVG LOSS"
                value={data.avgLoss < 0 ? fmtDollar(data.avgLoss) : "—"}
                color={Colors.red}
              />
            </View>

            <TopTradesSection
              title="Top Winners (by $)"
              trades={data.topByDollarGain}
              icon="trending-up"
              accentColor={Colors.accent}
            />
            <TopTradesSection
              title="Top Losers (by $)"
              trades={data.topByDollarLoss}
              icon="trending-down"
              accentColor={Colors.red}
            />
            <TopTradesSection
              title="Top Winners (by %)"
              trades={data.topByPctGain}
              icon="percent"
              accentColor={Colors.accent}
            />
            <TopTradesSection
              title="Top Losers (by %)"
              trades={data.topByPctLoss}
              icon="percent"
              accentColor={Colors.red}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
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
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.accentDim,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent + "30",
  },
  exportBtnDisabled: {
    backgroundColor: Colors.glass,
    borderColor: Colors.glassBorder,
  },
  exportBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.accent,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120, gap: 12 },
  mainPnlCard: {
    backgroundColor: Colors.glassElevated,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  mainPnlLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  mainPnlValue: { fontSize: 36, fontFamily: "Inter_700Bold" },
  mainPnlSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  statsGrid: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.glassElevated,
    borderRadius: 14,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptyState: { alignItems: "center", paddingVertical: 80, gap: 14 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.glassElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginBottom: 8,
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
  topSection: {
    backgroundColor: Colors.glassElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: "hidden",
  },
  topSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  topSectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  rankedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.glass,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  rankText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
  },
  rankedInfo: { flex: 1, gap: 2 },
  rankedTicker: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  rankedStrategy: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  rankedPnl: { alignItems: "flex-end", gap: 2 },
  rankedDollar: { fontSize: 14, fontFamily: "Inter_700Bold" },
  rankedPct: { fontSize: 11, fontFamily: "Inter_500Medium" },
});
