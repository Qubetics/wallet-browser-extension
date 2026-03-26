import React, { useEffect, useMemo, useState } from "react";
import "./RecentSessions.scss";
import MenuRestofHeaders from "../BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import USA from "../../Assets/cuntry/usa.svg";
import { useNavigate } from "react-router-dom";
import useCurrentHeight from "../../CustomHooks/useCurrentHeight";
import { Skeleton, message } from "antd";
import {
  getActiveWalletAddress,
  getRenewPlanList,
  getSessionTxnHistory,
  getUserSessions,
  getUserSubscriptions,
} from "../../services/dvpn";
import { getDurationLabel } from "../../helpers/dvpn.helpers";
import CopyIcon from "../../Assets/CopyIcon.svg";

const HISTORY_TABS = [
  { key: "sessions", label: "Sessions" },
  { key: "plans", label: "Plans" },
  { key: "renew", label: "Renew" },
  { key: "txn", label: "Txn" },
];

const PAGE_LIMIT = 10;
const HISTORY_SKELETON_COUNT = 4;

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.sessions)) return value.sessions;
  if (Array.isArray(value?.subscriptions)) return value.subscriptions;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.list)) return value.list;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.history)) return value.history;
  return [];
};
const getData = (payload) => payload?.data || payload || {};
const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString();
};
const formatPrettyDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  const month = date.toLocaleString("en-US", { month: "long" });
  const day = date.toLocaleString("en-US", { day: "2-digit" });
  const year = date.getFullYear();
  let hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, "0");
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${month} ${day}, ${year} ${hour}.${minute} ${ampm}`;
};
const getPlanStatusLabel = (plan) => {
  const status = String(plan?.status || "").toLowerCase();
  const inactiveAt = new Date(plan?.inactive_at || plan?.end_at || 0).getTime();
  if (!Number.isFinite(inactiveAt)) return plan?.status || "-";
  const now = Date.now();
  if (status === "active" && inactiveAt > now) {
    const daysLeft = Math.max(1, Math.ceil((inactiveAt - now) / (24 * 60 * 60 * 1000)));
    return `${daysLeft} day${daysLeft > 1 ? "s" : ""} left`;
  }
  return "Expired";
};
const getPlanProviderName = (plan) =>
  // plan?.plans?.providers?.name ||
  // plan?.provider_name ||
  plan?.plans?.provider_address ||
  // plan?.provider_address ||
  "-";

const shortenMiddle = (value, start = 10, end = 8) => {
  const text = String(value || "");
  if (!text) return "-";
  if (text.length <= start + end + 3) return text;
  return `${text.slice(0, start)}...${text.slice(-end)}`;
};
// Local getDurationLabel removed in favor of shared helper in dvpn.helpers.js
const shortenHash = (value) => {
  const hash = String(value || "");
  if (!hash) return "-";
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}....${hash.slice(-6)}`;
};
const getTxnEventLabel = (txn) => {
  const event = String(txn?.event || txn?.action || txn?.type || "").toLowerCase();
  if (event.includes("createsession")) return "Start Session";
  if (event.includes("updatestatus")) return "End Session";
  return txn?.action || txn?.type || "Session";
};
const getTxnStatusLabel = (txn) => {
  const status = String(txn?.status || txn?.state || "").toLowerCase();
  if (status.includes("fail")) return "Failed";
  return "Success";
};

