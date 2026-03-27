import React, { useEffect, useMemo, useState } from "react";
import MenuRestofHeaders from "../BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { InputField } from "../InputField/InputFieldSimple";
import Search from "../../Assets/SearchIcon.svg";
import "./Servers.scss";
import { useLocation } from "react-router-dom";
import ModalCustom from "../ModalCustom/ModalCustom";
import InputFieldSimple from "../InputField/InputFieldSimple";
import ButtonComp from "../ButtonComp/ButtonComp";
import { WalletHelper } from "../../helpers/wallet.helper";
import {
  connectVpnWithWireguardConfig,
  disconnectVpn,
  ensureDvpnLogin,
  findRunningAgent,
  getActiveWalletAddress,
  getAgentStatus,
  getNodes,
  getUserSubscriptions,
  getWalletDvpnState,
  startAgentTunnel,
  stopAgentTunnel,
} from "../../services/dvpn";
import { Skeleton, message } from "antd";
import { detectOS } from "../../helpers/dvpn.helpers";
import DvpnLoader from "../../Assets/JsonFiles/DvpnLoader";

const shortenText = (value, start = 14, end = 10) => {
  const text = String(value || "");
  if (!text) return "Node";
  if (text.length <= start + end + 3) return text;
  return `${text.slice(0, start)}...${text.slice(-end)}`;
};

const toNodeItems = (payload, activeNodeAddress = "") => {
  const data = payload?.data || payload || {};
  const nodesRaw = Array.isArray(data?.nodes)
    ? data.nodes
    : Array.isArray(data)
      ? data
      : [];
  return nodesRaw.map((item) => ({
    id: item?.id || item?.address || item?.remote_url,
    name: shortenText(item?.name || item?.node_name || item?.address || "Node"),
    location: "",
    status: String(item?.address || "") === String(activeNodeAddress || "") ? "Connected" : "Connect",
    raw: item,
  }));
};

