/*global chrome*/
import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import Btc from "../../Assets/Coins/BTC.png";
import "./ConnectesApp.scss";
import { useSelector } from "react-redux";
import DarkArrowRightIcon from "../../Assets/DarkArrowRightIcon.svg";
import ticketcheck1 from "../../Assets/ArrowRightIcon.svg";
import { store } from "../..";
import search from "../../Assets/SearchIcon.svg";
import { setCreate } from "../../actions/create";
import { useNavigate } from "react-router-dom";
import MyWallet from "../../Assets/myWallet.svg";
import Jupiter from "../../Assets/Jupiter.png";
import { InputField } from "../../Components/InputField/InputFieldSimple";

function ConnectedApp() {
  const { theme } = useSelector((state) => state);

  const [connections, setConnections] = useState([]);

  const init = async () => {
    const { connectedDapps } = await chrome.storage.session.get(
      "connectedDapps"
    );
    setConnections(connectedDapps || []);
  };

  useEffect(() => {
    init();
  }, []);

  function addDefaultSrc(ev, link) {
    ev.target.src = MyWallet;
  }
  const navigate = useNavigate();

  const data = [
    {
      name: "Jupiter",
      image: Jupiter,
      description: "Lorem ipsum dolor.",
    },
    {
      name: "Parrot Finance",
      image: Jupiter,
      description: "Lorem ipsum dolor.",
    },
    {
      name: "Solend",
      image: Jupiter,
      description: "Lorem ipsum dolor.",
    },
    {
      name: "Larix",
      image: Jupiter,
      description: "Lorem ipsum dolor.",
    },
  ];
  const exchangesdata = [
    {
      name: "Compound",
      image: Jupiter,
      description: "Lorem ipsum dolor.",
    },
    {
      name: "PancakeSwap",
      image: Jupiter,
      description: "Lorem ipsum dolor.",
    },
    {
      name: "Sushi",
      image: Jupiter,
      description: "Lorem ipsum dolor.",
    },
    {
      name: "Uniswap",
      image: Jupiter,
      description: "Lorem ipsum dolor.",
    },
  ];

  return (
    <div>
      <div className={`scrollableCont`}>
        {/* <MenuRestofHeaders backTo={"/wallet"} title={"dApp"} /> */}
        {/* <div className={`flexedContent`}>
          {connections.length > 0 ? (
            connections.map((connection) => (
              <div
                className="connectesApp"
                onClick={() => {
                  store.dispatch(setCreate(true));
                  navigate("/exchangePancake", {
                    state: {
                      connection,
                    },
                  });
                }}
              >
                <div className="left">
                  <div className="icon">
                    <img
                      src={`${connection.url}/favicon.ico`}
                      style={{
                        height: "40px",
                        width: "40px",
                        objectFit: "contain",
                      }}
                      onError={addDefaultSrc}
                    />
                  </div>
                  <div className="textSec">
                    <h3>{connection.title}</h3>
                    <p style={{ marginTop: "7px" }}>{connection.url}</p>
                  </div>
                </div>
                <div className="ryt">
                  <img
                    src={
                      theme === "darkTheme" ? DarkArrowRightIcon : ticketcheck1
                    }
                  />
                </div>
              </div>
            ))
          ) : (
            <p
              className="noAddress"
              style={{
                marginTop: "50%",
                fontWeight: "bold",
                fontSize: "17px",
              }}
            >
              No Dapps connected...
            </p>
          )}
        </div> */}
        <div>
          <div className="searchBarFixed">
            <div className="search">
              <InputField
                placeholder={"Add URL"}
                checkForSymbols={true}
                addonBefore={
                  <span>
                    <img
                      src={search}
                      style={{
                        width: "17px",
                        position: "relative",
                        top: "2px",
                      }}
                      alt=""
                    />
                  </span>
                }
              />
            </div>
          </div>
          <div className={`flexedContent`}>
            <div className="dApp">
              <h3>Finance</h3>
              <div className="dApp_card">
                <div className="financeCard">
                  {data.map((item, index) => (
                    <div key={index} className="financeCard_jupiter">
                      <img src={item.image} alt={item.name} />
                      <div>
                        <h5>{item.name}</h5>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <h3 style={{ marginTop: "24px" }}>Exchanges</h3>
              <div className="dApp_card">
                <div className="financeCard">
                  {exchangesdata.map((item, index) => (
                    <div key={index} className="financeCard_jupiter">
                      <img src={item.image} alt={item.name} />
                      <div>
                        <h5>{item.name}</h5>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConnectedApp;
