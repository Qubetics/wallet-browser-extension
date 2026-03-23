import React from "react";
import MenuRestofHeaders from "../../BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import "./DNSDetails.scss";
import CloudflareIcon from "../../../Assets/CloudflareIcon.svg";
import GoogleIcon from "../../../Assets/GoogleIcon.svg";
import HandshakeIcon from "../../../Assets/HandshakeIcon.svg";
import AbcdIcon from "../../../Assets/AbcdIcon.svg";
import ButtonComp from "../../ButtonComp/ButtonComp";
import { useNavigate } from "react-router-dom";
function DNSDetails() {
  const navigate = useNavigate();
  const dnsOptions = [
    { name: "Cloudflare", icon: CloudflareIcon, selected: true },
    { name: "Google", icon: GoogleIcon },
    { name: "Handshake", icon: HandshakeIcon },
    { name: "ABCD DNS", icon: AbcdIcon },
  ];
  return (
    <div className={`scrollableCont`} style={{ hight: "auto" }}>
      <MenuRestofHeaders title={"DNS Details"} backTo={"/dvpnSetting"} />
      <div className="dns-selector">
        <div className="dns-list">
          {dnsOptions.map((dns, index) => (
            <div
              key={index}
              className={`dns-item ${dns.selected ? "selected" : ""}`}
            >
              <div className="innerDetail">
                <div className="icon">
                  <img src={dns.icon} alt="icon" />
                </div>
                <div className="name">
                  <h2> {dns.name}</h2>
                </div>
              </div>
              {dns.selected && <div className="check">✔</div>}
            </div>
          ))}
        </div>
        <div className="bottomBtn">
        <ButtonComp text={"Add Custom DNS"} maxWidth={"100%"} onClick={() => navigate("/addCustomDNS")} />
        </div>
      </div>
    </div>
  );
}

export default DNSDetails;
