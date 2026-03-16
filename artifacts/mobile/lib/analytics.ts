import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const SESSION_KEY = "optionviz_analytics_session";
const USER_PROPS_KEY = "optionviz_analytics_user_props";
const QUEUE_KEY = "optionviz_analytics_queue";
const FLUSH_INTERVAL = 10000;
const MAX_QUEUE_SIZE = 100;

type AnalyticsProvider = {
  name: string;
  init: (config: Record<string, string>) => void;
  track: (event: string, properties: Record<string, any>) => void;
  identify: (userId: string, traits: Record<string, any>) => void;
  page: (name: string, properties: Record<string, any>) => void;
  flush: () => void;
};

interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  sessionId: string;
}

let providers: AnalyticsProvider[] = [];
let sessionId: string = "";
let userId: string | null = null;
let userTraits: Record<string, any> = {};
let eventQueue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let initialized = false;

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

function getCommonProperties(): Record<string, any> {
  return {
    platform: Platform.OS,
    app_version: "1.0.0",
    session_id: sessionId,
    timestamp: Date.now(),
    ...(userId ? { user_id: userId } : {}),
  };
}

const googleAnalyticsProvider: AnalyticsProvider = {
  name: "google_analytics",
  init: (config) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const measurementId = config.GA_MEASUREMENT_ID;
      if (!measurementId) return;
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(arguments);
      }
      (window as any).gtag = gtag;
      gtag("js", new Date());
      gtag("config", measurementId, { send_page_view: false });
    }
  },
  track: (event, properties) => {
    if (Platform.OS === "web" && (window as any).gtag) {
      (window as any).gtag("event", event, properties);
    }
  },
  identify: (uid, traits) => {
    if (Platform.OS === "web" && (window as any).gtag) {
      (window as any).gtag("set", { user_id: uid, ...traits });
    }
  },
  page: (name, properties) => {
    if (Platform.OS === "web" && (window as any).gtag) {
      (window as any).gtag("event", "page_view", { page_title: name, ...properties });
    }
  },
  flush: () => {},
};

const amplitudeProvider: AnalyticsProvider = {
  name: "amplitude",
  init: (config) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const apiKey = config.AMPLITUDE_API_KEY;
      if (!apiKey) return;
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://cdn.amplitude.com/libs/analytics-browser-2.11.1-min.js.gz";
      script.onload = () => {
        if ((window as any).amplitude) {
          (window as any).amplitude.init(apiKey, { autocapture: true });
        }
      };
      document.head.appendChild(script);
    }
  },
  track: (event, properties) => {
    if (Platform.OS === "web" && (window as any).amplitude) {
      (window as any).amplitude.track(event, properties);
    }
  },
  identify: (uid, traits) => {
    if (Platform.OS === "web" && (window as any).amplitude) {
      (window as any).amplitude.setUserId(uid);
      const identifyObj = new ((window as any).amplitude.Identify)();
      Object.entries(traits).forEach(([k, v]) => identifyObj.set(k, v));
      (window as any).amplitude.identify(identifyObj);
    }
  },
  page: (name, properties) => {
    if (Platform.OS === "web" && (window as any).amplitude) {
      (window as any).amplitude.track("Page Viewed", { page_name: name, ...properties });
    }
  },
  flush: () => {
    if (Platform.OS === "web" && (window as any).amplitude) {
      (window as any).amplitude.flush();
    }
  },
};

const localStorageProvider: AnalyticsProvider = {
  name: "local_debug",
  init: () => {},
  track: (event, properties) => {
    if (__DEV__) {
      console.log(`[Analytics] ${event}`, properties);
    }
  },
  identify: (uid, traits) => {
    if (__DEV__) {
      console.log(`[Analytics] Identify: ${uid}`, traits);
    }
  },
  page: (name, properties) => {
    if (__DEV__) {
      console.log(`[Analytics] Page: ${name}`, properties);
    }
  },
  flush: () => {},
};

async function persistQueue() {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(eventQueue.slice(-MAX_QUEUE_SIZE)));
  } catch {}
}

async function loadQueue() {
  try {
    const stored = await AsyncStorage.getItem(QUEUE_KEY);
    if (stored) eventQueue = JSON.parse(stored);
  } catch {}
}

