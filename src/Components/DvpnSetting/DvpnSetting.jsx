/*global chrome*/

import React, { useEffect, useState } from "react";
import "./DvpnSetting.scss";
import MenuRestofHeaders from "../BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import RightIcon from "../../Assets/DarkArrowRightIcon.svg";
import {
  RPCIcon,
  TermsIcon,
  PrivacyIcon,
  VersionIcon,
  AccountDetailsIcon,
  AccountTopUpIcon,
} from "../../Assets/SvgImg";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import useCurrentHeight from "../../CustomHooks/useCurrentHeight";
import QubeticsImage from "../../Assets/QubeticsLogo.png";
import { findRunningAgent } from "../../services/dvpn";


function DvpnSetting() {
  const navigate = useNavigate();
  const height = useCurrentHeight();
  const { account } = useSelector((state) => state);
  const [agentVersion, setAgentVersion] = useState("");
  const openExternalUrl = (url) => {
    const target = String(url || "").trim();
    if (!target) return;
    try {
      if (typeof chrome !== "undefined" && chrome?.tabs?.create) {
        chrome.tabs.create({ url: target });
        return;
      }
    } catch (error) {
      // Fallback to window.open below.
    }
    window.open(target, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    let cancelled = false;
    const loadAgentVersion = async () => {
      const result = await findRunningAgent().catch(() => null);
      const version = String(result?.version || "").trim();
      if (!cancelled) {
        setAgentVersion(version);
      }
    };
    loadAgentVersion();
    return () => {
      cancelled = true;
    };
  }, []);

  const settingsData = [
    {
      section: "Connectivity",
      items: [
        // {
        //   icon: <DNSIcon />,
        //   label: "DNS",
        //   value: "Cloudflare",
        //   onClick: () => navigate("/dnsDetails"),
        // },
        {
          icon: <RPCIcon />,
          label: "RPC",
          onClick: () => navigate("/rpcDetails"),
          hasArrow: true,
        },
      ],
    },
    {
      section: "Legal",
      items: [
        {
          icon: <TermsIcon />,
          label: "Terms of Service",
          hasArrow: true,
          onClick: () => openExternalUrl("https://www.qubetics.com/terms-of-use/"),
        },
        {
          icon: <PrivacyIcon />,
          label: "Privacy Policy",
          hasArrow: true,
          onClick: () => openExternalUrl("https://www.qubetics.com/privacy-policy/"),
        },
        {
          icon: <VersionIcon />,
          label: "Agent Version",
          value: agentVersion || "Not installed",
        },
      ],
    },
    // {
    //   section: "Support",
    //   items: [{ icon: <ShareIcon />, label: "Share Logs", hasArrow: true }],
    // },
    {
      section: "Account",
      items: [
        // {
        //   icon: <NodeAccessIcon />,
        //   label: "Node Access",
        //   value: "100 days left",
        //   hasArrow: true,
        // },
        {
          icon: <AccountDetailsIcon />,
          label: "Account Details",
          hasArrow: true,
          onClick: () => {
            navigate("/accountDetails");
          },    
        },
        {
          icon: <AccountTopUpIcon />,
          label: "Account Top Up",
          hasArrow: true,
          onClick: () =>
            navigate("/receive-currency", {
              state: {
                backTo: "/dvpnSetting",
                symbol: "TICS",
                coin: {
                  wallet_address: account?.coinFamilyAndAddress?.[7] || "",
                  coin: {
                    coin_family: 7,
                    coin_image: QubeticsImage,
                  },
                },
              },
            }),
        },
      ],
    },
  ];
  return (
    <div className={`scrollableCont`} style={{ hight: "auto" }}>
      <div className="searchBarFixed">
        <MenuRestofHeaders title={"Servers"} backTo={"/dvpn"} />
      </div>
      <div className={`${'settings-panel'} ${
      height <= 600 ? 'heightExtSettingsPanel' : ''
    }`}>
        {settingsData.map((section, index) => (
          <div key={index} className="settings-section">
            <div className="section-title">{section.section}</div>
            <div className="section-items">
              {section.items.map((item, idx) => (
                <div key={idx} className="settings-item" onClick={item.onClick}>
                  <div className="left">
                    <span className="icon">{item.icon}</span>
                    <span className="label">{item.label}</span>
                  </div>
                  <div className="right">
                    {item.value && <span className="value">{item.value}</span>}
                    {item.hasArrow && (
                      <span className="arrow">
                        <img src={RightIcon} alt="rightIcon" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DvpnSetting;
