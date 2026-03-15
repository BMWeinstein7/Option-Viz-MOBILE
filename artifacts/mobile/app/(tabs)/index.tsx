import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Colors } from "@/constants/colors";
import { STRATEGY_TEMPLATES, OUTLOOK_COLORS, OUTLOOK_LABELS, POPULAR_TICKERS } from "@/constants/strategies";
import { api, StrategyAnalysis } from "@/hooks/useApi";
import { PnLChart } from "@/components/PnLChart";
import { MetricCard } from "@/components/MetricCard";
import { LegRow, Leg } from "@/components/LegRow";
import { GreeksBar } from "@/components/GreeksBar";
import { useAppContext } from "@/context/AppContext";

type BuilderStep = "ticker" | "template" | "legs" | "analysis";

export default function BuilderScreen() {
  const insets = useSafeAreaInsets();
  const { saveStrategy } = useAppContext();

  const [step, setStep] = useState<BuilderStep>("ticker");
  const [ticker, setTicker] = useState("");
  const [tickerInput, setTickerInput] = useState("");
  const [selectedExpiration, setSelectedExpiration] = useState("");
  const [legs, setLegs] = useState<Leg[]>([]);
  const [analysis, setAnalysis] = useState<StrategyAnalysis | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const {
    data: quote,
    isLoading: quoteLoading,
    error: quoteError,
  } = useQuery({
    queryKey: ["quote", ticker],
    queryFn: () => api.getQuote(ticker),
    enabled: !!ticker,
    refetchInterval: 5000,
    staleTime: 3000,
  });

  const {
    data: expirationsData,
    isLoading: expLoading,
  } = useQuery({
    queryKey: ["expirations", ticker],
    queryFn: () => api.getExpirations(ticker),
    enabled: !!ticker,
  });

  const {
    data: chain,
    isLoading: chainLoading,
  } = useQuery({
    queryKey: ["chain", ticker, selectedExpiration],
    queryFn: () => api.getChain(ticker, selectedExpiration),
    enabled: !!ticker && !!selectedExpiration,
  });

  const analyzeMutation = useMutation({
    mutationFn: () =>
      api.analyzeStrategy({
        ticker,
        spotPrice: quote?.price ?? 100,
        legs: legs.map((l) => ({
          action: l.action,
          type: l.type,
          strike: l.strike,
          premium: l.premium,
          quantity: l.quantity,
          expiration: l.expiration,
        })),
      }),
    onSuccess: (data) => {
      setAnalysis(data);
      setStep("analysis");
    },
  });

  const handleTickerSelect = useCallback((t: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTicker(t.toUpperCase());
    setStep("template");
  }, []);

  const handleTickerSearch = useCallback(() => {
    if (tickerInput.trim()) {
      handleTickerSelect(tickerInput.trim().toUpperCase());
    }
  }, [tickerInput]);

  const handleTemplateSelect = useCallback(
    (templateId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const template = STRATEGY_TEMPLATES.find((t) => t.id === templateId);
      if (!template || !quote) return;

      setSelectedTemplateId(templateId);

      const expiration = expirationsData?.expirations[1] || "";
      const step = quote.price < 10 ? 0.5 : quote.price < 50 ? 1 : quote.price < 200 ? 5 : quote.price < 500 ? 10 : 25;
      const atm = Math.round(quote.price / step) * step;

      const newLegs: Leg[] = template.legs.map((tl, i) => {
        const rawStrike = atm + tl.strikeOffset;
        const strike = Math.round(rawStrike / step) * step;

        let premium = quote.price * 0.03;
        if (chain) {
          const contracts = tl.type === "call" ? chain.calls : chain.puts;
          const closest = contracts.reduce(
            (best, c) =>
              Math.abs(c.strike - strike) < Math.abs(best.strike - strike) ? c : best,
            contracts[0]
          );
          if (closest) premium = (closest.bid + closest.ask) / 2;
        }

        return {
          id: `${i}-${Date.now()}`,
          action: tl.action,
          type: tl.type,
          strike,
          premium: Math.round(premium * 100) / 100,
          quantity: tl.quantity,
          expiration: expiration || "2026-06-19",
        };
      });

      setLegs(newLegs);
      setStep("legs");
    },
    [quote, expirationsData, chain]
  );

  const handleRemoveLeg = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLegs((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const handleAnalyze = useCallback(() => {
    if (legs.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    analyzeMutation.mutate();
  }, [legs, analyzeMutation]);

  const handleSave = useCallback(async () => {
    if (!analysis || !quote) return;
    await saveStrategy({
      name: selectedTemplateId
        ? STRATEGY_TEMPLATES.find((t) => t.id === selectedTemplateId)?.name ?? "Custom"
        : "Custom Strategy",
      ticker,
      spotPrice: quote.price,
      legs,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Saved!", "Strategy saved to your portfolio.");
  }, [analysis, quote, ticker, legs, selectedTemplateId, saveStrategy]);

  const handleReset = useCallback(() => {
    setStep("ticker");
    setTicker("");
    setTickerInput("");
    setLegs([]);
    setAnalysis(null);
    setSelectedTemplateId(null);
    setSelectedExpiration("");
  }, []);

  const fmtMoney = (n: number | null | undefined) => {
    if (n == null) return "Unlimited";
    const abs = Math.abs(n);
    if (abs >= 1000) return `${n >= 0 ? "+" : "-"}$${(abs / 1000).toFixed(1)}k`;
    return `${n >= 0 ? "+" : "-"}$${abs.toFixed(0)}`;
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Strategy Builder</Text>
          {ticker ? (
            <Text style={styles.headerSub}>{ticker} · ${quote?.price?.toFixed(2) ?? "..."}</Text>
          ) : null}
        </View>
        {step !== "ticker" ? (
          <Pressable onPress={handleReset} style={styles.resetBtn}>
            <Feather name="refresh-cw" size={16} color={Colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.stepRow}>
        {(["ticker", "template", "legs", "analysis"] as BuilderStep[]).map((s, i) => (
          <View
            key={s}
            style={[
              styles.stepDot,
              { backgroundColor: step === s ? Colors.accent : Colors.border },
            ]}
          />
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === "ticker" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Any Stock</Text>
            <Text style={styles.sectionHint}>Enter any US ticker symbol</Text>

            <View style={styles.searchRow}>
              <TextInput
                style={styles.input}
                placeholder="Enter ticker (e.g. AAPL, TSLA, ANY)"
                placeholderTextColor={Colors.textMuted}
                value={tickerInput}
                onChangeText={(t) => setTickerInput(t.toUpperCase())}
                autoCapitalize="characters"
                onSubmitEditing={handleTickerSearch}
                returnKeyType="search"
              />
              <Pressable style={styles.searchBtn} onPress={handleTickerSearch}>
                <Feather name="search" size={18} color={Colors.bg} />
              </Pressable>
            </View>

            <Text style={styles.sectionLabel}>Popular</Text>
            <View style={styles.tickerGrid}>
              {POPULAR_TICKERS.slice(0, 30).map((t) => (
                <Pressable
                  key={t}
                  style={({ pressed }) => [
                    styles.tickerChip,
                    pressed && styles.tickerChipPressed,
                  ]}
                  onPress={() => handleTickerSelect(t)}
                >
                  <Text style={styles.tickerChipText}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === "template" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Strategy</Text>
            {quoteLoading || expLoading ? (
              <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
            ) : (
              <>
                {quote && (
                  <View style={styles.quoteCard}>
                    <View>
                      <Text style={styles.quoteName}>{quote.name}</Text>
                      <Text style={styles.quotePrice}>${quote.price.toFixed(2)}</Text>
                    </View>
                    <View style={styles.quoteMeta}>
                      <Text
                        style={[
                          styles.quoteChange,
                          { color: quote.change >= 0 ? Colors.accent : Colors.red },
                        ]}
                      >
                        {quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%)
                      </Text>
                    </View>
                  </View>
                )}

                {["Basic", "Spreads", "Income", "Volatility", "Neutral", "Hedging"].map((cat) => {
                  const catTemplates = STRATEGY_TEMPLATES.filter((t) => t.category === cat);
                  if (catTemplates.length === 0) return null;
                  return (
                    <View key={cat}>
                      <Text style={styles.categoryLabel}>{cat}</Text>
                      {catTemplates.map((template) => (
                        <Pressable
                          key={template.id}
                          style={({ pressed }) => [
                            styles.templateCard,
                            pressed && styles.templateCardPressed,
                          ]}
                          onPress={() => handleTemplateSelect(template.id)}
                        >
                          <View style={styles.templateHeader}>
                            <Text style={styles.templateName}>{template.name}</Text>
                            <View
                              style={[
                                styles.outlookBadge,
                                { backgroundColor: OUTLOOK_COLORS[template.outlook] + "25" },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.outlookText,
                                  { color: OUTLOOK_COLORS[template.outlook] },
                                ]}
                              >
                                {OUTLOOK_LABELS[template.outlook]}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.templateDesc}>{template.description}</Text>
                          <Text style={styles.templateLegs}>
                            {template.legs.length} leg{template.legs.length > 1 ? "s" : ""}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  );
                })}
              </>
            )}
          </View>
        )}

        {step === "legs" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review Legs</Text>

            {legs.map((leg) => (
              <View key={leg.id} style={{ marginBottom: 8 }}>
                <LegRow leg={leg} onRemove={() => handleRemoveLeg(leg.id)} />
              </View>
            ))}

            {legs.length === 0 && (
              <View style={styles.emptyState}>
                <Feather name="layers" size={36} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No legs added</Text>
              </View>
            )}

            {expirationsData && (
              <>
                <Text style={styles.sectionLabel}>Expiration</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.expRow}>
                    {expirationsData.expirations.slice(0, 8).map((exp) => (
                      <Pressable
                        key={exp}
                        style={[
                          styles.expChip,
                          selectedExpiration === exp && styles.expChipSelected,
                        ]}
                        onPress={() => {
                          setSelectedExpiration(exp);
                          setLegs((prev) =>
                            prev.map((l) => ({ ...l, expiration: exp }))
                          );
                        }}
                      >
                        <Text
                          style={[
                            styles.expChipText,
                            selectedExpiration === exp && styles.expChipTextSelected,
                          ]}
                        >
                          {exp}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            <Pressable
              style={[styles.analyzeBtn, legs.length === 0 && styles.analyzeBtnDisabled]}
              onPress={handleAnalyze}
              disabled={legs.length === 0 || analyzeMutation.isPending}
            >
              {analyzeMutation.isPending ? (
                <ActivityIndicator color={Colors.bg} />
              ) : (
                <>
                  <Feather name="bar-chart-2" size={16} color={Colors.bg} />
                  <Text style={styles.analyzeBtnText}>Analyze Strategy</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {step === "analysis" && analysis && quote && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>P&L Analysis</Text>

            <View style={styles.chartCard}>
              <PnLChart
                data={analysis.pnlAtExpiry}
                spotPrice={quote.price}
                breakEvenPoints={analysis.breakEvenPoints}
                height={240}
                timeDecayCurves={analysis.timeDecayCurves}
              />
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#e8edf5" }]} />
                  <Text style={styles.legendText}>At Expiry</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.blue }]} />
                  <Text style={styles.legendText}>Current ${quote.price.toFixed(2)}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.gold }]} />
                  <Text style={styles.legendText}>Break-even</Text>
                </View>
              </View>
              {analysis.timeDecayCurves && analysis.timeDecayCurves.length > 0 && (
                <View style={styles.chartLegend}>
                  {analysis.timeDecayCurves.map((curve, i) => (
                    <View key={i} style={styles.legendItem}>
                      <View style={[styles.legendDash, {
                        backgroundColor: i === 0 ? "rgba(59,130,246,0.6)" : i === 1 ? "rgba(139,92,246,0.6)" : "rgba(245,158,11,0.6)"
                      }]} />
                      <Text style={styles.legendText}>{curve.label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.metricsRow}>
              <MetricCard
                label="Max Profit"
                value={analysis.maxProfit != null ? fmtMoney(analysis.maxProfit) : "Unlimited"}
                color={Colors.accent}
              />
              <MetricCard
                label="Max Loss"
                value={analysis.maxLoss != null ? fmtMoney(analysis.maxLoss) : "Unlimited"}
                color={Colors.red}
              />
            </View>

            <View style={styles.metricsRow}>
              <MetricCard
                label="Net Cost"
                value={analysis.netCost >= 0 ? `$${analysis.netCost.toFixed(0)}` : `-$${Math.abs(analysis.netCost).toFixed(0)}`}
                color={analysis.netCost >= 0 ? Colors.red : Colors.accent}
              />
              <MetricCard
                label="Risk/Reward"
                value={analysis.riskRewardRatio != null ? `${analysis.riskRewardRatio.toFixed(2)}x` : "N/A"}
                color={Colors.blue}
              />
            </View>

            {analysis.breakEvenPoints.length > 0 && (
              <View style={styles.breakEvenCard}>
                <Text style={styles.breakEvenLabel}>Break-even Points</Text>
                <View style={styles.breakEvenRow}>
                  {analysis.breakEvenPoints.map((be, i) => (
                    <Text key={i} style={styles.breakEvenValue}>
                      ${be.toFixed(2)}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.greeksCard}>
              <Text style={styles.greeksTitle}>Greeks</Text>
              <GreeksBar
                delta={analysis.greeks.delta}
                gamma={analysis.greeks.gamma}
                theta={analysis.greeks.theta}
                vega={analysis.greeks.vega}
                rho={analysis.greeks.rho}
              />
            </View>

            <View style={styles.actionRow}>
              <Pressable style={styles.saveBtn} onPress={handleSave}>
                <Feather name="bookmark" size={16} color={Colors.accent} />
                <Text style={styles.saveBtnText}>Save Strategy</Text>
              </Pressable>
              <Pressable style={styles.newBtn} onPress={handleReset}>
                <Feather name="plus" size={16} color={Colors.textSecondary} />
                <Text style={styles.newBtnText}>New Strategy</Text>
              </Pressable>
            </View>
          </View>
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
  headerSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  resetBtn: {
    padding: 8,
    backgroundColor: Colors.bgCardElevated,
    borderRadius: 8,
  },
  stepRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  stepDot: {
    width: 32,
    height: 3,
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: -8,
  },
  sectionLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 8,
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  tickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tickerChip: {
    backgroundColor: Colors.bgCardElevated,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tickerChipPressed: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent,
  },
  tickerChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  quoteCard: {
    backgroundColor: Colors.bgCardElevated,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quoteName: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  quotePrice: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  quoteMeta: {
    alignItems: "flex-end",
  },
  quoteChange: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  categoryLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  templateCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  templateCardPressed: {
    backgroundColor: Colors.bgCardElevated,
    borderColor: Colors.borderLight,
  },
  templateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  templateName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  outlookBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  outlookText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  templateDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginBottom: 6,
  },
  templateLegs: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
  },
  expRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  expChip: {
    backgroundColor: Colors.bgCardElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expChipSelected: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent,
  },
  expChipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  expChipTextSelected: {
    color: Colors.accent,
  },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  analyzeBtnDisabled: {
    opacity: 0.5,
  },
  analyzeBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.bg,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
  },
  chartCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  chartLegend: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDash: {
    width: 12,
    height: 3,
    borderRadius: 1.5,
  },
  legendText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  breakEvenCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  breakEvenLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  breakEvenRow: {
    flexDirection: "row",
    gap: 12,
  },
  breakEvenValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.gold,
  },
  greeksCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  greeksTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accentDim,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.accent + "50",
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.accent,
  },
  newBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.bgCardElevated,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  newBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
});