export const Analytics = {
  init: async (config: Record<string, string> = {}) => {
    if (initialized) return;
    initialized = true;

    sessionId = generateSessionId();
    await loadQueue();

    providers = [localStorageProvider];

    if (config.GA_MEASUREMENT_ID) {
      providers.push(googleAnalyticsProvider);
    }
    if (config.AMPLITUDE_API_KEY) {
      providers.push(amplitudeProvider);
    }

    providers.forEach((p) => p.init(config));

    flushTimer = setInterval(() => {
      Analytics.flush();
    }, FLUSH_INTERVAL);
  },

  identify: (uid: string, traits: Record<string, any> = {}) => {
    userId = uid;
    userTraits = { ...userTraits, ...traits };
    providers.forEach((p) => p.identify(uid, traits));
    AsyncStorage.setItem(USER_PROPS_KEY, JSON.stringify({ userId: uid, traits })).catch(() => {});
  },

  reset: () => {
    userId = null;
    userTraits = {};
    sessionId = generateSessionId();
    AsyncStorage.removeItem(USER_PROPS_KEY).catch(() => {});
  },

  track: (event: string, properties: Record<string, any> = {}) => {
    const fullProps = { ...getCommonProperties(), ...properties };
    providers.forEach((p) => p.track(event, fullProps));
    eventQueue.push({ event, properties: fullProps, timestamp: Date.now(), sessionId });
    if (eventQueue.length > MAX_QUEUE_SIZE) {
      eventQueue = eventQueue.slice(-MAX_QUEUE_SIZE);
    }
    persistQueue();
  },

  page: (name: string, properties: Record<string, any> = {}) => {
    const fullProps = { ...getCommonProperties(), ...properties };
    providers.forEach((p) => p.page(name, fullProps));
    Analytics.track("screen_view", { screen_name: name, ...properties });
  },

  flush: () => {
    providers.forEach((p) => p.flush());
  },

  shutdown: () => {
    if (flushTimer) clearInterval(flushTimer);
    Analytics.flush();
  },

  getEventLog: () => [...eventQueue],

  registerProvider: (provider: AnalyticsProvider) => {
    providers.push(provider);
    if (initialized) {
      provider.init({});
    }
  },
};

export const AnalyticsEvents = {
  AUTH_SCREEN_VIEWED: "auth_screen_viewed",
  AUTH_LOGIN_STARTED: "auth_login_started",
  AUTH_LOGIN_SUCCESS: "auth_login_success",
  AUTH_LOGIN_FAILED: "auth_login_failed",
  AUTH_REGISTER_STARTED: "auth_register_started",
  AUTH_REGISTER_SUCCESS: "auth_register_success",
  AUTH_REGISTER_FAILED: "auth_register_failed",
  AUTH_GUEST_MODE: "auth_guest_mode_entered",
  AUTH_LOGOUT: "auth_logout",

  BUILDER_TICKER_SEARCHED: "builder_ticker_searched",
  BUILDER_TICKER_QUICK_SELECT: "builder_ticker_quick_select",
  BUILDER_STRATEGY_SELECTED: "builder_strategy_selected",
  BUILDER_CUSTOM_STRATEGY: "builder_custom_strategy_started",
  BUILDER_LEG_ADDED: "builder_leg_added",
  BUILDER_LEG_REMOVED: "builder_leg_removed",
  BUILDER_LEG_QTY_CHANGED: "builder_leg_qty_changed",
  BUILDER_EXPIRATION_SELECTED: "builder_expiration_selected",
  BUILDER_ANALYZE_STARTED: "builder_analyze_started",
  BUILDER_ANALYZE_COMPLETE: "builder_analyze_complete",
  BUILDER_STRATEGY_SAVED: "builder_strategy_saved",
  BUILDER_TRADE_OPENED: "builder_trade_opened",
  BUILDER_RESET: "builder_reset",

  MARKET_TAB_CHANGED: "market_tab_changed",
  MARKET_TICKER_SEARCHED: "market_ticker_searched",
  MARKET_QUOTE_VIEWED: "market_quote_viewed",
  MARKET_CHAIN_VIEWED: "market_chain_viewed",
  MARKET_EXPIRATION_SELECTED: "market_expiration_selected",
  MARKET_FLOW_VIEWED: "market_flow_viewed",

  PORTFOLIO_TAB_CHANGED: "portfolio_tab_changed",
  PORTFOLIO_TIMEFRAME_CHANGED: "portfolio_timeframe_changed",
  PORTFOLIO_STRATEGY_EXPANDED: "portfolio_strategy_expanded",
  PORTFOLIO_STRATEGY_DELETED: "portfolio_strategy_deleted",
  PORTFOLIO_STRATEGY_TO_TRADE: "portfolio_strategy_opened_as_trade",

  TRADE_CARD_EXPANDED: "trade_card_expanded",
  TRADE_EDIT_OPENED: "trade_edit_opened",
  TRADE_EDIT_QTY_CHANGED: "trade_edit_qty_changed",
  TRADE_EDIT_SAVED: "trade_edit_saved",
  TRADE_CLOSE_LIVE: "trade_closed_at_live",
  TRADE_CLOSE_MANUAL: "trade_closed_manual",
  TRADE_DELETED: "trade_deleted",

  PERFORMANCE_VIEWED: "performance_viewed",
  PERFORMANCE_PDF_EXPORTED: "performance_pdf_exported",

  TAB_NAVIGATED: "tab_navigated",
  PROFILE_MENU_OPENED: "profile_menu_opened",
  PROFILE_MENU_LOGIN_TAPPED: "profile_menu_login_tapped",

  GUEST_SESSION_EXPIRED: "guest_session_expired",
  GUEST_SESSION_STARTED: "guest_session_started",

  APP_OPENED: "app_opened",
  APP_BACKGROUNDED: "app_backgrounded",
} as const;
