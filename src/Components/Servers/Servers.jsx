import React, { useState } from "react";
import "./Servers.scss";
import MenuRestofHeaders from "../BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import USA from "../../Assets/cuntry/usa.svg";
import GERMANY from "../../Assets/cuntry/germany.svg";
import JAPAN from "../../Assets/cuntry/japan.svg";
import { InputField } from "../InputField/InputFieldSimple";
import Search from "../../Assets/SearchIcon.svg";
function Servers() {
  const [activeTab, setActiveTab] = useState("All");
  const servers = [
    { flag: USA, alt: "USA", country: "United States", locations: 6 },
    { flag: GERMANY, alt: "GERMANY", country: "Germany", locations: 6 },
    { flag: JAPAN, alt: "JAPAN", country: "Japan", locations: 6 },
  ];
  return (
    <div className={`scrollableCont`} style={{ hight: "auto" }}>
      <div className="searchBarFixed">
        <MenuRestofHeaders title={"Servers"} backTo={"/dvpn"} />
        <div className="search">
          <InputField
            placeholder={"Search"}
            checkForSymbols={true}
            addonBefore={
              <span>
                <img
                  src={Search}
                  style={{
                    width: "17px",
                  }}
                  alt=""
                />
              </span>
            }
          />
        </div>
      </div>
      <div className="recent-servers">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === "All" ? "active" : ""}`}
            onClick={() => setActiveTab("All")}
          >
            All
          </button>
          <button 
            className={`tab ${activeTab === "V2Ray" ? "active" : ""}`}
            onClick={() => setActiveTab("V2Ray")}
          >
            V2Ray
          </button>
          <button 
            className={`tab ${activeTab === "Wireguard" ? "active" : ""}`}
            onClick={() => setActiveTab("Wireguard")}
          >
            Wireguard
          </button>
        </div>

        <div className="header">
          <h3>Recent Servers</h3>
          <span className="view-all">View all</span>
        </div>

        <div className="server-list">
          {servers.map((server, index) => (
            <div className="server-item" key={index}>
              <div className="info">
                <span className="flag">
                  <img src={server.flag} alt={server.alt} />
                </span>
                <div>
                  <div className="country">{server.country}</div>
                  <div className="locations">{server.locations} Locations</div>
                </div>
              </div>
              <span className="link-icon">🔗</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Servers;
