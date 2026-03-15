import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  FlatList,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { Colors } from "@/constants/colors";
import { POPULAR_TICKERS } from "@/constants/strategies";
import { api, OptionsChain, StockQuote, FlowEntry, PutCallRatio } from "@/hooks/useApi";

type MarketView = "quotes" | "chain" | "flow";

function QuoteRow({ ticker, onPress }: { ticker: string; onPress?: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["quote", ticker],
    queryFn: () => api.getQuote(ticker),
    refetchInterval: 5000,
    staleTime: 3000,
  });

  if (isLoading || !data) {
    return (
      <Pressable style={styles.quoteRow} onPress={onPress}>
        <Text style={styles.quoteRowTicker}>{ticker}</Text>
        <ActivityIndicator size="small" color={Colors.textMuted} />
      </Pressable>
    );
  }

  const isUp = data.change >= 0;

  return (
    <Pressable style={styles.quoteRow} onPress={onPress}>
      <View style={styles.quoteRowLeft}>
        <Text style={styles.quoteRowTicker}>{data.ticker}</Text>
        <Text style={styles.quoteRowName} numberOfLines={1}>
          {data.name}
        </Text>
      </View>
      <View style={styles.quoteRowRight}>
        <Text style={styles.quoteRowPrice}>${data.price.toFixed(2)}</Text>
        <View
          style={[
            styles.changeChip,
            { backgroundColor: isUp ? Colors.accentDim : Colors.redDim },
          ]}
        >
          <Feather
            name={isUp ? "trending-up" : "trending-down"}
            size={10}
            color={isUp ? Colors.accent : Colors.red}
          />
          <Text
            style={[
              styles.changeText,
              { color: isUp ? Colors.accent : Colors.red },
            ]}
          >
            {isUp ? "+" : ""}{data.changePercent.toFixed(2)}%
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function LiveQuoteDetail({ ticker }: { ticker: string }) {
  const { data } = useQuery({
    queryKey: ["quote", ticker],
    queryFn: () => api.getQuote(ticker),
    refetchInterval: 3000,
    staleTime: 2000,
  });

  if (!data) return null;

  const isUp = data.change >= 0;
  const fmtVol = (n: number) => {
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
    return String(n);
  };
  const fmtCap = (n: number | undefined) => {
    if (!n) return "N/A";
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
    return `$${n}`;
  };

  return (
    <View style={styles.liveDetail}>
      <View style={styles.liveDetailTop}>
        <View>
          <Text style={styles.liveDetailName}>{data.name}</Text>
          <Text style={styles.liveDetailPrice}>${data.price.toFixed(2)}</Text>
        </View>
        <View style={styles.liveDetailChange}>
          <Text style={[styles.liveDetailChg, { color: isUp ? Colors.accent : Colors.red }]}>
            {isUp ? "+" : ""}{data.change.toFixed(2)} ({isUp ? "+" : ""}{data.changePercent.toFixed(2)}%)
          </Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
      </View>
      <View style={styles.liveStats}>
        <View style={styles.liveStat}>
          <Text style={styles.liveStatLabel}>OPEN</Text>
          <Text style={styles.liveStatValue}>${data.open.toFixed(2)}</Text>
        </View>
        <View style={styles.liveStat}>
          <Text style={styles.liveStatLabel}>HIGH</Text>
          <Text style={styles.liveStatValue}>${data.high.toFixed(2)}</Text>
        </View>
        <View style={styles.liveStat}>
          <Text style={styles.liveStatLabel}>LOW</Text>
          <Text style={styles.liveStatValue}>${data.low.toFixed(2)}</Text>
        </View>
        <View style={styles.liveStat}>
          <Text style={styles.liveStatLabel}>VOL</Text>
          <Text style={styles.liveStatValue}>{fmtVol(data.volume)}</Text>
        </View>
        <View style={styles.liveStat}>
          <Text style={styles.liveStatLabel}>MKT CAP</Text>
          <Text style={styles.liveStatValue}>{fmtCap(data.marketCap)}</Text>
        </View>
      </View>
    </View>
  );
}

function FlowRow({ entry }: { entry: FlowEntry }) {
  const isCall = entry.type === "CALL";
  return (
    <View style={styles.flowRow}>
      <View style={[styles.flowTypeBadge, { backgroundColor: isCall ? Colors.accentDim : Colors.redDim }]}>
        <Text style={[styles.flowTypeText, { color: isCall ? Colors.accent : Colors.red }]}>
          {entry.type}
        </Text>
      </View>
      <Text style={styles.flowCell}>${entry.strike}</Text>
      <Text style={styles.flowCell}>{entry.expiration.slice(5)}</Text>
      <Text style={[styles.flowCell, { color: Colors.blue }]}>{entry.volume.toLocaleString()}</Text>
      <Text style={styles.flowCell}>{entry.openInterest.toLocaleString()}</Text>
      <Text style={[styles.flowCell, { color: entry.volOiRatio > 1.5 ? Colors.gold : Colors.textSecondary }]}>
        {entry.volOiRatio.toFixed(2)}
      </Text>
    </View>
  );
}

export default function MarketScreen() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<MarketView>("quotes");
  const [searchInput, setSearchInput] = useState("");
  const [searchTicker, setSearchTicker] = useState("");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [chainTicker, setChainTicker] = useState("SPY");
  const [chainInput, setChainInput] = useState("SPY");
  const [selectedExp, setSelectedExp] = useState("");
  const [chainTab, setChainTab] = useState<"calls" | "puts">("calls");
  const [flowTicker, setFlowTicker] = useState("SPY");
  const [flowInput, setFlowInput] = useState("SPY");

  const displayTickers = searchTicker
    ? [searchTicker, ...POPULAR_TICKERS.filter(t => t !== searchTicker)]
    : POPULAR_TICKERS;

  const { data: expirations } = useQuery({
    queryKey: ["expirations", chainTicker],
    queryFn: () => api.getExpirations(chainTicker),
    enabled: view === "chain" && !!chainTicker,
  });

  const activeExp = selectedExp || expirations?.expirations[1] || "";

  const { data: chain, isLoading: chainLoading } = useQuery({
    queryKey: ["chain", chainTicker, activeExp],
    queryFn: () => api.getChain(chainTicker, activeExp),
    enabled: view === "chain" && !!chainTicker && !!activeExp,
    refetchInterval: 10000,
    staleTime: 8000,
  });

  const { data: flowData, isLoading: flowLoading } = useQuery({
    queryKey: ["flow", flowTicker],
    queryFn: () => api.getFlow(flowTicker),
    enabled: view === "flow" && !!flowTicker,
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const { data: pcrData } = useQuery({
    queryKey: ["pcr", flowTicker],
    queryFn: () => api.getPutCallRatio(flowTicker),
    enabled: view === "flow" && !!flowTicker,
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const handleTickerSearch = useCallback(() => {
    const val = searchInput.trim().toUpperCase();
    if (val) {
      setSearchTicker(val);
    }
  }, [searchInput]);

  const handleChainSearch = useCallback(() => {
    if (chainInput.trim()) {
      setChainTicker(chainInput.trim().toUpperCase());
      setSelectedExp("");
    }
  }, [chainInput]);

  const handleFlowSearch = useCallback(() => {
    if (flowInput.trim()) {
      setFlowTicker(flowInput.trim().toUpperCase());
    }
  }, [flowInput]);

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
        <Text style={styles.headerTitle}>Market Data</Text>
        <View style={styles.segmentRow}>
          {(["quotes", "chain", "flow"] as MarketView[]).map((v) => (
            <Pressable
              key={v}
              style={[styles.segment, view === v && styles.segmentActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setView(v);
              }}
            >
              <Text style={[styles.segmentText, view === v && styles.segmentTextActive]}>
                {v === "quotes" ? "Live Quotes" : v === "chain" ? "Chain" : "Flow"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {view === "quotes" && (
        <View style={{ flex: 1 }}>
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchBar}
              placeholder="Search any ticker (e.g. AAPL, TSLA, ANY)"
              placeholderTextColor={Colors.textMuted}
              value={searchInput}
              onChangeText={(t) => setSearchInput(t.toUpperCase())}
              autoCapitalize="characters"
              onSubmitEditing={handleTickerSearch}
              returnKeyType="search"
            />
            <Pressable style={styles.searchBarBtn} onPress={handleTickerSearch}>
              <Feather name="search" size={16} color={Colors.bg} />
            </Pressable>
          </View>

          {searchTicker ? (
            <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
              <LiveQuoteDetail ticker={searchTicker} />
            </View>
          ) : null}

          <FlatList
            data={displayTickers}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            renderItem={({ item, index }) => (
              <View>
                {index > 0 && <View style={styles.separator} />}
                <QuoteRow
                  ticker={item}
                  onPress={() => {
                    setSearchTicker(item);
                    setSearchInput(item);
                  }}
                />
              </View>
            )}
            ListHeaderComponent={
              <Text style={styles.sectionLabel}>
                {searchTicker ? `Showing ${searchTicker} + Popular Tickers` : "All US Tickers — Auto-Refreshing"}
              </Text>
            }
          />
        </View>
      )}

      {view === "chain" && (
        <View style={styles.chainContainer}>
          <View style={styles.chainSearch}>
            <TextInput
              style={styles.chainInput}
              value={chainInput}
              onChangeText={(t) => setChainInput(t.toUpperCase())}
              placeholder="Any ticker..."
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              onSubmitEditing={handleChainSearch}
              returnKeyType="search"
            />
            <Pressable style={styles.chainSearchBtn} onPress={handleChainSearch}>
              <Feather name="search" size={16} color={Colors.bg} />
            </Pressable>
          </View>

          {chain && (
            <View style={styles.chainMeta}>
              <Text style={styles.chainTicker}>{chain.ticker}</Text>
              <Text style={styles.chainSpot}>Spot: ${chain.spotPrice.toFixed(2)}</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
          )}

          {expirations && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.expScroll}>
              <View style={styles.expRow}>
                {expirations.expirations.map((exp) => (
                  <Pressable
                    key={exp}
                    style={[
                      styles.expChip,
                      activeExp === exp && styles.expChipSelected,
                    ]}
                    onPress={() => setSelectedExp(exp)}
                  >
                    <Text
                      style={[
                        styles.expChipText,
                        activeExp === exp && styles.expChipTextSelected,
                      ]}
                    >
                      {exp}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}

          <View style={styles.callsPutsToggle}>
            {(["calls", "puts"] as const).map((t) => (
              <Pressable
                key={t}
                style={[
                  styles.callsPutsBtn,
                  chainTab === t && {
                    backgroundColor: t === "calls" ? Colors.accentDim : Colors.redDim,
                    borderColor: t === "calls" ? Colors.accent : Colors.red,
                  },
                ]}
                onPress={() => setChainTab(t)}
              >
                <Text
                  style={[
                    styles.callsPutsText,
                    chainTab === t && { color: t === "calls" ? Colors.accent : Colors.red },
                  ]}
                >
                  {t === "calls" ? "Calls" : "Puts"}
                </Text>
              </Pressable>
            ))}
          </View>

          {chainLoading ? (
            <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
          ) : chain ? (
            <>
              <View style={styles.chainHeader}>
                <Text style={[styles.chainHeaderCell, { flex: 0.8 }]}>Strike</Text>
                <Text style={styles.chainHeaderCell}>Bid</Text>
                <Text style={styles.chainHeaderCell}>Ask</Text>
                <Text style={styles.chainHeaderCell}>Vol</Text>
                <Text style={styles.chainHeaderCell}>OI</Text>
                <Text style={styles.chainHeaderCell}>IV%</Text>
                <Text style={[styles.chainHeaderCell, { color: Colors.blue }]}>Delta</Text>
              </View>
              <FlatList
                data={chainTab === "calls" ? chain.calls : chain.puts}
                keyExtractor={(item, i) => `${item.strike}-${i}`}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isAtm =
                    Math.abs(item.strike - chain.spotPrice) <
                    chain.spotPrice * 0.02;

                  return (
                    <View
                      style={[
                        styles.chainRow,
                        isAtm && styles.chainRowAtm,
                        item.inTheMoney && styles.chainRowItm,
                      ]}
                    >
                      <Text style={[styles.chainCell, { flex: 0.8, fontFamily: "Inter_700Bold" }]}>
                        ${item.strike}
                      </Text>
                      <Text style={[styles.chainCell, { color: Colors.accent }]}>
                        {item.bid.toFixed(2)}
                      </Text>
                      <Text style={[styles.chainCell, { color: Colors.red }]}>
                        {item.ask.toFixed(2)}
                      </Text>
                      <Text style={styles.chainCell}>
                        {item.volume > 999 ? `${(item.volume / 1000).toFixed(1)}K` : item.volume}
                      </Text>
                      <Text style={styles.chainCell}>
                        {item.openInterest > 999 ? `${(item.openInterest / 1000).toFixed(1)}K` : item.openInterest}
                      </Text>
                      <Text style={styles.chainCell}>{item.impliedVolatility.toFixed(0)}%</Text>
                      <Text style={[styles.chainCell, { color: Colors.blue }]}>
                        {item.delta?.toFixed(2) ?? "\u2014"}
                      </Text>
                    </View>
                  );
                }}
              />
            </>
          ) : null}
        </View>
      )}

      {view === "flow" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.chainSearch}>
            <TextInput
              style={styles.chainInput}
              value={flowInput}
              onChangeText={(t) => setFlowInput(t.toUpperCase())}
              placeholder="Any ticker..."
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              onSubmitEditing={handleFlowSearch}
              returnKeyType="search"
            />
            <Pressable style={styles.chainSearchBtn} onPress={handleFlowSearch}>
              <Feather name="search" size={16} color={Colors.bg} />
            </Pressable>
          </View>

          {pcrData && (
            <View style={styles.pcrCard}>
              <View style={styles.pcrHeader}>
                <Text style={styles.pcrTitle}>{flowTicker} Put/Call Ratio</Text>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>
              <View style={styles.pcrStats}>
                <View style={styles.pcrStat}>
                  <Text style={styles.pcrStatLabel}>VOL RATIO</Text>
                  <Text style={[
                    styles.pcrStatValue,
                    { color: pcrData.volRatio > 1 ? Colors.red : Colors.accent }
                  ]}>
                    {pcrData.volRatio.toFixed(3)}
                  </Text>
                  <Text style={styles.pcrStatHint}>
                    {pcrData.volRatio > 1.2 ? "Bearish" : pcrData.volRatio < 0.8 ? "Bullish" : "Neutral"}
                  </Text>
                </View>
                <View style={styles.pcrStat}>
                  <Text style={styles.pcrStatLabel}>OI RATIO</Text>
                  <Text style={[
                    styles.pcrStatValue,
                    { color: pcrData.oiRatio > 1 ? Colors.red : Colors.accent }
                  ]}>
                    {pcrData.oiRatio.toFixed(3)}
                  </Text>
                </View>
                <View style={styles.pcrStat}>
                  <Text style={styles.pcrStatLabel}>CALL VOL</Text>
                  <Text style={[styles.pcrStatValue, { color: Colors.accent }]}>
                    {pcrData.totalCallVol > 999999 ? `${(pcrData.totalCallVol / 1e6).toFixed(1)}M` : `${(pcrData.totalCallVol / 1e3).toFixed(0)}K`}
                  </Text>
                </View>
                <View style={styles.pcrStat}>
                  <Text style={styles.pcrStatLabel}>PUT VOL</Text>
                  <Text style={[styles.pcrStatValue, { color: Colors.red }]}>
                    {pcrData.totalPutVol > 999999 ? `${(pcrData.totalPutVol / 1e6).toFixed(1)}M` : `${(pcrData.totalPutVol / 1e3).toFixed(0)}K`}
                  </Text>
                </View>
              </View>
              <View style={styles.pcrBarContainer}>
                <View style={[styles.pcrBarCall, { flex: pcrData.totalCallVol || 1 }]} />
                <View style={[styles.pcrBarPut, { flex: pcrData.totalPutVol || 1 }]} />
              </View>
              <View style={styles.pcrBarLabels}>
                <Text style={[styles.pcrBarLabel, { color: Colors.accent }]}>Calls</Text>
                <Text style={[styles.pcrBarLabel, { color: Colors.red }]}>Puts</Text>
              </View>
            </View>
          )}

          <Text style={styles.flowSectionTitle}>Options Flow — Highest Volume</Text>

          {flowLoading ? (
            <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
          ) : flowData ? (
            <>
              <View style={styles.flowHeader}>
                <Text style={[styles.flowHeaderCell, { width: 48 }]}>Type</Text>
                <Text style={styles.flowHeaderCell}>Strike</Text>
                <Text style={styles.flowHeaderCell}>Exp</Text>
                <Text style={[styles.flowHeaderCell, { color: Colors.blue }]}>Vol</Text>
                <Text style={styles.flowHeaderCell}>OI</Text>
                <Text style={styles.flowHeaderCell}>V/OI</Text>
              </View>
              {flowData.flow.slice(0, 30).map((entry, i) => (
                <FlowRow key={`${entry.strike}-${entry.type}-${entry.expiration}-${i}`} entry={entry} />
              ))}
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  segmentRow: {
    flexDirection: "row",
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 3,
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: Colors.bgCardElevated,
  },
  segmentText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  segmentTextActive: {
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  searchBarContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: Colors.textPrimary,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchBarBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  liveDetail: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  liveDetailTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  liveDetailName: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  liveDetailPrice: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  liveDetailChange: {
    alignItems: "flex-end",
    gap: 6,
  },
  liveDetailChg: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.accentDim,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  liveText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  liveStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  liveStat: {
    gap: 2,
    minWidth: 55,
  },
  liveStatLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
  liveStatValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 20,
  },
  quoteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  quoteRowLeft: {
    flex: 1,
    gap: 2,
  },
  quoteRowTicker: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  quoteRowName: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  quoteRowRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  quoteRowPrice: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  changeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  changeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
  },
  chainContainer: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 120,
  },
  chainSearch: {
    flexDirection: "row",
    gap: 10,
  },
  chainInput: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chainSearchBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  chainMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chainTicker: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  chainSpot: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.blue,
  },
  expScroll: {
    flexGrow: 0,
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
  callsPutsToggle: {
    flexDirection: "row",
    gap: 10,
  },
  callsPutsBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCardElevated,
    alignItems: "center",
  },
  callsPutsText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  chainHeader: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.bgCardElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chainHeaderCell: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "right",
  },
  chainRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chainRowAtm: {
    backgroundColor: Colors.blueDim,
  },
  chainRowItm: {
    backgroundColor: "rgba(30,40,60,0.5)",
  },
  chainCell: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
    textAlign: "right",
  },
  pcrCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  pcrHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pcrTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  pcrStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  pcrStat: {
    gap: 3,
    minWidth: 60,
  },
  pcrStatLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
  pcrStatValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  pcrStatHint: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  pcrBarContainer: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    gap: 2,
  },
  pcrBarCall: {
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  pcrBarPut: {
    backgroundColor: Colors.red,
    borderRadius: 4,
  },
  pcrBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pcrBarLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  flowSectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
    marginTop: 4,
  },
  flowHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: Colors.bgCardElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  flowHeaderCell: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  flowRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  flowTypeBadge: {
    width: 44,
    borderRadius: 5,
    paddingVertical: 3,
    alignItems: "center",
  },
  flowTypeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  flowCell: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
    textAlign: "center",
  },
});
