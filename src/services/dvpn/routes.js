const API_BASE = process.env.REACT_APP_VPN_NODE_URL || "https://api.ticsdvpn.com";

export const dvpnRoutes = {
  auth: {
    login: "/api/user/login",
    refresh: "/api/user/refresh",
    logout: "/api/user/logout",
  },
  data: {
    providers: "/api/provider",
    countries: "/providers/:providerId/countries",
    cities: "/providers/:providerId/countries/:countryId/cities",
    recentProviders: "/api/provider/recent",
    recentSessions: "/api/user-sessions",
    subscriptions: "/api/subscription",
    subscriptionRenew: "/api/subscription/renew",
    randomNode: "/api/nodes/random",
    nodes: "/api/nodes",
    plans: "/api/plans",
    plansVerify: "/api/plans/id",
    history: "/history",
    topup: "/topup",
  },
  session: {
    purchase: "/purchase",
    connect: "/session/connect",
    disconnect: "/session/disconnect",
  },
};

export const buildDvpnUrl = (path) => {
  if (!API_BASE) {
    throw new Error("REACT_APP_VPN_NODE_URL is not configured");
  }
  return `${API_BASE}${path}`;
};

export const withParams = (template, params = {}) => {
  return Object.keys(params).reduce((acc, key) => {
    return acc.replace(`:${key}`, encodeURIComponent(params[key]));
  }, template);
};
