import React, { useState, useCallback } from "react";
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
import { api, OptionsChain, StockQuote } from "@/hooks/useApi";

type MarketView = "quotes" | "chain";

function QuoteRow({ ticker }: { ticker: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["quote", ticker],
    queryFn: () => api.getQuote(ticker),
    staleTime: 30000,
  });

  if (isLoading || !data) {
    return (
      <View style={styles.quoteRow}>
        <Text style={styles.quoteRowTicker}>{ticker}</Text>
        <ActivityIndicator size="small" color={Colors.textMuted} />
      </View>
    );
  }

  const isUp = data.change >= 0;

  return (
    <View style={styles.quoteRow}>
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
    </View>
  );
}

export default function MarketScreen() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<MarketView>("quotes");
  const [chainTicker, setChainTicker] = useState("SPY");
  const [chainInput, setChainInput] = useState("SPY");
  const [selectedExp, setSelectedExp] = useState("");
  const [chainTab, setChainTab] = useState<"calls" | "puts">("calls");

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
  });

  const handleChainSearch = useCallback(() => {
    if (chainInput.trim()) {
      setChainTicker(chainInput.trim().toUpperCase());
      setSelectedExp("");
    }
  }, [chainInput]);

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
          {(["quotes", "chain"] as MarketView[]).map((v) => (
            <Pressable
              key={v}
              style={[styles.segment, view === v && styles.segmentActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setView(v);
              }}
            >
              <Text style={[styles.segmentText, view === v && styles.segmentTextActive]}>
                {v === "quotes" ? "Quotes" : "Options Chain"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {view === "quotes" ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>Top 100 Active</Text>
          <View style={styles.quotesCard}>
            {POPULAR_TICKERS.map((ticker, i) => (
              <View key={ticker}>
                {i > 0 && <View style={styles.separator} />}
                <QuoteRow ticker={ticker} />
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.chainContainer}>
          <View style={styles.chainSearch}>
            <TextInput
              style={styles.chainInput}
              value={chainInput}
              onChangeText={(t) => setChainInput(t.toUpperCase())}
              placeholder="Ticker"
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
                <Text style={styles.chainHeaderCell}>IV%</Text>
                <Text style={[styles.chainHeaderCell, { color: Colors.blue }]}>Δ</Text>
              </View>
              <FlatList
                data={chainTab === "calls" ? chain.calls : chain.puts}
                keyExtractor={(item, i) => `${item.strike}-${i}`}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isAtm =
                    Math.abs(item.strike - chain.spotPrice) <
                    chain.spotPrice * 0.02;
                  const isITM =
                    chainTab === "calls"
                      ? item.strike < chain.spotPrice
                      : item.strike > chain.spotPrice;

                  return (
                    <View
                      style={[
                        styles.chainRow,
                        isAtm && styles.chainRowAtm,
                        isITM && styles.chainRowItm,
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
                      <Text style={styles.chainCell}>{item.impliedVolatility.toFixed(0)}%</Text>
                      <Text style={[styles.chainCell, { color: Colors.blue }]}>
                        {item.delta?.toFixed(2) ?? "—"}
                      </Text>
                    </View>
                  );
                }}
              />
            </>
          ) : null}
        </View>
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
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  segmentTextActive: {
    color: Colors.textPrimary,
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
  sectionLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  quotesCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  quoteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
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
    marginHorizontal: 14,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.bgCardElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chainHeaderCell: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "right",
  },
  chainRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 11,
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
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
    textAlign: "right",
  },
});
