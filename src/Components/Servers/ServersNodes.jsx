import React, { useEffect, useState } from "react";
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
  ensureDvpnLogin,
  getActiveWalletAddress,
  getNodes,
  getUserSubscriptions,
  getWalletDvpnState,
} from "../../services/dvpn";
import { Skeleton, message } from "antd";

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

  const logFlow = () => {};

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

  const startNodeSession = async (server, providedPassword = "") => {
    if (!walletAddress || !server?.raw) return;
    try {
      setConnectingNodeId(server.id);
      logFlow("ui.server_connect.start", {
        walletAddress,
        nodeId: server?.raw?.id || "",
        nodeAddress: server?.raw?.address || "",
        providerUrl: server?.raw?.url || server?.raw?.remote_url || "",
      });
      await connectVpnWithWireguardConfig({
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
      setServers((prev) =>
        prev.map((item) => ({
          ...item,
          status: item.id === server.id ? "Connected" : "Connect",
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
        await startNodeSession(pendingServer, sessionPassword);
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
      <div className="searchBarFixed">
        <MenuRestofHeaders title={"Servers"} backTo={"/serversDetails"} />
        <div className="search">
          <InputField
            placeholder={"Search servers..."}
            checkForSymbols={true}
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
                  className={`connect-btn  ${
                    server.status === "Connected" ? "connected" : "connect"
                  }`}
                  onClick={() => startNodeSession(server)}
                  disabled={connectingNodeId === server.id}
                >
                  {connectingNodeId === server.id ? "Connecting..." : server.status}
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
