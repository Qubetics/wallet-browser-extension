/*global chrome*/
import React, { useEffect, useState } from "react";
import Logo from "../../Assets/logo.png";
import "./ManageWallet.scss";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { Drawer, message } from "antd";
import ModalCloseIcon from "../../Assets/ModalCloseIcon.svg";
import darkclose from "../../Assets/darkclose.svg";
import InputFieldSimple, {
  InputFieldOnly,
} from "../../Components/InputField/InputFieldSimple";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import ModalCustom from "../../Components/ModalCustom/ModalCustom";
import { WalletHelper } from "../../helpers/wallet.helper";
import warning from "../../Assets/PNG/warning.png";
import WalletIBtn from "../../Assets/WalletIBtn.svg";
import DarkArrowRightIcon from "../../Assets/DarkArrowRightIcon.svg";
function ManageWallet() {
  const [data, setData] = useState([]);
  const [drawer, setDrawer] = useState(false);
  const { theme } = useSelector((state) => state);
  const { account } = useSelector((state) => state);
  const [name, setName] = useState("");
  const [password, setPassword] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen1, setIsModalOpen1] = useState(false);

  const handleOk1 = () => {
    setIsModalOpen1(false);
  };
  const handleCancel1 = () => {
    setIsModalOpen1(false);
    setPassword(null);
  };

  const [isModalOpen2, setIsModalOpen2] = useState(false);

  const handleOk2 = () => {
    setIsModalOpen2(false);
  };
  const handleCancel2 = () => {
    setIsModalOpen3(false);
    setPassword(null);
  };

  const [isModalOpen3, setIsModalOpen3] = useState(false);

  const handleOk3 = () => {
    setIsModalOpen3(false);
  };
  const handleCancel3 = () => {
    setIsModalOpen3(false);
    setPassword(null);
  };

  const [selectedAccount, setSelectedAccount] = useState(null);

  const init = async () => {
    store.dispatch(setLoading(true));
    let { accounts } = await chrome.storage.session.get("accounts");
    setData(accounts);
    store.dispatch(setLoading(false));
  };

  useEffect(() => {
    init();
  }, []);

  const onClose = () => {
    setDrawer(false);
  };

  const navigate = useNavigate();

  const { state } = useLocation();

  return (
    <>
      {contextHolder}
      <div className={`scrollableCont`}>
        <MenuRestofHeaders backTo={"/setting"} title={"Manage Wallet"} />
        <div className={`flexedContent manageWalletHeight`}>
          <div className="listItems">
            <ul>
              {data.map((data) => (
                <li
                  className="currency_click"
                  onClick={async () => {
                    setDrawer(true);
                    setSelectedAccount(data);
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <img src={Logo} alt="" />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: "0",
                      }}
                    >
                      <p className="walletName">{data.name}</p>
                      <p className="walletAdd">
                        {data.address.substring(0, 7)}.....
                        {data.address.substring(
                          data.address.length - 7,
                          data.address.length
                        )}
                      </p>
                    </div>
                  </div>
                  <img src={WalletIBtn} alt="I" />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <ButtonComp
              onClick={async () => {
                setIsModalOpen3(true);
              }}
              text={"Add Wallet"}
              maxWidth={"100%"}
            />
          </div>
        </div>
      </div>

      <Drawer
        title="Wallet"
        placement="bottom"
        onClose={onClose}
        open={drawer}
        closeIcon={
          theme == "darkTheme" ? (
            <img src={darkclose} />
          ) : (
            <img src={ModalCloseIcon} />
          )
        }
      >
        <InputFieldOnly
          placeholder={selectedAccount?.name}
          label="Wallet"
          checkForSymbols={true}
          value={name}
          placeholderBaseColor={true}
          getData={(name) => {
            if (name.length <= 25) {
              if (/^\s/.test(name)) {
                setName("");
              } else {
                setName(name);
              }
            } else {
              return;
            }
          }}
        />
        <div className="textInfoBaseColor">
          Max Limit: {name ? name.length : 0}/25
        </div>
        <div className={`flexedContent`}>
          <div className="listItems">
            <ul>
              <li
                className="currencyClick"
                onClick={async () => {
                  setIsModalOpen1(true);
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img src={Logo} alt="" />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <p>Backup Mnemonics</p>
                  </div>
                </div>
                <img src={DarkArrowRightIcon} alt="Arrow" />
              </li>
              <li
                className="currencyClick"
                onClick={async () => {
                  setIsModalOpen2(true);
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img src={Logo} alt="" />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <p>Backup Private key</p>
                  </div>
                </div>
                <img src={DarkArrowRightIcon} alt="Arrow" />
              </li>
            </ul>
          </div>

          <ButtonComp
            onClick={async () => {
              if (account.id === selectedAccount.id) {
                return messageApi.error("Unable to delete default wallet");
              }

              await WalletHelper.deleteWallet(
                selectedAccount.id,
                account.address
              );
              setDrawer(false);
              init();
            }}
            text={"Delete Wallet"}
            maxWidth={"100%"}
          />
        </div>
      </Drawer>

      <Drawer
        title="Add Account"
        placement="bottom"
        onClose={handleCancel3}
        open={isModalOpen3}
        closeIcon={
          theme == "darkTheme" ? (
            <img src={darkclose} />
          ) : (
            <img src={ModalCloseIcon} />
          )
        }
      >
        <div className={`flexedContent`}>
          <div className="">
            <ul>
              <li
                style={{
                  backgroundColor: "#040205",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor:"pointer"
                }}
                className="currency_click listItems "
                onClick={async () => {
                  navigate("/add-new-wallet");
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <img src={Logo} alt="" />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <p style={{ color: "#fff" }}>New Account</p>
                  </div>
                </div>
                <p>
                  <svg
                    viewBox="0 0 24 24"
                    height={20}
                    width={20}
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      {" "}
                      <path
                        d="M10 7L15 12L10 17"
                        stroke="#fff"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></path>{" "}
                    </g>
                  </svg>
                </p>
              </li>
              <li
                style={{
                  backgroundColor: "#040205",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                className="currency_click listItems"
                onClick={async () => {
                  navigate("/import-wallet-name");
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <img src={Logo} alt="" />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <p style={{ color: "#fff" }}>Existing Account</p>
                  </div>
                </div>
                <p>
                  <svg
                    viewBox="0 0 24 24"
                    height={20}
                    width={20}
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      {" "}
                      <path
                        d="M10 7L15 12L10 17"
                        stroke="#fff"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></path>{" "}
                    </g>
                  </svg>
                </p>
              </li>
            </ul>
          </div>
        </div>
      </Drawer>

      <ModalCustom
        title={"Show Secret Phrase"}
        handleCancel={handleCancel1}
        isModalOpen={isModalOpen1}
        handleOk={handleOk1}
        customClass="customClassModal"
      >
        <div className={"viewphrases"}>
          <InputFieldSimple
            placeholder="Password"
            getData={setPassword}
            value={password}
            customFunction={async () => {
              await chrome.storage.session.set({
                password,
              });
              const response = await WalletHelper.getMnemonics(
                selectedAccount.coinFamilyAndAddress[1]
              );
              if (!response) {
                return messageApi.error("Please enter a valid password.");
              }
              navigate("/showSecretPhrase", {
                state: {
                  mnemonics: response,
                  backTo: "/manage-wallet",
                },
              });
            }}
          />
          <div className={"viewphrases__iInner"}>
            <img src={warning} />
            <div>
              <p>Do Not share your secret Phrase!</p>
              <p>These words can be used to steal all your funds.</p>
            </div>
          </div>
          <ButtonComp
            text={"Proceed"}
            maxWidth={"100%"}
            onClick={async () => {
              await chrome.storage.session.set({
                password,
              });
              const response = await WalletHelper.getMnemonics(
                selectedAccount.coinFamilyAndAddress[1]
              );
              if (!response) {
                return messageApi.error("Please enter a valid password.");
              }
              navigate("/showSecretPhrase", {
                state: {
                  mnemonics: response,
                  backTo: "/manage-wallet",
                },
              });
            }}
          />
        </div>
      </ModalCustom>

      <ModalCustom
        title={"Backup Private key"}
        handleCancel={handleCancel2}
        isModalOpen={isModalOpen2}
        handleOk={handleOk2}
        customClass="customClassModal"
      >
        <div className={"viewphrases"}>
          <InputFieldSimple
            placeholder="Password"
            getData={setPassword}
            value={password}
            customFunction={async () => {
              const res = await WalletHelper.verifyPassword(password);
              if (!res) {
                return messageApi.error("Invalid Password");
              }

              navigate("/show-private-key", {
                state: {
                  account: selectedAccount,
                  backTo: "/manage-wallet",
                },
              });
            }}
          />
          <div className={"viewphrases__iInner"}>
            <img src={warning} />
            <div>
              <p>Do Not share your private key!</p>
              <p>This key can be used to steal all your funds.</p>
            </div>
          </div>
          <ButtonComp
            text={"Proceed"}
            maxWidth={"100%"}
            onClick={async () => {
              const res = await WalletHelper.verifyPassword(password);
              if (!res) {
                return messageApi.error("Invalid Password");
              }

              navigate("/show-private-key", {
                state: {
                  account: selectedAccount,
                  backTo: "/manage-wallet",
                },
              });
            }}
          />
        </div>
      </ModalCustom>
    </>
  );
}

export default ManageWallet;
