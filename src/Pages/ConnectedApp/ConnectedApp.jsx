/*global chrome*/
import React, { useEffect, useState } from 'react';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import Btc from '../../Assets/Coins/BTC.png';
import './ConnectesApp.scss';
import { useSelector } from 'react-redux';
import DarkArrowRightIcon from '../../Assets/DarkArrowRightIcon.svg';
import ticketcheck1 from '../../Assets/ArrowRightIcon.svg';
import { store } from '../..';
import search from '../../Assets/SearchIcon.svg';
import { setCreate } from '../../actions/create';
import { useNavigate } from 'react-router-dom';
import MyWallet from '../../Assets/myWallet.svg';
import NoRecord from '../../Assets/no-record.svg';

import Jupiter from '../../Assets/Jupiter.png';
import { InputField } from '../../Components/InputField/InputFieldSimple';

function startsWithSlash(str) {
  return str.startsWith('/');
}

function ConnectedApp() {
  const { theme } = useSelector((state) => state);
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);

  const init = async () => {
    const { connectedDapps } = await chrome.storage.session.get(
      'connectedDapps'
    );
    setConnections(connectedDapps || []);
  };

  useEffect(() => {
    init();
  }, []);

  function addDefaultSrc(ev, link) {
    ev.target.src = MyWallet;
  }

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
        <div className="flexedContent">
          {/* <div className="searchBarFixed">
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
          </div> */}

          {connections.length > 0 ? (
            connections.map((connection) => (
              <div
                className="connectesApp listItems"
                onClick={() => {
                  store.dispatch(setCreate(true));
                  navigate('/exchangePancake', {
                    state: {
                      connection,
                    },
                  });
                }}
              >
                <div className="left">
                  <div className="icon">
                    <img
                      src={`${connection.url}${
                        startsWithSlash(connection?.image)
                          ? `${connection.image}`
                          : `/${connection.image}`
                      }`}
                      style={{
                        height: '40px',
                        width: '40px',
                        objectFit: 'contain',
                      }}
                      onError={addDefaultSrc}
                    />
                  </div>
                  <div className="textSec">
                    <h3>{connection.title}</h3>
                    <p style={{ marginTop: '7px' }}>{connection.url}</p>
                  </div>
                </div>
                <div className="ryt">
                  <img src={DarkArrowRightIcon} />
                </div>
              </div>
            ))
          ) : (
            <div className="noRecord">
              <img src={NoRecord} alt="" />
              <p
                className="noAddress"
                style={{
                  fontWeight: 'bold',
                  fontSize: '17px',
                }}
              >
                No dApp history found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConnectedApp;
