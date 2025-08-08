import React, { useState } from "react";
import MenuRestofHeaders from "../BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { InputField } from "../InputField/InputFieldSimple";
import Search from "../../Assets/SearchIcon.svg";
import "./Servers.scss";

function ServersDetails() {
  const [servers] = useState([
    {
      id: 1,
      name: "EffiNode-pr-dXlTXsrGPP",
      location: "sentdmwjy_kmzkxw",
      status: "Connected",
      
    },
    {
      id: 2,
      name: "EffiNode-pr-puipa2OIkw",
      location: "sentdmwjy_kmzkxw",
      status: "Connect",
    },
    {
      id: 3,
      name: "lva-05",
      location: "sentdoeld_ma9p51",
      status: "Connect",
    },
    {
      id: 4,
      name: "EffiNode-sg-asia01",
      location: "singapore_datacenter",
      status: "Connect",
    },
    {
      id: 5,
      name: "EffiNode-jp-tokyo02",
      location: "tokyo_premium_server",
      status: "Connect",
    },
  ]);

  return (
    <div
      className={`scrollableCont servers-details`}
      style={{ height: "auto" }}
    >
      <div className="searchBarFixed">
        <MenuRestofHeaders title={"Servers"} backTo={"/dvpn"} />
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
        {servers.map((server) => (
          <div key={server.id} className="server-card">
            <div className="server-info">
              <div className="server-header">
                <div className="server-details">
                  <h3 className="server-name">{server.name}</h3>
                  <p className="server-location">{server.location}</p>
                </div>
              </div>

              <div className="server-footer">
                <button className={`connect-btn  ${server.status === "Connected" ? "connected" : "connect"}`} >{server.status}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ServersDetails;