function ServersNodes() {
  const location = useLocation();
  const selectedCountry = location?.state?.country || "Selected Country";
  const selectedCity = location?.state?.city || "Selected City";
  const fallbackPlanId = sessionStorage.getItem("dvpn_selected_plan_id") || "";
  const planId = location?.state?.planId || fallbackPlanId;
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");
  const [connectingNodeId, setConnectingNodeId] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const [sessionPassword, setSessionPassword] = useState("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [pendingServer, setPendingServer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [agentBaseUrl, setAgentBaseUrl] = useState("");
  const [detectedOS, setDetectedOS] = useState("unknown");
  const [agentReachable, setAgentReachable] = useState(null);
  const [isConnectionLoading, setIsConnectionLoading] = useState(false);

  const logFlow = () => { };

  useEffect(() => {
    let cancelled = false;
    const loadNodes = async () => {
      try {
        setLoading(true);
        const activeWallet = await getActiveWalletAddress();
        setWalletAddress(activeWallet);
        const walletState = (await getWalletDvpnState(activeWallet)) || {};
        const runtime = walletState?.sessionRuntime || {};
        const activeNodeAddress =
          String(runtime?.status || "").toLowerCase() === "connected"
            ? runtime?.activeNode?.address || ""
            : "";
        // As required by flow: check subscriptions again on final node screen.
        await getUserSubscriptions(activeWallet, { limit: 5, order: "DESC" });
        const payload = await getNodes(activeWallet, {
          limit: 10,
          page: 1,
          order: "ASC",
          reverse: false,
          plan_id: planId,
          country: selectedCountry,
          city: selectedCity,
          protocol: "wireguard",
        });
        if (cancelled) return;
        setServers(toNodeItems(payload, activeNodeAddress));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadNodes();
    return () => {
      cancelled = true;
    };
  }, [planId, selectedCountry, selectedCity]);
  // ----------------- added code --------------
  const checkAgentHealth = async () => {
    const result = await findRunningAgent();
    if (result?.reachable && result?.baseUrl) {
      setAgentBaseUrl(result.baseUrl);
      return true;
    }
    setAgentBaseUrl("");
    return false;
  };

  useEffect(() => {
    setDetectedOS(detectOS());
    checkAgentHealth().then(setAgentReachable);
  }, []);

  useEffect(() => {
    if (agentReachable !== false) return undefined;
    const poll = setInterval(async () => {
      const isUp = await checkAgentHealth();
      if (isUp) {
        setAgentReachable(true);
        clearInterval(poll);
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [agentReachable]);

  useEffect(() => {
    if (agentReachable !== true || !agentBaseUrl) return undefined;
    let cancelled = false;

    const syncTunnelStatus = async () => {
      try {
        const status = await getAgentStatus(agentBaseUrl);
        if (cancelled) return;
        const isRunning = !!status?.is_running;

        const walletState = (await getWalletDvpnState(walletAddress)) || {};
        const runtime = walletState?.sessionRuntime || {};
        const activeNodeAddress =
          isRunning && String(runtime?.status || "").toLowerCase() === "connected"
            ? runtime?.activeNode?.address || ""
            : "";

        setServers((prev) =>
          prev.map((server) => ({
            ...server,
            status: String(server?.raw?.address || "") === String(activeNodeAddress || "") ? "Connected" : "Connect",
          }))
        );
      } catch (error) {
        // Silently handle poll errors
      }
    };

    syncTunnelStatus();
    const poll = setInterval(syncTunnelStatus, 15000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [agentReachable, agentBaseUrl, walletAddress]);

  const filteredServers = useMemo(() => {
    const q = String(searchTerm || "").trim().toLowerCase();
    if (!q) return servers;
    return servers.filter((server) => {
      const name = String(server?.name || "").toLowerCase();
      const addr = String(server?.raw?.address || server?.raw?.node_address || server?.raw?.remote_url || "").toLowerCase();
      return name.includes(q) || addr.includes(q);
    });
  }, [servers, searchTerm]);

  const startNodeSession = async (server, providedPassword = "") => {
    if (!walletAddress || !server?.raw) return;
    try {
      setConnectingNodeId(server.id);
      setIsConnectionLoading(true);
      logFlow("ui.server_connect.start", {
        walletAddress,
        nodeId: server?.raw?.id || "",
        nodeAddress: server?.raw?.address || "",
        providerUrl: server?.raw?.url || server?.raw?.remote_url || "",
      });
      const result = await connectVpnWithWireguardConfig({
        walletAddress,
        serverId: server?.raw?.id || server?.raw?.address || "",
        countryId: server?.raw?.country || selectedCountry,
        cityId: server?.raw?.city || selectedCity,
        runtimeConfigOptions: {
          planId,
          subscriptionId:
            server?.raw?.subscriptions?.id ||
            server?.raw?.subscription_id ||
            server?.raw?.subscriptionId ||
            "",
          ...(providedPassword ? { sessionPassword: providedPassword } : {}),
          selectedNode: server.raw,
          providerUrl:
            server?.raw?.url || server?.raw?.remote_url || server?.raw?.node_url || "",
          nodeAddress: server?.raw?.node_address || server?.raw?.address || "",
        },
      });

      const wireguardConfig = result?.wireguardConfig || result?.runtime?.config || "";
      if (!wireguardConfig) {
        throw new Error("Missing WireGuard tunnel config");
      }

      const effectiveAgentBaseUrl =
        agentBaseUrl || (await findRunningAgent()).baseUrl || "";
      if (!effectiveAgentBaseUrl) {
        throw new Error("Local wg-agent is not reachable");
      }
      if (!agentBaseUrl) {
        setAgentBaseUrl(effectiveAgentBaseUrl);
      }

      await startAgentTunnel({
        baseUrl: effectiveAgentBaseUrl,
        config: wireguardConfig,
      });

      const tunnelStatus = await getAgentStatus(effectiveAgentBaseUrl);
      const isRunning = !!tunnelStatus?.is_running;

      setServers((prev) =>
        prev.map((item) => ({
          ...item,
          status: item.id === server.id ? (isRunning ? "Connected" : "Connect") : "Connect",
        }))
      );
      logFlow("ui.server_connect.success", {
        walletAddress,
        nodeId: server?.raw?.id || "",
      });
      messageApi.success("dVPN session started.");
    } catch (error) {
      logFlow("ui.server_connect.error", {
        walletAddress,
        nodeId: server?.raw?.id || "",
        code: error?.code || "UNKNOWN",
        message: error?.message || "Failed",
      });
      const msg = String(error?.message || "").toLowerCase();
      if (
        msg.includes("please enter password") ||
        msg.includes("unable to unlock wallet") ||
        msg.includes("invalid credentials") ||
        msg.includes("wallet/password")
      ) {
        setPendingServer(server);
        setIsPasswordModalOpen(true);
      }
      // Service layer already reports error details.
    } finally {
      setConnectingNodeId("");
      setIsConnectionLoading(false);
    }
  };

  const stopNodeSession = async (server, providedPassword = "") => {
    if (!walletAddress || !server?.raw) return;
    try {
      setConnectingNodeId(server.id);
      setIsConnectionLoading(true);
      const walletState = (await getWalletDvpnState(walletAddress)) || {};
      const runtime = walletState?.sessionRuntime || {};
      const sessionId = Number(runtime?.sessionId || runtime?.lastSessionId || 0);

      logFlow("ui.server_disconnect.start", {
        walletAddress,
        sessionId,
      });

      if (sessionId > 0) {
        await disconnectVpn({
          walletAddress,
          sessionId,
          sessionPassword: providedPassword || sessionPassword,
        });
      }

      const effectiveAgentBaseUrl =
        agentBaseUrl || (await findRunningAgent()).baseUrl || "";
      if (effectiveAgentBaseUrl) {
        await stopAgentTunnel(effectiveAgentBaseUrl);
      }

      setServers((prev) =>
        prev.map((item) => ({
          ...item,
          status: "Connect",
        }))
      );
      logFlow("ui.server_disconnect.success", {
        walletAddress,
        sessionId,
      });
      messageApi.success("dVPN session stopped.");
    } catch (error) {
      logFlow("ui.server_disconnect.error", {
        walletAddress,
        message: error?.message || "Failed",
      });
      const msg = String(error?.message || "").toLowerCase();
      if (
        msg.includes("please enter password") ||
        msg.includes("unable to unlock wallet") ||
        msg.includes("invalid credentials") ||
        msg.includes("wallet/password")
      ) {
        setPendingServer(server);
        setIsPasswordModalOpen(true);
      }
    } finally {
      setConnectingNodeId("");
      setIsConnectionLoading(false);
    }
  };

  const handleConnectToggle = async (server) => {
    if (server.status === "Connected") {
      await stopNodeSession(server);
    } else {
      await startNodeSession(server);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!sessionPassword) {
      return messageApi.error("Please enter password.");
    }
    const verified = await WalletHelper.verifyPassword(sessionPassword);
    if (!verified) {
      return messageApi.error("Please enter valid password to proceed.");
    }
    try {
      setIsPasswordSubmitting(true);
      await ensureDvpnLogin(walletAddress, { sessionPassword });
      if (pendingServer) {
        if (pendingServer.status === "Connected") {
          await stopNodeSession(pendingServer, sessionPassword);
        } else {
          await startNodeSession(pendingServer, sessionPassword);
        }
      }
      setPendingServer(null);
      setSessionPassword("");
      setIsPasswordModalOpen(false);
    } catch (error) {
      // Errors are shown by service and global error helper.
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handlePasswordCancel = () => {
    setSessionPassword("");
    setPendingServer(null);
    setIsPasswordModalOpen(false);
  };

  return (
    <div className={`scrollableCont servers-details`} style={{ height: "auto" }}>
      {contextHolder}
      {isConnectionLoading && (
        <div className="dvpn-loader-overlay" role="status" aria-live="polite">
          <div className="dvpn-loader-card">
            <DvpnLoader />
            <p>Processing VPN request...</p>
          </div>
        </div>
      )}
      <div className="searchBarFixed">
        <MenuRestofHeaders title={"Servers"} backTo={"/serversDetails"} />
        <div className="search">
          <InputField
            placeholder={"Search servers..."}
            checkForSymbols={true}
            value={searchTerm}
            getData={(value) => setSearchTerm(value)}
            addonBefore={
              <span>
                <img
                  src={Search}
                  style={{
                    width: "17px",
                  }}
                  alt="Search"
                />
              </span>
            }
          />
        </div>
      </div>

      <div className="servers-list">
        {loading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div className="server-card" key={`node-skeleton-${index}`}>
              <Skeleton className="dvpn-skeleton-wave" active paragraph={{ rows: 1 }} title={false} />
            </div>
          ))}
        {!loading &&
          servers.map((server) => (
            <div key={server.id} className="server-card">
              <div className="server-info">
                <div className="server-header">
                  <div className="server-details">
                    <h3 className="server-name">{server.name}</h3>
                    {server.location ? <p className="server-location">{server.location}</p> : null}
                  </div>
                </div>

                <div className="server-footer">
                  <button
                    className={`connect-btn  ${server.status === "Connected" ? "connected" : "connect"
                      }`}
                    onClick={() => handleConnectToggle(server)}
                    disabled={connectingNodeId === server.id}
                  >
                    {connectingNodeId === server.id ? (server.status === "Connected" ? "Disconnecting..." : "Connecting...") : server.status}
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
      <ModalCustom
        title={"Verify Password"}
        handleCancel={handlePasswordCancel}
        isModalOpen={isPasswordModalOpen}
        customClass="customClassModal"
      >
        <div className="viewphrases">
          <InputFieldSimple
            placeholder="Enter Password"
            value={sessionPassword}
            getData={(value) => {
              const hasEmoji = /[\p{Extended_Pictographic}]/u.test(value);
              if (value.length <= 100 && !hasEmoji) {
                setSessionPassword(value);
              }
            }}
            customFunction={handlePasswordSubmit}
          />
          <div style={{ marginTop: "10px" }} />
          <ButtonComp
            text={isPasswordSubmitting ? "Submitting..." : "Submit"}
            maxWidth={"100%"}
            onClick={handlePasswordSubmit}
            disabled={isPasswordSubmitting}
          />
        </div>
      </ModalCustom>
    </div>
  );
}

export default ServersNodes;
