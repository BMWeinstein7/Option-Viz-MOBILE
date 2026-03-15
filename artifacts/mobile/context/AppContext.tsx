import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, AuthUser, ServerStrategy } from "@/hooks/useApi";

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
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>([]);
  const [openTrades, setOpenTrades] = useState<OpenTrade[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const meData = await api.getMe();
        if (meData.authenticated && meData.id && meData.username) {
          setUser({ id: meData.id, username: meData.username });
        }
      } catch {}
      setIsAuthLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const tradesJson = await AsyncStorage.getItem(TRADES_KEY);
        if (tradesJson) setOpenTrades(JSON.parse(tradesJson));
      } catch (e) {
        console.error("Failed to load trades:", e);
      }
      setIsLoaded(true);
    };
    load();
  }, []);

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

  const login = useCallback(async (username: string, password: string) => {
    const u = await api.login(username, password);
    setUser(u);
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const u = await api.register(username, password);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch {}
    setUser(null);
    setSavedStrategies([]);
  }, []);

  const persistTrades = useCallback(async (trades: OpenTrade[]) => {
    await AsyncStorage.setItem(TRADES_KEY, JSON.stringify(trades));
    setOpenTrades(trades);
  }, []);

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
    },
    [savedStrategies]
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
    },
    [openTrades, persistTrades]
  );

  const updateTrade = useCallback(
    async (tradeId: string, updates: Partial<OpenTrade>) => {
      const updated = openTrades.map((t) =>
        t.id === tradeId ? { ...t, ...updates } : t
      );
      await persistTrades(updated);
    },
    [openTrades, persistTrades]
  );

  const closeTrade = useCallback(
    async (tradeId: string, exitValue: number) => {
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
    },
    [openTrades, persistTrades]
  );

  const deleteTrade = useCallback(
    async (tradeId: string) => {
      const updated = openTrades.filter((t) => t.id !== tradeId);
      await persistTrades(updated);
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
