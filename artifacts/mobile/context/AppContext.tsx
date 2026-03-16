import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useAuth } from "@/lib/auth";
import { api, AuthUser, ServerStrategy } from "@/hooks/useApi";
import { Analytics, AnalyticsEvents } from "@/lib/analytics";

export interface SavedLeg {
  id: string;
  action: "buy" | "sell";
  type: "call" | "put";
  strike: number;
  premium: number;
  quantity: number;
  expiration: string;
}

export interface TradeLeg {
  action: "buy" | "sell";
  type: "call" | "put";
  strike: number;
  quantity: number;
  expiration: string;
  entryMid: number;
  entryBid: number;
  entryAsk: number;
}

export interface SavedStrategy {
  id: string;
  name: string;
  ticker: string;
  spotPrice: number;
  legs: SavedLeg[];
  createdAt: number;
  updatedAt: number;
  serverId?: number;
}

export interface OpenTrade {
  id: string;
  strategyId: string;
  strategyName: string;
  ticker: string;
  openedAt: number;
  closedAt?: number;
  entryNetCost: number;
  exitValue?: number;
  realizedPnL?: number;
  status: "open" | "closed";
  entrySpotPrice: number;
  legs: TradeLeg[];
}

interface AppContextType {
  user: AuthUser | null;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  savedStrategies: SavedStrategy[];
  openTrades: OpenTrade[];
  saveStrategy: (strategy: Omit<SavedStrategy, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateStrategy: (id: string, updates: Partial<SavedStrategy>) => Promise<void>;
  deleteStrategy: (id: string) => Promise<void>;
  openTrade: (trade: Omit<OpenTrade, "id" | "status">) => Promise<void>;
  updateTrade: (tradeId: string, updates: Partial<OpenTrade>) => Promise<void>;
  closeTrade: (tradeId: string, exitValue: number) => Promise<void>;
  deleteTrade: (tradeId: string) => Promise<void>;
  refreshStrategies: () => Promise<void>;
  isLoaded: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const STRATEGIES_KEY = "optionviz_strategies";
const TRADES_KEY = "optionviz_trades";
const GUEST_LAST_ACTIVE_KEY = "optionviz_guest_last_active";
const GUEST_TIMEOUT_MS = 30 * 60 * 1000;

async function checkAndClearGuestData(): Promise<boolean> {
  try {
    const lastActive = await AsyncStorage.getItem(GUEST_LAST_ACTIVE_KEY);
    if (!lastActive) return false;

    const elapsed = Date.now() - parseInt(lastActive, 10);
    if (elapsed >= GUEST_TIMEOUT_MS) {
      await AsyncStorage.multiRemove([STRATEGIES_KEY, TRADES_KEY, GUEST_LAST_ACTIVE_KEY]);
      Analytics.track(AnalyticsEvents.GUEST_SESSION_EXPIRED, {
        elapsed_minutes: Math.round(elapsed / 60000),
      });
      return true;
    }
  } catch {}
  return false;
}

async function touchGuestActivity() {
  try {
    await AsyncStorage.setItem(GUEST_LAST_ACTIVE_KEY, String(Date.now()));
  } catch {}
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const {
    user: authUser,
    isLoading: isAuthLoading,
    login: authLogin,
    register: authRegister,
    logout: authLogout,
  } = useAuth();
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>([]);
  const [openTrades, setOpenTrades] = useState<OpenTrade[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const user: AuthUser | null = authUser ? {
    id: authUser.id,
    email: authUser.email,
    firstName: authUser.firstName,
    lastName: authUser.lastName,
    profileImageUrl: authUser.profileImageUrl,
  } : null;

  useEffect(() => {
    const load = async () => {
      if (!user) {
        const cleared = await checkAndClearGuestData();
        if (!cleared) {
          try {
            const tradesJson = await AsyncStorage.getItem(TRADES_KEY);
            if (tradesJson) setOpenTrades(JSON.parse(tradesJson));
            const strategiesJson = await AsyncStorage.getItem(STRATEGIES_KEY);
            if (strategiesJson) setSavedStrategies(JSON.parse(strategiesJson));
          } catch (e) {
            console.error("Failed to load local data:", e);
          }
        }
      } else {
        try {
          const tradesJson = await AsyncStorage.getItem(TRADES_KEY);
          if (tradesJson) setOpenTrades(JSON.parse(tradesJson));
        } catch (e) {
          console.error("Failed to load trades:", e);
        }
      }
      setIsLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (user) return;

    const handleAppState = (state: AppStateStatus) => {
      if (state === "active") {
        checkAndClearGuestData().then((cleared) => {
          if (cleared) {
            setSavedStrategies([]);
            setOpenTrades([]);
          }
        });
      }
    };

    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, [user]);

  const refreshStrategies = useCallback(async () => {
    if (!user) {
      const strategiesJson = await AsyncStorage.getItem(STRATEGIES_KEY);
      if (strategiesJson) setSavedStrategies(JSON.parse(strategiesJson));
      return;
    }
    try {
      const serverStrategies = await api.getStrategies();
      const mapped: SavedStrategy[] = serverStrategies.map((s) => ({
        id: String(s.id),
        name: s.name,
        ticker: s.ticker,
        spotPrice: s.spotPrice,
        legs: s.legs as SavedLeg[],
        createdAt: new Date(s.createdAt).getTime(),
        updatedAt: new Date(s.updatedAt).getTime(),
        serverId: s.id,
      }));
      setSavedStrategies(mapped);
    } catch {
      const strategiesJson = await AsyncStorage.getItem(STRATEGIES_KEY);
      if (strategiesJson) setSavedStrategies(JSON.parse(strategiesJson));
    }
  }, [user]);

  useEffect(() => {
    refreshStrategies();
  }, [user, refreshStrategies]);

  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    Analytics.track(AnalyticsEvents.AUTH_LOGIN_STARTED, { email_domain: email.split("@")[1] });
    const result = await authLogin(email, password);
    if (result.error) {
      Analytics.track(AnalyticsEvents.AUTH_LOGIN_FAILED, { error: result.error });
    } else {
      Analytics.track(AnalyticsEvents.AUTH_LOGIN_SUCCESS);
      await AsyncStorage.removeItem(GUEST_LAST_ACTIVE_KEY);
    }
    return result;
  }, [authLogin]);

  const register = useCallback(async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ): Promise<{ error?: string }> => {
    Analytics.track(AnalyticsEvents.AUTH_REGISTER_STARTED, { email_domain: email.split("@")[1] });
    const result = await authRegister(email, password, firstName, lastName);
    if (result.error) {
      Analytics.track(AnalyticsEvents.AUTH_REGISTER_FAILED, { error: result.error });
    } else {
      Analytics.track(AnalyticsEvents.AUTH_REGISTER_SUCCESS);
      await AsyncStorage.removeItem(GUEST_LAST_ACTIVE_KEY);
    }
    return result;
  }, [authRegister]);

  const logout = useCallback(async () => {
    Analytics.track(AnalyticsEvents.AUTH_LOGOUT);
    Analytics.reset();
    await authLogout();
    setSavedStrategies([]);
    setOpenTrades([]);
  }, [authLogout]);

  const persistTrades = useCallback(async (trades: OpenTrade[]) => {
    await AsyncStorage.setItem(TRADES_KEY, JSON.stringify(trades));
    setOpenTrades(trades);
    if (!user) await touchGuestActivity();
  }, [user]);

  const saveStrategy = useCallback(
    async (strategy: Omit<SavedStrategy, "id" | "createdAt" | "updatedAt">) => {
      if (user) {
        try {
          await api.saveServerStrategy({
            name: strategy.name,
            ticker: strategy.ticker,
            spotPrice: strategy.spotPrice,
            legs: strategy.legs,
          });
          await refreshStrategies();
          Analytics.track(AnalyticsEvents.BUILDER_STRATEGY_SAVED, {
            ticker: strategy.ticker,
            strategy_name: strategy.name,
            synced: true,
          });
          return;
        } catch {}
      }
      const newStrategy: SavedStrategy = {
        ...strategy,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updated = [...savedStrategies, newStrategy];
      await AsyncStorage.setItem(STRATEGIES_KEY, JSON.stringify(updated));
      setSavedStrategies(updated);
      if (!user) await touchGuestActivity();
      Analytics.track(AnalyticsEvents.BUILDER_STRATEGY_SAVED, {
        ticker: strategy.ticker,
        strategy_name: strategy.name,
        synced: false,
      });
    },
    [user, savedStrategies, refreshStrategies]
  );

  const updateStrategy = useCallback(
    async (id: string, updates: Partial<SavedStrategy>) => {
      const updated = savedStrategies.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
      );
      await AsyncStorage.setItem(STRATEGIES_KEY, JSON.stringify(updated));
      setSavedStrategies(updated);
      if (!user) await touchGuestActivity();
    },
    [savedStrategies, user]
  );

  const deleteStrategy = useCallback(
    async (id: string) => {
      const strategy = savedStrategies.find((s) => s.id === id);
      if (strategy?.serverId && user) {
        try { await api.deleteServerStrategy(strategy.serverId); } catch {}
      }
      const updated = savedStrategies.filter((s) => s.id !== id);
      await AsyncStorage.setItem(STRATEGIES_KEY, JSON.stringify(updated));
      setSavedStrategies(updated);
      Analytics.track(AnalyticsEvents.PORTFOLIO_STRATEGY_DELETED, {
        ticker: strategy?.ticker,
        strategy_name: strategy?.name,
      });
    },
    [savedStrategies, user]
  );

  const openTrade = useCallback(
    async (trade: Omit<OpenTrade, "id" | "status">) => {
      const newTrade: OpenTrade = {
        ...trade,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
        status: "open",
      };
      const updated = [...openTrades, newTrade];
      await persistTrades(updated);
      Analytics.track(AnalyticsEvents.BUILDER_TRADE_OPENED, {
        ticker: trade.ticker,
        strategy_name: trade.strategyName,
        entry_cost: trade.entryNetCost,
      });
    },
    [openTrades, persistTrades]
  );

  const updateTrade = useCallback(
    async (tradeId: string, updates: Partial<OpenTrade>) => {
      const updated = openTrades.map((t) =>
        t.id === tradeId ? { ...t, ...updates } : t
      );
      await persistTrades(updated);
      Analytics.track(AnalyticsEvents.TRADE_EDIT_SAVED, { trade_id: tradeId });
    },
    [openTrades, persistTrades]
  );

  const closeTrade = useCallback(
    async (tradeId: string, exitValue: number) => {
      const trade = openTrades.find((t) => t.id === tradeId);
      const updated = openTrades.map((t) => {
        if (t.id === tradeId) {
          const realizedPnL = exitValue - t.entryNetCost;
          return {
            ...t,
            status: "closed" as const,
            closedAt: Date.now(),
            exitValue,
            realizedPnL,
          };
        }
        return t;
      });
      await persistTrades(updated);
      Analytics.track(AnalyticsEvents.TRADE_CLOSE_LIVE, {
        ticker: trade?.ticker,
        realized_pnl: trade ? exitValue - trade.entryNetCost : 0,
      });
    },
    [openTrades, persistTrades]
  );

  const deleteTrade = useCallback(
    async (tradeId: string) => {
      const trade = openTrades.find((t) => t.id === tradeId);
      const updated = openTrades.filter((t) => t.id !== tradeId);
      await persistTrades(updated);
      Analytics.track(AnalyticsEvents.TRADE_DELETED, {
        ticker: trade?.ticker,
        status: trade?.status,
      });
    },
    [openTrades, persistTrades]
  );

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthLoading,
        login,
        register,
        logout,
        savedStrategies,
        openTrades,
        saveStrategy,
        updateStrategy,
        deleteStrategy,
        openTrade,
        updateTrade,
        closeTrade,
        deleteTrade,
        refreshStrategies,
        isLoaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
