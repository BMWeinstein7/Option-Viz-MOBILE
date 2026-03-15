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
import * as FileSystem from "expo-file-system/legacy";
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

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPdfHtml(
  data: ReturnType<typeof usePerformanceData>,
  allTrades: OpenTrade[]
) {
  const tradeRowsHtml = (trades: TradeWithPercent[]) =>
    trades
      .map(
        (t, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="bold">${escHtml(t.ticker)}</td>
        <td>${escHtml(t.strategyName)}</td>
        <td class="bold ${(t.realizedPnL ?? 0) >= 0 ? "green" : "red"}">${fmtDollar(t.realizedPnL ?? 0)}</td>
        <td class="${t.pctReturn >= 0 ? "green" : "red"}">${fmtPct(t.pctReturn)}</td>
      </tr>`
      )
      .join("");

  const tableBlock = (title: string, trades: TradeWithPercent[]) => {
    if (trades.length === 0) return "";
    return `
      <h3>${title}</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Ticker</th>
            <th>Strategy</th>
            <th>P&amp;L</th>
            <th>Return</th>
          </tr>
        </thead>
        <tbody>${tradeRowsHtml(trades)}</tbody>
      </table>`;
  };

  const openTrades = allTrades.filter((t) => t.status === "open");
  const openTradesHtml =
    openTrades.length > 0
      ? `
      <h3>Open Positions (${openTrades.length})</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Ticker</th>
            <th>Strategy</th>
            <th>Entry Cost</th>
            <th>Opened</th>
          </tr>
        </thead>
        <tbody>
          ${openTrades
            .map(
              (t, i) => `
            <tr>
              <td>${i + 1}</td>
              <td class="bold">${escHtml(t.ticker)}</td>
              <td>${escHtml(t.strategyName)}</td>
              <td>$${Math.abs(t.entryNetCost).toFixed(0)}</td>
              <td>${new Date(t.openedAt).toLocaleDateString()}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`
      : "";

  const closedTrades = allTrades.filter((t) => t.status === "closed");
  const allClosedHtml =
    closedTrades.length > 0
      ? `
      <h3>All Closed Trades (${closedTrades.length})</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Ticker</th>
            <th>Strategy</th>
            <th>Entry</th>
            <th>Exit</th>
            <th>P&amp;L</th>
            <th>Closed</th>
          </tr>
        </thead>
        <tbody>
          ${closedTrades
            .map(
              (t, i) => `
            <tr>
              <td>${i + 1}</td>
              <td class="bold">${escHtml(t.ticker)}</td>
              <td>${escHtml(t.strategyName)}</td>
              <td>$${Math.abs(t.entryNetCost).toFixed(0)}</td>
              <td>$${(t.exitValue ?? 0).toFixed(0)}</td>
              <td class="bold ${(t.realizedPnL ?? 0) >= 0 ? "green" : "red"}">${fmtDollar(t.realizedPnL ?? 0)}</td>
              <td>${t.closedAt ? new Date(t.closedAt).toLocaleDateString() : "—"}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Roboto, sans-serif;
      background: #ffffff;
      color: #1a1a2e;
      padding: 28px 32px;
      margin: 0;
      font-size: 12px;
      line-height: 1.4;
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #0ABAB5;
    }
    .header h1 {
      font-size: 24px;
      margin: 0 0 2px;
      color: #1a1a2e;
      font-weight: 700;
      letter-spacing: -0.3px;
    }
    .header .subtitle {
      font-size: 11px;
      color: #666;
      margin: 0;
    }
    .header .brand {
      font-size: 13px;
      color: #0ABAB5;
      font-weight: 600;
      margin: 0 0 2px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 20px;
    }
    .stat-box {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 12px 10px;
      text-align: center;
    }
    .stat-label {
      font-size: 8px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .stat-value {
      font-size: 18px;
      font-weight: 700;
    }
    h3 {
      font-size: 13px;
      margin: 22px 0 8px;
      color: #1a1a2e;
      font-weight: 700;
      border-bottom: 1px solid #e9ecef;
      padding-bottom: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 8px;
    }
    thead tr {
      border-bottom: 2px solid #dee2e6;
    }
    th {
      padding: 6px 8px;
      text-align: left;
      color: #666;
      font-weight: 600;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #f0f0f0;
      color: #333;
    }
    .bold { font-weight: 700; }
    .green { color: #0a8f8b; }
    .red { color: #d63384; }
    .footer {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px solid #e9ecef;
      text-align: center;
      font-size: 9px;
      color: #aaa;
    }
  </style>
</head>
<body>
  <div class="header">
    <p class="brand">OptionViz</p>
    <h1>Trade Performance Report</h1>
    <p class="subtitle">Generated ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
  </div>
  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-label">Total Realized P&amp;L</div>
      <div class="stat-value ${data.totalRealizedPnL >= 0 ? "green" : "red"}">${fmtDollar(data.totalRealizedPnL)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Closed Trades</div>
      <div class="stat-value">${data.closedCount}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Open Trades</div>
      <div class="stat-value">${data.openCount}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Win Rate</div>
      <div class="stat-value ${data.winRate >= 50 ? "green" : "red"}">${data.winRate.toFixed(1)}%</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Avg Gain</div>
      <div class="stat-value green">${data.avgGain > 0 ? fmtDollar(data.avgGain) : "—"}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Avg Loss</div>
      <div class="stat-value red">${data.avgLoss < 0 ? fmtDollar(data.avgLoss) : "—"}</div>
    </div>
  </div>
  ${tableBlock("Top Winners (by $)", data.topByDollarGain)}
  ${tableBlock("Top Losers (by $)", data.topByDollarLoss)}
  ${tableBlock("Top Winners (by %)", data.topByPctGain)}
  ${tableBlock("Top Losers (by %)", data.topByPctLoss)}
  ${openTradesHtml}
  ${allClosedHtml}
  <div class="footer">
    OptionViz &mdash; Options Strategy Builder &amp; Visualizer &mdash; This report is for informational purposes only.
  </div>
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
      const html = buildPdfHtml(data, openTrades);
      const { uri } = await Print.printToFileAsync({
        html,
        width: 612,
        height: 792,
      });

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toISOString().slice(11, 19).replace(/:/g, "");
      const fileName = `OptionViz_Performance_Report_${dateStr}_${timeStr}.pdf`;

      let shareUri = uri;
      let copySucceeded = false;
      try {
        const destUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.copyAsync({ from: uri, to: destUri });
        shareUri = destUri;
        copySucceeded = true;
      } catch {
        shareUri = uri;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareUri, {
          mimeType: "application/pdf",
          dialogTitle: "Save Performance Report",
          UTI: "com.adobe.pdf",
        });
      } else if (copySucceeded) {
        Alert.alert(
          "PDF Generated",
          `Your report "${fileName}" has been saved.`,
        );
      } else {
        Alert.alert("PDF Generated", "Report saved to a temporary location.");
      }

      try {
        if (copySucceeded) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }
      } catch {}
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not generate PDF";
      Alert.alert("Export Failed", message);
    } finally {
      setExporting(false);
    }
  }, [data, openTrades]);

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
