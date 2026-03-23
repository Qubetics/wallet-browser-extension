/*global chrome*/
import React, { useEffect, useState } from "react";
import EDIT from "../../Assets/edit.png";
import Unitedstate from "../../Assets/cuntry/unitedstate.svg";
import "./NetworkPreference.scss"
import Newzealand from "../../Assets/cuntry/newzealand.svg";
import Europe from "../../Assets/cuntry/europe.svg";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { WalletHelper } from "../../helpers/wallet.helper";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Checkbox, message } from "antd";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { store } from "../..";
import { setLoading } from "../../actions/loading";

function NetworkPreference() {
  const navigate = useNavigate();
  const { chain, account } = useSelector((state) => state);
  const [data, setData] = useState([]);

  const init = async () => {
    const { chains } = await chrome.storage.local.get("chains");
    setData(chains);
  };

  useEffect(() => {
    init();
  });

  const handleChange = async (data) => {
    if (chain.chainId == data.chainId) {
      return;
    }

    let isAddressExists = false;

    if (account.isWatchOnly) {
      if (data.currencyName === "ETH") {
        if (account.evmAddress) {
          isAddressExists = true;
        }
      } else if (data.currencyName === "BNB") {
        if (account.bnbAddress) {
          isAddressExists = true;
        }
      } else if (data.currencyName === "MATIC") {
        if (account.maticAddress) {
          isAddressExists = true;
        }
      } else if (data.currencyName === "AVAX") {
        if (account.avaxAddress) {
          isAddressExists = true;
        }
      } else if (data.currencyName === "CRO") {
        if (account.croAddress) {
          isAddressExists = true;
        }
      } else if (data.currencyName === "BTC") {
        if (account.bitcoinAddress) {
          isAddressExists = true;
        }
      } else if (data.currencyName === "ADA") {
        if (account.adaAddress) {
          isAddressExists = true;
        }
      } else if (data.currencyName === "SOL") {
        if (account.solanaAddress) {
          isAddressExists = true;
        }
      }


      if (!isAddressExists) {
        store.dispatch(setLoading(false));
        return navigate("/new-watch-address", {
          state: {
            chain: data,
          },
        });
      }
    }

    store.dispatch(setLoading(true));
    await WalletHelper.setNetworkPreference(data.chainId);
    store.dispatch(setLoading(false));
    navigate("/wallet");
  };

  return (
    <>
      <div className={`scrollableCont`}>
        <MenuRestofHeaders backTo={"/setting"} title={"Network Preference"} />
        <div className={`flexedContent`}>
          <div className="listItems">
            <ul>
              {data
                .filter((el) => !el.testnet)
                .map((data) => (
                  <li className="currency_click">
                    <div>
                      <img
                        src={data.image}
                        alt=''
                        onClick={() => {
                          handleChange(data);
                        }}
                      />
                      <p
                        onClick={() => {
                          handleChange(data);
                        }}
                      >
                        {data.chainName}
                      </p>
                    </div>{" "}
                    <div>
                      <Checkbox
                        onClick={() => {
                          handleChange(data);
                        }}
                        className='checkboxInner'
                        checked={data.chainId === chain.chainId}
                      ></Checkbox>
                      {data.currencyName === "ADA" ||
                      data.currencyName === "BTC" ||
                      data.currencyName === "SOL" ? null : (
                        <img
                          src={EDIT}
                          alt=''
                          onClick={(e) => {
                            e.preventDefault();
                            navigate("/edit-network", {
                              state: {
                                chain: data,
                              },
                            });
                          }}
                          style={{
                            height: "16px",
                            width: "16px",
                            marginLeft: "10px",
                          }}
                        />
                      )}
                    </div>
                  </li>
                ))}
            </ul>

            {account.isWatchOnly ? null : (
              <div
                style={{
                  marginTop: "20px",
                  marginBottom: "20px",
                  textAlign: "left",
                }}
              >
                <h4>Test Networks</h4>
                <br />
                <p className='balances'>
                  Balances for test networks won't be included in you total
                  balance.
                </p>
              </div>
            )}

            {account.isWatchOnly ? null : (
              <ul className='testNetworkData'>
                {data
                  .filter((el) => el.testnet)
                  .map((data) => (
                    <li>
                      <div className='checkboxRopstem'>
                        <div>
                          {data.currencyName === "ADA" ? null : (
                            <img
                              src={EDIT}
                              alt=''
                              onClick={(e) => {
                                e.preventDefault();
                                navigate("/edit-network", {
                                  state: {
                                    chain: data,
                                  },
                                });
                              }}
                              style={{
                                height: "16px",
                                width: "16px",
                                marginRight: "10px",
                              }}
                            />
                          )}
                          <Checkbox
                            onClick={() => {
                              handleChange(data);
                            }}
                            className='checkboxInner'
                            checked={data.chainId === chain.chainId}
                          ></Checkbox>
                        </div>

                        <div
                          className='randb'
                          onClick={() => {
                            handleChange(data);
                          }}
                        >
                          {" "}
                          {data.chainName.split("")[0]}
                        </div>
                        <p
                          onClick={() => {
                            handleChange(data);
                          }}
                        >
                          {data.chainName}
                        </p>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <Link to='/add-network'>
            <ButtonComp
              text={"Add Custom Network"}
              maxWidth={"100%"}
              marginBottom={"40px"}
            />
          </Link>
        </div>
      </div>
    </>
  );
}

export default NetworkPreference;
