/*global chrome*/
import React, { useEffect, useState } from "react";
import "./NetworkPreference.scss";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { useNavigate } from "react-router-dom";
import { Checkbox, message } from "antd";
import { useSelector } from "react-redux";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { WalletHelper } from "../../helpers/wallet.helper";
import bin from "../../Assets/delete.png";
import JustLogo from "../../Assets/logo.png";

import { DURATION } from "../../config/message.config";
import ModalCustom from "../../Components/ModalCustom/ModalCustom";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";

function AccountPreference() {
  const [data, setData] = useState([]);
  const { account, chain } = useSelector((state) => state);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const [deleteModal, setDeleteModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [evmAddress, setEVMAddress] = useState(null);
  const navigate = useNavigate();
  const init = async () => {
    const { accounts } = await chrome.storage.session.get("accounts");
    setData(accounts);
  };

  useEffect(() => {
    init();
  }, [account]);

  const handleChange = async (data) => {
    store.dispatch(setLoading(true));

    let isAddressExists = false;

    if (data.isWatchOnly) {
      if (chain.currencyName === "ETH") {
        if (data.evmAddress) {
          isAddressExists = true;
        }
      } else if (chain.currencyName === "BNB") {
        if (data.bnbAddress) {
          isAddressExists = true;
        }
      } else if (chain.currencyName === "POL") {
        if (data.maticAddress) {
          isAddressExists = true;
        }
      } else if (chain.currencyName === "AVAX") {
        if (data.avaxAddress) {
          isAddressExists = true;
        }
      } else if (chain.currencyName === "CRO") {
        if (data.croAddress) {
          isAddressExists = true;
        }
      } else if (chain.currencyName === "BTC") {
        if (data.bitcoinAddress) {
          isAddressExists = true;
        }
      } else if (chain.currencyName === "ADA") {
        if (data.adaAddress) {
          isAddressExists = true;
        }
      } else if (chain.currencyName === "SOL") {
        if (data.solanaAddress) {
          isAddressExists = true;
        }
      }

      if (!isAddressExists) {
        store.dispatch(setLoading(false));

        return navigate("/new-watch-address", {
          state: {
            chain: chain,
            walletId: data.id,
          },
        });
      }
    }

    const response = await WalletHelper.setWalletPreference(data.id);

    if (!response) {
      store.dispatch(setLoading(false));
      return messageApi.error("Unable to switch wallets at the moment.");
    }

    store.dispatch(setLoading(false));
    return navigate("/wallet");
  };

  return (
    <>
      <div className={`scrollableCont`}>
        {contextHolder}
        <MenuRestofHeaders backTo={"/setting"} title={"Wallets"} />
        <div className={`flexedContent`}>
          <div className="listItems">
            <ul>
              {data.map((data) => (
                <li className="currency_click">
                  <div>
                    <div
                      style={{
                        alignItems: "center",
                        borderRadius: "49%",
                        display: "flex",
                        height: "40px",
                        justifyContent: "center",
                        width: "40px",
                      }}
                      onClick={async () => {
                        handleChange(data);
                      }}
                    >
                      <img
                        src={JustLogo}
                        width={40}
                        height={40}
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                    <p
                      onClick={async () => {
                        handleChange(data);
                      }}
                    >
                      {data.name} {data.isWatchOnly ? "(Watch Only)" : null}{" "}
                      {account.id === data.id ? "(Default)" : null}
                    </p>
                  </div>{" "}
                  <div>
                    <Checkbox
                      onClick={async () => {
                        handleChange(data);
                      }}
                      className="checkboxInner"
                      checked={account.id === data.id}
                    ></Checkbox>
                    {data.id === account.id ? null : (
                      <div
                        className="delete"
                        onClick={async () => {
                          setDeleteModal(true);
                          setSelected(data.id);
                          setEVMAddress(data.evmAddress);
                        }}
                      >
                        <img
                          src={bin}
                          alt=""
                          style={{
                            height: "16px",
                            width: "16px",
                            marginLeft: "10px",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <ModalCustom
        title={"Delete Wallet"}
        isModalOpen={deleteModal}
        customClass="customClassModal"
        handleCancel={() => {
          setDeleteModal(false);
        }}
      >
        <div className="viewphrases">
          <div className="viewphrases__iInner">
            <p
              style={{
                fontSize: "20px",
                color: "white"
              }}
            >
              Are you sure you want to delete this wallet?
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "30px",
                gap:"20px"
              }}
            >
              <ButtonComp
                maxWidth="100%"
                onClick={async () => {
                  store.dispatch(setLoading(true));
                  await WalletHelper.deleteWallet(selected, evmAddress);
                  store.dispatch(setLoading(false));
                  setDeleteModal(false);
                }}
                text="Yes"
              />
              <div className="cancelBtn">
                <ButtonComp
                  maxWidth="100%"
                  onClick={() => {
                    setDeleteModal(false);
                  }}
                  text="No"
                />
              </div>
              {/* <div
                className='green'
                style={{
                  padding: "12px 53px",
                  backgroundColor: "rgb(56 101 109)",
                  color: "white",
                  fontSize: "18px",
                  borderRadius: "7px",
                  marginRight: "20px",
                  cursor: "pointer",
                }}
                onClick={async () => {
                  store.dispatch(setLoading(true));
                  await WalletHelper.deleteWallet(selected, evmAddress);
                  store.dispatch(setLoading(false));
                  setDeleteModal(false);
                }}
              >
                Confirm
              </div> */}
              {/* <div
                className='red'
                style={{
                  padding: "12px 53px",
                  backgroundColor: "red",
                  color: "white",
                  fontSize: "18px",
                  borderRadius: "7px",
                  marginLeft: "20px",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setDeleteModal(false);
                }}
              >
                Cancel
              </div> */}
            </div>
          </div>
        </div>
      </ModalCustom>
    </>
  );
}

export default AccountPreference;
