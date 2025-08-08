import React from "react";
import "./DvpnSetting.scss";
import MenuRestofHeaders from "../BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import RightIcon from "../../Assets/DarkArrowRightIcon.svg";
import {
  DNSIcon,
  RPCIcon,
  TermsIcon,
  PrivacyIcon,
  VersionIcon,
  ShareIcon,
  NodeAccessIcon,
  AccountDetailsIcon,
  AccountTopUpIcon,
} from "../../Assets/SvgImg";
import { useNavigate } from "react-router-dom";
import useCurrentHeight from "../../CustomHooks/useCurrentHeight";
function DvpnSetting() {
  const navigate = useNavigate();
  const height = useCurrentHeight();
  const settingsData = [
    {
      section: "Connectivity",
      items: [
        {
          icon: <DNSIcon />,
          label: "DNS",
          value: "Cloudflare",
          onClick: () => navigate("/dnsDetails"),
        },
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
        { icon: <TermsIcon />, label: "Terms of Service", hasArrow: true },
        { icon: <PrivacyIcon />, label: "Privacy Policy", hasArrow: true },
        { icon: <VersionIcon />, label: "Version", value: "1.0.2" },
      ],
    },
    {
      section: "Support",
      items: [{ icon: <ShareIcon />, label: "Share Logs", hasArrow: true }],
    },
    {
      section: "Account",
      items: [
        {
          icon: <NodeAccessIcon />,
          label: "Node Access",
          value: "100 days left",
          hasArrow: true,
        },
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
          onClick: () => navigate("/accountTopUp"),
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