function RecentSessions() {
  const height = useCurrentHeight();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("sessions");
  const [walletAddress, setWalletAddress] = useState("");
  const [sessions, setSessions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [renewPlans, setRenewPlans] = useState([]);
  const [txns, setTxns] = useState([]);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [plansPage, setPlansPage] = useState(1);
  const [renewPage, setRenewPage] = useState(1);
  const [txnPage, setTxnPage] = useState(1);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);
  const [renewLoading, setRenewLoading] = useState(false);
  const [txnLoading, setTxnLoading] = useState(false);
  const [sessionsHasMore, setSessionsHasMore] = useState(true);
  const [plansHasMore, setPlansHasMore] = useState(true);
  const [renewHasMore, setRenewHasMore] = useState(true);
  const [txnHasMore, setTxnHasMore] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();

  const loadSessions = async ({ page = 1, replace = false, wallet = walletAddress } = {}) => {
    if (!wallet || sessionsLoading) return;
    if (!replace && !sessionsHasMore) return;
    try {
      setSessionsLoading(true);
      const payload = await getUserSessions(wallet, { limit: PAGE_LIMIT, page, order: "DEC" });
      const list = asArray(getData(payload));
      setSessions((prev) => (replace ? list : [...prev, ...list]));
      setSessionsPage(page);
      setSessionsHasMore(list.length >= PAGE_LIMIT);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadPlans = async ({ page = 1, replace = false, wallet = walletAddress } = {}) => {
    if (!wallet || plansLoading) return;
    if (!replace && !plansHasMore) return;
    try {
      setPlansLoading(true);
      const payload = await getUserSubscriptions(wallet, {
        limit: PAGE_LIMIT,
        page,
        order: "DESC",
      });
      const list = asArray(getData(payload));
      setPlans((prev) => (replace ? list : [...prev, ...list]));
      setPlansPage(page);
      setPlansHasMore(list.length >= PAGE_LIMIT);
    } finally {
      setPlansLoading(false);
    }
  };

  const loadRenew = async ({ page = 1, replace = false, wallet = walletAddress } = {}) => {
    if (!wallet || renewLoading) return;
    if (!replace && !renewHasMore) return;
    try {
      setRenewLoading(true);
      const payload = await getRenewPlanList(wallet, { limit: PAGE_LIMIT, page });
      const list = asArray(getData(payload));
      setRenewPlans((prev) => (replace ? list : [...prev, ...list]));
      setRenewPage(page);
      setRenewHasMore(list.length >= PAGE_LIMIT);
    } finally {
      setRenewLoading(false);
    }
  };

  const loadTxn = async ({ page = 1, replace = false, wallet = walletAddress } = {}) => {
    if (!wallet || txnLoading) return;
    if (!replace && !txnHasMore) return;
    try {
      setTxnLoading(true);
      const payload = await getSessionTxnHistory(wallet, { limit: PAGE_LIMIT, page });
      const list = asArray(getData(payload));
      setTxns((prev) => (replace ? list : [...prev, ...list]));
      setTxnPage(page);
      setTxnHasMore(list.length >= PAGE_LIMIT);
    } finally {
      setTxnLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const wallet = await getActiveWalletAddress();
      if (cancelled || !wallet) return;
      setWalletAddress(wallet);
      // Initial behavior: fetch plans + sessions on page load.
      await Promise.all([
        loadPlans({ page: 1, replace: true, wallet }),
        loadSessions({ page: 1, replace: true, wallet }),
      ]);
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!walletAddress) return;
    if (activeTab === "renew" && renewPlans.length === 0) {
      loadRenew({ page: 1, replace: true });
    }
    if (activeTab === "txn" && txns.length === 0) {
      loadTxn({ page: 1, replace: true });
    }
  }, [activeTab, walletAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleListScroll = (e) => {
    const target = e.currentTarget;
    if (!target) return;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 24;
    if (!nearBottom) return;

    if (activeTab === "sessions") loadSessions({ page: sessionsPage + 1 });
    if (activeTab === "plans") loadPlans({ page: plansPage + 1 });
    if (activeTab === "renew") loadRenew({ page: renewPage + 1 });
    if (activeTab === "txn") loadTxn({ page: txnPage + 1 });
  };

  const handleCopy = async (value, label = "Value") => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      messageApi.success(`${label} copied successfully.`);
    } catch (error) {
      messageApi.error(`Failed to copy ${label.toLowerCase()}.`);
    }
  };

  const isCurrentTabLoading = useMemo(() => {
    if (activeTab === "sessions") return sessionsLoading;
    if (activeTab === "plans") return plansLoading;
    if (activeTab === "renew") return renewLoading;
    return txnLoading;
  }, [activeTab, plansLoading, renewLoading, sessionsLoading, txnLoading]);

  return (
    <div className={`scrollableCont`} style={{ height: "auto" }}>
      {contextHolder}
      <MenuRestofHeaders title={"History"} backTo={"/dvpn"} />
      <div className={`${"session-wrapper"} ${height <= 600 ? "heightExtSessionWrapper" : ""}`}>
        <div className="dvpn-tabs">
          {HISTORY_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`dvpn-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "sessions" && (
          <div className="history-list" onScroll={handleListScroll}>
            {sessions.map((session, idx) => (
              <div key={`session-${idx}`} className="history-card session-card">
                <div className="left">
                  <img src={session?.nodes?.flag_url || USA} alt="session flag" className="flag-icon" />
                  <div className="meta">
                    <h4>{[session?.nodes?.country, session?.nodes?.city].filter(Boolean).join(" - ") || "Session"}</h4>
                    <p>{formatDateTime(session?.start_at)}</p>
                  </div>
                </div>
                <span className="right-text">{getDurationLabel(session)}</span>
              </div>
            ))}
            {!isCurrentTabLoading && sessions.length === 0 && (
              <div className="history-card session-card empty-state-card">
                <div className="meta">
                  <h4>No sessions found</h4>
                  <p>Your dVPN sessions will appear here once you start using the service.</p>
                </div>
              </div>
            )}
            {isCurrentTabLoading &&
              Array.from({ length: HISTORY_SKELETON_COUNT }).map((_, index) => (
                <div className="history-card session-card" key={`session-skeleton-${index}`}>
                  <Skeleton className="dvpn-skeleton-wave" active paragraph={{ rows: 2 }} title={false} />
                </div>
              ))}
          </div>
        )}

        {activeTab === "plans" && (
          <div className="history-list" onScroll={handleListScroll}>
            {plans.map((plan, idx) => (
              <div key={`plan-${idx}`} className="history-card plan-card">
                <div className="meta">
                  <h5 title={getPlanProviderName(plan)}>
                    {shortenMiddle(getPlanProviderName(plan))}
                  </h5>
                  <h3>{`${Number(plan?.price?.base_value || 0).toLocaleString()} ${String(plan?.price?.denom || "TICS").toUpperCase()}`}</h3>
                  <p>{formatPrettyDateTime(plan?.inactive_at || plan?.start_at)}</p>
                </div>
                <span className="status-expired">{getPlanStatusLabel(plan)}</span>
              </div>
            ))}
            {!isCurrentTabLoading && plans.length === 0 && (
              <div className="history-card plan-card empty-state-card">
                <div className="meta">
                  <h4>No plans found</h4>
                  <p>Purchased plans will appear here after you buy a subscription.</p>
                </div>
              </div>
            )}
            {isCurrentTabLoading &&
              Array.from({ length: HISTORY_SKELETON_COUNT }).map((_, index) => (
                <div className="history-card plan-card" key={`plan-skeleton-${index}`}>
                  <Skeleton className="dvpn-skeleton-wave" active paragraph={{ rows: 2 }} title={false} />
                </div>
              ))}
          </div>
        )}

        {activeTab === "renew" && (
          <div className="history-list" onScroll={handleListScroll}>
            {renewPlans.map((plan, idx) => (
              <div key={`renew-${idx}`} className="history-card plan-card">
                <div className="meta">
                  <h4 title={getPlanProviderName(plan)}>
                    {shortenMiddle(getPlanProviderName(plan))}
                  </h4>
                  <h3>{`${Number(plan?.price?.base_value || 0).toLocaleString()} ${String(plan?.price?.denom || "TICS").toUpperCase()}`}</h3>
                  <p>{formatPrettyDateTime(plan?.inactive_at || plan?.start_at)}</p>
                </div>
                <span className="status-expired">{getPlanStatusLabel(plan)}</span>
                <button
                  className="renew-btn"
                  onClick={() =>
                    navigate("/accountTopUp", {
                      state: {
                        providerAddress:
                          plan?.plans?.provider_address || plan?.provider_address || "",
                      },
                    })
                  }
                >
                  Renew
                </button>
              </div>
            ))}
            {!isCurrentTabLoading && renewPlans.length === 0 && (
              <div className="history-card plan-card empty-state-card">
                <div className="meta">
                  <h4>No plan to renew</h4>
                  <p>Once you have an eligible subscription, it will appear here.</p>
                </div>
              </div>
            )}
            {isCurrentTabLoading &&
              Array.from({ length: HISTORY_SKELETON_COUNT }).map((_, index) => (
                <div className="history-card plan-card" key={`renew-skeleton-${index}`}>
                  <Skeleton className="dvpn-skeleton-wave" active paragraph={{ rows: 2 }} title={false} />
                </div>
              ))}
          </div>
        )}

        {activeTab === "txn" && (
          <div className="history-list" onScroll={handleListScroll}>
            {txns.map((txn, idx) => (
              <div key={`txn-${idx}`} className="history-card txn-card">
                <div className="meta">
                  <h4>
                    <span className="tx-hash">
                      {shortenHash(txn?.tx_hash || txn?.hash || txn?.txn_hash || "-")}
                    </span>
                    <button
                      className="copy-btn"
                      onClick={() =>
                        handleCopy(txn?.tx_hash || txn?.hash || txn?.txn_hash || "", "Transaction hash")
                      }
                    >
                    <img src={CopyIcon} alt="copy" width={16} height={16} />
                    </button>
                  </h4>
                  <h5>{getTxnEventLabel(txn)}</h5>
                  <p className="status-success">{getTxnStatusLabel(txn)}</p>
                </div>
              </div>
            ))}
            {!isCurrentTabLoading && txns.length === 0 && (
              <div className="history-card txn-card empty-state-card">
                <div className="meta">
                  <h4>No transactions found</h4>
                  <p>Transaction history will appear here after your first session activity.</p>
                </div>
              </div>
            )}
            {isCurrentTabLoading &&
              Array.from({ length: HISTORY_SKELETON_COUNT }).map((_, index) => (
                <div className="history-card txn-card" key={`txn-skeleton-${index}`}>
                  <Skeleton className="dvpn-skeleton-wave" active paragraph={{ rows: 2 }} title={false} />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentSessions;
