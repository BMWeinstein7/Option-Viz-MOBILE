import React, { useState, useCallback, useEffect, useMemo } from "react";
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
import { api, StrategyAnalysis, OptionContract } from "@/hooks/useApi";
import { PnLChart } from "@/components/PnLChart";
import { MetricCard } from "@/components/MetricCard";
import { LegRow, Leg } from "@/components/LegRow";
import { GreeksBar } from "@/components/GreeksBar";
import { ProfileButton } from "@/components/ProfileMenu";
import { useAppContext, TradeLeg } from "@/context/AppContext";
import { Analytics, AnalyticsEvents } from "@/lib/analytics";
import { fmtMoney } from "@/lib/format";

type BuilderStep = "ticker" | "template" | "legs" | "analysis";

function findClosestContract(contracts: OptionContract[], strike: number): OptionContract | null {
  if (!contracts || contracts.length === 0) return null;
  return contracts.reduce((best, c) =>
    Math.abs(c.strike - strike) < Math.abs(best.strike - strike) ? c : best,
    contracts[0]
  );
}

export default function BuilderScreen() {
  const insets = useSafeAreaInsets();
  const { saveStrategy, openTrade, savedStrategies } = useAppContext();

  const [step, setStep] = useState<BuilderStep>("ticker");
  const [ticker, setTicker] = useState("");
  const [tickerInput, setTickerInput] = useState("");
  const [selectedExpiration, setSelectedExpiration] = useState("");
  const [legs, setLegs] = useState<Leg[]>([]);
  const [analysis, setAnalysis] = useState<StrategyAnalysis | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showAddLeg, setShowAddLeg] = useState(false);
  const [newLeg, setNewLeg] = useState({ action: "buy" as "buy"|"sell", type: "call" as "call"|"put", strike: "", premium: "", quantity: "1" });

  const {
    data: quote,
    isLoading: quoteLoading,
  } = useQuery({
    queryKey: ["quote", ticker],
    queryFn: () => api.getQuote(ticker),
    enabled: !!ticker,
    refetchInterval: 3000,
    staleTime: 2000,
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
  } = useQuery({
    queryKey: ["chain", ticker, selectedExpiration],
    queryFn: () => api.getChain(ticker, selectedExpiration),
    enabled: !!ticker && !!selectedExpiration,
    refetchInterval: 5000,
    staleTime: 3000,
  });

  useEffect(() => {
    if (!chain || legs.length === 0) return;
    setLegs((prev) =>
      prev.map((leg) => {
        const contracts = leg.type === "call" ? chain.calls : chain.puts;
        const match = findClosestContract(contracts, leg.strike);
        if (!match) return leg;
        const mid = Math.round(((match.bid + match.ask) / 2) * 100) / 100;
        return {
          ...leg,
          liveBid: match.bid,
          liveAsk: match.ask,
          liveMid: mid,
          premium: mid,
        };
      })
    );
  }, [chain]);

  const analyzeMutation = useMutation({
    mutationFn: () =>
      api.analyzeStrategy({
        ticker,
        spotPrice: quote?.price ?? 100,
        legs: legs.map((l) => ({
          action: l.action,
          type: l.type,
          strike: l.strike,
          premium: l.liveMid ?? l.premium,
          quantity: l.quantity,
          expiration: l.expiration,
        })),
      }),
    onSuccess: (data) => {
      setAnalysis(data);
      setStep("analysis");
    },
  });

  const netDebitCredit = useMemo(() => {
    return legs.reduce((sum, leg) => {
      const mid = leg.liveMid ?? leg.premium;
      const cost = mid * leg.quantity * 100;
      return sum + (leg.action === "buy" ? -cost : cost);
    }, 0);
  }, [legs]);

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
      if (expiration) setSelectedExpiration(expiration);
      const s = quote.price < 10 ? 0.5 : quote.price < 50 ? 1 : quote.price < 200 ? 5 : quote.price < 500 ? 10 : 25;
      const atm = Math.round(quote.price / s) * s;

      const newLegs: Leg[] = template.legs.map((tl, i) => {
        const rawStrike = atm + tl.strikeOffset;
        const strike = Math.round(rawStrike / s) * s;
        let bid = 0, ask = 0, mid = quote.price * 0.03;
        if (chain) {
          const contracts = tl.type === "call" ? chain.calls : chain.puts;
          const closest = findClosestContract(contracts, strike);
          if (closest) {
            bid = closest.bid;
            ask = closest.ask;
            mid = (closest.bid + closest.ask) / 2;
          }
        }
        return {
          id: `${i}-${Date.now()}`,
          action: tl.action,
          type: tl.type,
          strike,
          premium: Math.round(mid * 100) / 100,
          quantity: tl.quantity,
          expiration: expiration || "2026-06-19",
          liveBid: bid || undefined,
          liveAsk: ask || undefined,
          liveMid: Math.round(mid * 100) / 100,
        };
      });

      setLegs(newLegs);
      setStep("legs");
    },
    [quote, expirationsData, chain]
  );

  const handleCustomStrategy = useCallback(() => {
    if (!quote) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTemplateId(null);
    const expiration = expirationsData?.expirations[1] || "2026-06-19";
    if (expiration) setSelectedExpiration(expiration);
    setLegs([]);
    setStep("legs");
    setShowAddLeg(true);
  }, [quote, expirationsData]);

  const handleAddCustomLeg = useCallback(() => {
    const strike = parseFloat(newLeg.strike);
    const quantity = parseInt(newLeg.quantity) || 1;
    if (isNaN(strike)) {
      Alert.alert("Invalid", "Enter a valid strike price");
      return;
    }

    const expiration = selectedExpiration || expirationsData?.expirations[1] || "2026-06-19";
    let bid = 0, ask = 0, mid = 0;
    if (chain) {
      const contracts = newLeg.type === "call" ? chain.calls : chain.puts;
      const match = findClosestContract(contracts, strike);
      if (match) {
        bid = match.bid;
        ask = match.ask;
        mid = (match.bid + match.ask) / 2;
      }
    }
    if (mid === 0) {
      const premVal = parseFloat(newLeg.premium);
      if (isNaN(premVal) || premVal <= 0) {
        Alert.alert("No chain data", "Enter a premium manually");
        return;
      }
      mid = premVal;
    }

    const leg: Leg = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      action: newLeg.action,
      type: newLeg.type,
      strike,
      premium: Math.round(mid * 100) / 100,
      quantity,
      expiration,
      liveBid: bid || undefined,
      liveAsk: ask || undefined,
      liveMid: Math.round(mid * 100) / 100,
    };
    setLegs((prev) => [...prev, leg]);
    setNewLeg({ action: "buy", type: "call", strike: "", premium: "", quantity: "1" });
    setShowAddLeg(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [newLeg, selectedExpiration, expirationsData, chain]);

  const handleQuantityChange = useCallback((legId: string, qty: number) => {
    setLegs((prev) => prev.map((l) => l.id === legId ? { ...l, quantity: qty } : l));
  }, []);

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

    const strategyName = selectedTemplateId
      ? STRATEGY_TEMPLATES.find((t) => t.id === selectedTemplateId)?.name ?? "Custom"
      : "Custom Strategy";

    const legSignature = legs
      .map((l) => `${l.action}-${l.type}-${l.strike}-${l.expiration}`)
      .sort()
      .join("|");

    const duplicateCount = savedStrategies.filter((s) => {
      if (s.ticker !== ticker || s.name !== strategyName) return false;
      const existingSig = s.legs
        .map((l) => `${l.action}-${l.type}-${l.strike}-${l.expiration}`)
        .sort()
        .join("|");
      return existingSig === legSignature;
    }).length;

    const doSave = async () => {
      await saveStrategy({
        name: strategyName,
        ticker,
        spotPrice: quote!.price,
        legs,
      });
      Analytics.track(AnalyticsEvents.BUILDER_STRATEGY_SAVED, {
        strategy_name: strategyName,
        ticker,
        leg_count: legs.length,
        duplicate_count: duplicateCount,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved!", "Strategy saved to your portfolio.");
    };

    if (duplicateCount >= 3) {
      Alert.alert(
        "Duplicate Strategy",
        `You already have ${duplicateCount} identical "${strategyName}" strategies saved for ${ticker}. Save another copy?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Save Anyway", onPress: doSave },
        ]
      );
    } else if (duplicateCount > 0) {
      Alert.alert(
        "Similar Strategy Exists",
        `You have ${duplicateCount} matching "${strategyName}" saved for ${ticker}. Save another copy?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Save", onPress: doSave },
        ]
      );
    } else {
      await doSave();
    }
  }, [analysis, quote, ticker, legs, selectedTemplateId, saveStrategy, savedStrategies]);

  const handleOpenTrade = useCallback(async () => {
    if (!quote) return;
    const tradeLegs: TradeLeg[] = legs.map((l) => ({
      action: l.action,
      type: l.type,
      strike: l.strike,
      quantity: l.quantity,
      expiration: l.expiration,
      entryMid: l.liveMid ?? l.premium,
      entryBid: l.liveBid ?? l.premium,
      entryAsk: l.liveAsk ?? l.premium,
    }));
    const entryNetCost = tradeLegs.reduce((sum, tl) => {
      const cost = tl.entryMid * tl.quantity * 100;
      return sum + (tl.action === "buy" ? cost : -cost);
    }, 0);

    const tradeName = selectedTemplateId
      ? STRATEGY_TEMPLATES.find((t) => t.id === selectedTemplateId)?.name ?? "Custom"
      : "Custom Strategy";
    await openTrade({
      strategyId: selectedTemplateId || "custom",
      strategyName: tradeName,
      ticker,
      openedAt: Date.now(),
      entryNetCost: Math.round(entryNetCost * 100) / 100,
      entrySpotPrice: quote.price,
      legs: tradeLegs,
    });
    Analytics.track(AnalyticsEvents.BUILDER_TRADE_OPENED, {
      strategy_name: tradeName,
      ticker,
      leg_count: legs.length,
      entry_net_cost: Math.round(entryNetCost * 100) / 100,
      total_contracts: legs.reduce((s, l) => s + l.quantity, 0),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Trade Opened!", `Entry cost: $${Math.abs(entryNetCost).toFixed(0)} ${entryNetCost >= 0 ? "debit" : "credit"}`);
  }, [quote, legs, selectedTemplateId, ticker, openTrade]);

  const handleReset = useCallback(() => {
    setStep("ticker");
    setTicker("");
    setTickerInput("");
    setLegs([]);
    setAnalysis(null);
    setSelectedTemplateId(null);
    setSelectedExpiration("");
    setShowAddLeg(false);
  }, []);

  const fmtMoneyOrUnlimited = (n: number | null | undefined) => {
    if (n == null) return "Unlimited";
    return fmtMoney(n);
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
        <View style={styles.headerRight}>
          {step !== "ticker" ? (
            <Pressable onPress={handleReset} style={styles.resetBtn} accessibilityLabel="Reset builder" accessibilityRole="button">
              <Feather name="refresh-cw" size={14} color={Colors.textSecondary} />
            </Pressable>
          ) : null}
          <ProfileButton />
        </View>
      </View>

      <View style={styles.stepRow}>
        {(["ticker", "template", "legs", "analysis"] as BuilderStep[]).map((s) => (
          <View key={s} style={[styles.stepDot, { backgroundColor: step === s ? Colors.accent : Colors.glassBorder }]} />
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
              <Pressable style={styles.searchBtn} onPress={handleTickerSearch} accessibilityLabel="Search ticker" accessibilityRole="button">
                <Feather name="search" size={18} color={Colors.bg} />
              </Pressable>
            </View>

            <Text style={styles.sectionLabel}>Popular</Text>
            <View style={styles.tickerGrid}>
              {POPULAR_TICKERS.slice(0, 30).map((t) => (
                <Pressable key={t} style={({ pressed }) => [styles.tickerChip, pressed && styles.tickerChipPressed]} onPress={() => handleTickerSelect(t)} accessibilityLabel={`Select ${t}`} accessibilityRole="button">
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
                      <Text style={[styles.quoteChange, { color: quote.change >= 0 ? Colors.accent : Colors.red }]}>
                        {quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%)
                      </Text>
                    </View>
                  </View>
                )}

                <Pressable style={({ pressed }) => [styles.customBtn, pressed && styles.customBtnPressed]} onPress={handleCustomStrategy}>
                  <Feather name="plus-circle" size={18} color={Colors.accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customBtnTitle}>Custom Strategy</Text>
                    <Text style={styles.customBtnDesc}>Build from scratch — add individual legs</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={Colors.textMuted} />
                </Pressable>

                {["Basic", "Spreads", "Income", "Volatility", "Neutral", "Hedging"].map((cat) => {
                  const catTemplates = STRATEGY_TEMPLATES.filter((t) => t.category === cat);
                  if (catTemplates.length === 0) return null;
                  return (
                    <View key={cat}>
                      <Text style={styles.categoryLabel}>{cat}</Text>
                      {catTemplates.map((template) => (
                        <Pressable key={template.id} style={({ pressed }) => [styles.templateCard, pressed && styles.templateCardPressed]} onPress={() => handleTemplateSelect(template.id)}>
                          <View style={styles.templateHeader}>
                            <Text style={styles.templateName}>{template.name}</Text>
                            <View style={[styles.outlookBadge, { backgroundColor: OUTLOOK_COLORS[template.outlook] + "18" }]}>
                              <Text style={[styles.outlookText, { color: OUTLOOK_COLORS[template.outlook] }]}>{OUTLOOK_LABELS[template.outlook]}</Text>
                            </View>
                          </View>
                          <Text style={styles.templateDesc}>{template.description}</Text>
                          <Text style={styles.templateLegs}>{template.legs.length} leg{template.legs.length > 1 ? "s" : ""}</Text>
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
            <View style={styles.legsHeaderRow}>
              <Text style={styles.sectionTitle}>{selectedTemplateId ? "Review Legs" : "Build Custom Strategy"}</Text>
              {chain && (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE PRICES</Text>
                </View>
              )}
            </View>

            {legs.map((leg) => (
              <View key={leg.id} style={{ marginBottom: 8 }}>
                <LegRow
                  leg={leg}
                  onRemove={() => handleRemoveLeg(leg.id)}
                  onQuantityChange={(qty) => handleQuantityChange(leg.id, qty)}
                  editable
                  showLive
                />
              </View>
            ))}

            {legs.length === 0 && !showAddLeg && (
              <View style={styles.emptyState}>
                <Feather name="layers" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No legs yet — add your first leg</Text>
              </View>
            )}

            {legs.length > 0 && (
              <View style={styles.costSummary}>
                <Text style={styles.costLabel}>NET {netDebitCredit >= 0 ? "CREDIT" : "DEBIT"}</Text>
                <Text style={[styles.costValue, { color: netDebitCredit >= 0 ? Colors.accent : Colors.red }]}>
                  ${Math.abs(netDebitCredit).toFixed(0)}
                </Text>
                <Text style={styles.costHint}>Using live midpoint prices</Text>
              </View>
            )}

            {showAddLeg && (
              <View style={styles.addLegForm}>
                <Text style={styles.addLegTitle}>Add Leg</Text>
                <View style={styles.addLegToggleRow}>
                  {(["buy", "sell"] as const).map((a) => (
                    <Pressable key={a} style={[styles.toggleBtn, newLeg.action === a && { backgroundColor: a === "buy" ? Colors.accentDim : Colors.redDim, borderColor: a === "buy" ? Colors.accent + "40" : Colors.red + "40" }]} onPress={() => setNewLeg({ ...newLeg, action: a })}>
                      <Text style={[styles.toggleText, newLeg.action === a && { color: a === "buy" ? Colors.accent : Colors.red }]}>{a.toUpperCase()}</Text>
                    </Pressable>
                  ))}
                  {(["call", "put"] as const).map((t) => (
                    <Pressable key={t} style={[styles.toggleBtn, newLeg.type === t && { backgroundColor: t === "call" ? Colors.blueDim : Colors.purpleDim, borderColor: t === "call" ? Colors.blue + "40" : Colors.purple + "40" }]} onPress={() => setNewLeg({ ...newLeg, type: t })}>
                      <Text style={[styles.toggleText, newLeg.type === t && { color: t === "call" ? Colors.blue : Colors.purple }]}>{t.toUpperCase()}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.addLegInputRow}>
                  <View style={styles.addLegInputGroup}>
                    <Text style={styles.addLegLabel}>Strike</Text>
                    <TextInput style={styles.addLegInput} placeholder={`e.g. ${quote ? Math.round(quote.price) : "150"}`} placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" value={newLeg.strike} onChangeText={(v) => setNewLeg({ ...newLeg, strike: v })} />
                  </View>
                  <View style={styles.addLegInputGroup}>
                    <Text style={styles.addLegLabel}>Premium (auto)</Text>
                    <TextInput style={styles.addLegInput} placeholder="Auto from chain" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" value={newLeg.premium} onChangeText={(v) => setNewLeg({ ...newLeg, premium: v })} />
                  </View>
                  <View style={[styles.addLegInputGroup, { flex: 0.6 }]}>
                    <Text style={styles.addLegLabel}>Contracts</Text>
                    <TextInput style={styles.addLegInput} placeholder="1" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" value={newLeg.quantity} onChangeText={(v) => setNewLeg({ ...newLeg, quantity: v })} />
                  </View>
                </View>
                {chain && newLeg.strike && (() => {
                  const strike = parseFloat(newLeg.strike);
                  if (isNaN(strike)) return null;
                  const contracts = newLeg.type === "call" ? chain.calls : chain.puts;
                  const match = findClosestContract(contracts, strike);
                  if (!match) return null;
                  const mid = (match.bid + match.ask) / 2;
                  return (
                    <View style={styles.chainPreview}>
                      <Text style={styles.chainPreviewLabel}>Chain Match: ${match.strike}</Text>
                      <Text style={[styles.chainPreviewVal, { color: Colors.accent }]}>Bid ${match.bid.toFixed(2)}</Text>
                      <Text style={[styles.chainPreviewVal, { color: Colors.red }]}>Ask ${match.ask.toFixed(2)}</Text>
                      <Text style={[styles.chainPreviewVal, { color: Colors.textPrimary, fontFamily: "Inter_700Bold" }]}>Mid ${mid.toFixed(2)}</Text>
                    </View>
                  );
                })()}
                <View style={styles.addLegBtns}>
                  <Pressable style={styles.addLegCancel} onPress={() => setShowAddLeg(false)}>
                    <Text style={styles.addLegCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.addLegConfirm} onPress={handleAddCustomLeg}>
                    <Feather name="plus" size={14} color={Colors.bg} />
                    <Text style={styles.addLegConfirmText}>Add Leg</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {!showAddLeg && (
              <Pressable style={styles.addLegBtn} onPress={() => setShowAddLeg(true)}>
                <Feather name="plus" size={16} color={Colors.accent} />
                <Text style={styles.addLegBtnText}>Add Leg</Text>
              </Pressable>
            )}

            {expirationsData && (
              <>
                <Text style={styles.sectionLabel}>Expiration</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.expRow}>
                    {expirationsData.expirations.slice(0, 8).map((exp) => (
                      <Pressable key={exp} style={[styles.expChip, selectedExpiration === exp && styles.expChipSelected]} onPress={() => {
                        setSelectedExpiration(exp);
                        setLegs((prev) => prev.map((l) => ({ ...l, expiration: exp })));
                      }}>
                        <Text style={[styles.expChipText, selectedExpiration === exp && styles.expChipTextSelected]}>{exp}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            <View style={styles.legActionRow}>
              <Pressable
                style={[styles.analyzeBtn, { flex: 1 }, legs.length === 0 && styles.analyzeBtnDisabled]}
                onPress={handleAnalyze}
                disabled={legs.length === 0 || analyzeMutation.isPending}
              >
                {analyzeMutation.isPending ? (
                  <ActivityIndicator color={Colors.bg} />
                ) : (
                  <>
                    <Feather name="bar-chart-2" size={16} color={Colors.bg} />
                    <Text style={styles.analyzeBtnText}>Analyze</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                style={[styles.openTradeBtn, legs.length === 0 && styles.analyzeBtnDisabled]}
                onPress={handleOpenTrade}
                disabled={legs.length === 0}
              >
                <Feather name="play-circle" size={16} color={Colors.blue} />
                <Text style={styles.openTradeBtnText}>Open Trade</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === "analysis" && analysis && quote && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>P&L Analysis</Text>

            <View style={styles.chartCard}>
              <PnLChart data={analysis.pnlAtExpiry} spotPrice={quote.price} breakEvenPoints={analysis.breakEvenPoints} height={240} timeDecayCurves={analysis.timeDecayCurves} />
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.textPrimary }]} />
                  <Text style={styles.legendText}>At Expiry</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.blue }]} />
                  <Text style={styles.legendText}>Spot ${quote.price.toFixed(2)}</Text>
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
                      <View style={[styles.legendDash, { backgroundColor: i === 0 ? "rgba(56,189,248,0.5)" : i === 1 ? "rgba(167,139,250,0.5)" : "rgba(251,191,36,0.5)" }]} />
                      <Text style={styles.legendText}>{curve.label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.metricsRow}>
              <MetricCard label="Max Profit" value={analysis.maxProfit != null ? fmtMoney(analysis.maxProfit) : "Unlimited"} color={Colors.accent} />
              <MetricCard label="Max Loss" value={analysis.maxLoss != null ? fmtMoney(analysis.maxLoss) : "Unlimited"} color={Colors.red} />
            </View>

            <View style={styles.metricsRow}>
              <MetricCard label="Net Cost" value={analysis.netCost >= 0 ? `$${analysis.netCost.toFixed(0)}` : `-$${Math.abs(analysis.netCost).toFixed(0)}`} color={analysis.netCost >= 0 ? Colors.red : Colors.accent} />
              <MetricCard label="Risk/Reward" value={analysis.riskRewardRatio != null ? `${analysis.riskRewardRatio.toFixed(2)}x` : "N/A"} color={Colors.blue} />
            </View>

            {analysis.breakEvenPoints.length > 0 && (
              <View style={styles.breakEvenCard}>
                <Text style={styles.breakEvenLabel}>Break-even Points</Text>
                <View style={styles.breakEvenRow}>
                  {analysis.breakEvenPoints.map((be, i) => (
                    <Text key={i} style={styles.breakEvenValue}>${be.toFixed(2)}</Text>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.greeksCard}>
              <Text style={styles.greeksTitle}>Greeks</Text>
              <GreeksBar delta={analysis.greeks.delta} gamma={analysis.greeks.gamma} theta={analysis.greeks.theta} vega={analysis.greeks.vega} rho={analysis.greeks.rho} />
            </View>

            <View style={styles.actionRow}>
              <Pressable style={styles.saveBtn} onPress={handleSave}>
                <Feather name="bookmark" size={16} color={Colors.accent} />
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
              <Pressable style={styles.tradeBtn} onPress={handleOpenTrade}>
                <Feather name="play-circle" size={16} color={Colors.blue} />
                <Text style={styles.tradeBtnText}>Open Trade</Text>
              </Pressable>
              <Pressable style={styles.newBtn} onPress={handleReset}>
                <Feather name="plus" size={16} color={Colors.textSecondary} />
                <Text style={styles.newBtnText}>New</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.textPrimary },
  headerSub: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  resetBtn: { padding: 8, backgroundColor: Colors.glassElevated, borderRadius: 10, borderWidth: 1, borderColor: Colors.glassBorder },
  stepRow: { flexDirection: "row", gap: 6, paddingHorizontal: 20, paddingBottom: 16 },
  stepDot: { width: 32, height: 3, borderRadius: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  section: { paddingHorizontal: 20, gap: 12 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: Colors.textPrimary, marginBottom: 4 },
  sectionHint: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginTop: -8 },
  sectionLabel: { fontSize: 12, color: Colors.textMuted, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 8 },
  searchRow: { flexDirection: "row", gap: 10 },
  input: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: Colors.textPrimary, fontFamily: "Inter_500Medium", fontSize: 15, borderWidth: 1, borderColor: Colors.glassBorder },
  searchBtn: { backgroundColor: Colors.accent, borderRadius: 14, paddingHorizontal: 16, justifyContent: "center" },
  tickerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tickerChip: { backgroundColor: Colors.glassElevated, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.glassBorder },
  tickerChipPressed: { backgroundColor: Colors.accentDim, borderColor: Colors.accent + "40" },
  tickerChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textPrimary },
  quoteCard: { backgroundColor: Colors.glassElevated, borderRadius: 16, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: Colors.glassBorder },
  quoteName: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginBottom: 4 },
  quotePrice: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.textPrimary },
  quoteMeta: { alignItems: "flex-end" },
  quoteChange: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  customBtn: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.accentDim, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.accent + "20" },
  customBtnPressed: { opacity: 0.8 },
  customBtnTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.accent },
  customBtnDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  categoryLabel: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 1, marginTop: 8, marginBottom: 4 },
  templateCard: { backgroundColor: Colors.glassElevated, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.glassBorder },
  templateCardPressed: { borderColor: Colors.accent + "30" },
  templateHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  templateName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.textPrimary },
  outlookBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  outlookText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  templateDesc: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 18 },
  templateLegs: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_500Medium", marginTop: 6 },
  legsHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.accentDim, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.accent },
  liveText: { fontSize: 9, fontFamily: "Inter_700Bold", color: Colors.accent, letterSpacing: 0.5 },
  costSummary: { backgroundColor: Colors.glassElevated, borderRadius: 14, padding: 14, alignItems: "center", gap: 4, borderWidth: 1, borderColor: Colors.glassBorder },
  costLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: Colors.textMuted, letterSpacing: 0.8 },
  costValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
  costHint: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  emptyState: { alignItems: "center", paddingVertical: 30, gap: 10 },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontFamily: "Inter_400Regular" },
  addLegBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: Colors.accent + "30", borderStyle: "dashed" },
  addLegBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.accent },
  addLegForm: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: Colors.glassBorder },
  addLegTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.textPrimary },
  addLegToggleRow: { flexDirection: "row", gap: 8 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: Colors.glassElevated, borderWidth: 1, borderColor: Colors.glassBorder },
  toggleText: { fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.textMuted, letterSpacing: 0.5 },
  addLegInputRow: { flexDirection: "row", gap: 10 },
  addLegInputGroup: { flex: 1, gap: 4 },
  addLegLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  addLegInput: { backgroundColor: Colors.glassElevated, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: Colors.textPrimary, fontFamily: "Inter_500Medium", fontSize: 14, borderWidth: 1, borderColor: Colors.glassBorder },
  chainPreview: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.glass, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.glassBorder },
  chainPreviewLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textMuted, flex: 1 },
  chainPreviewVal: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  addLegBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  addLegCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", backgroundColor: Colors.glassElevated, borderWidth: 1, borderColor: Colors.glassBorder },
  addLegCancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  addLegConfirm: { flex: 1, flexDirection: "row", paddingVertical: 12, borderRadius: 10, alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.accent },
  addLegConfirmText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.bg },
  expRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  expChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.glassElevated, borderWidth: 1, borderColor: Colors.glassBorder },
  expChipSelected: { backgroundColor: Colors.accentDim, borderColor: Colors.accent + "40" },
  expChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  expChipTextSelected: { color: Colors.accent, fontFamily: "Inter_600SemiBold" },
  legActionRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  analyzeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16 },
  analyzeBtnDisabled: { opacity: 0.4 },
  analyzeBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.bg },
  openTradeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.blueDim, borderRadius: 14, paddingVertical: 16, borderWidth: 1, borderColor: Colors.blue + "25" },
  openTradeBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.blue },
  chartCard: { backgroundColor: Colors.glassElevated, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: Colors.glassBorder, gap: 8 },
  chartLegend: { flexDirection: "row", gap: 16, paddingHorizontal: 8, paddingTop: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendDash: { width: 12, height: 3, borderRadius: 1 },
  legendText: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular" },
  metricsRow: { flexDirection: "row", gap: 10 },
  breakEvenCard: { backgroundColor: Colors.glassElevated, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.glassBorder },
  breakEvenLabel: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  breakEvenRow: { flexDirection: "row", gap: 12 },
  breakEvenValue: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.gold },
  greeksCard: { backgroundColor: Colors.glassElevated, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: Colors.glassBorder },
  greeksTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  actionRow: { flexDirection: "row", gap: 10 },
  saveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.accentDim, borderRadius: 14, paddingVertical: 16, borderWidth: 1, borderColor: Colors.accent + "25" },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.accent },
  tradeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.blueDim, borderRadius: 14, paddingVertical: 16, borderWidth: 1, borderColor: Colors.blue + "25" },
  tradeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.blue },
  newBtn: { flex: 0.7, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.glassElevated, borderRadius: 14, paddingVertical: 16, borderWidth: 1, borderColor: Colors.glassBorder },
  newBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
});
