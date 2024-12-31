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
import BackupMnemonics from "../../Assets/Backup-Mnemonics.png";
import Privatekey from "../../Assets/Backup-Private-Qubetics.png";
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
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
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
    setIsModalOpen2(false);
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
          <div>
            {" "}
             
            {data.map((data, idx) => (
              <div className="listItems">
                <ul>
                  <li
                    key={idx}
                    className="currency_click"
                    onClick={async () => {
                      setDrawer(true);
                      setSelectedAccount(data);
                      setName(data?.name);
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
                        <p className="walletName">{data?.name?.length > 10 ? `${data.name.substring(0, 7)}...` : data?.name} <span style={{color:"#00aeef", fontSize:15}}>{data?.default?" (Default)":""}</span></p>
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
                </ul>
              </div>
            ))}
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
                  <img
                    style={{
                      width: "20px",
                      height: "20px",
                    }}
                    src={BackupMnemonics}
                    alt=""
                  />
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
                  <img
                    style={{
                      width: "20px",
                      height: "20px",
                    }}
                    src={Privatekey}
                    alt=""
                  />
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
              if (!name) {
                return messageApi.error(
                  "Please enter a valid name to proceed."
                );
              }

              if (name.trim().length === 0) {
                return messageApi.error(
                  "Name should have a minimum of 3 characters."
                );
              }

              if (name.length < 3) {
                return messageApi.error(
                  "Name should have a minimum of 3 characters."
                );
              }

              if (name.length > 25) {
                return messageApi.error(
                  "Name should not have more than 25 characters."
                );
              }

              const { accounts } = await chrome.storage.session.get("accounts");

              if (accounts) {
                const checkIfExists = accounts.find(
                  (el) => el.name.toLowerCase() === name.toLowerCase()
                );

                if (checkIfExists) {
                  return messageApi.error(
                    "This wallet name already exists. Use a different name."
                  );
                }
              }

              const updating = await WalletHelper.updateWalletName(
                name.trim(),

                state ? state.id : selectedAccount.id
              );

              if (!updating) {
                return messageApi.error("Unable to update name at the moment.");
              }

              setDrawer(false);

              init();
            }}
            text={"Update Wallet"}
            maxWidth={"352px"}
            marginBottom={"10px"}
          />

          <ButtonComp
            deletebordered
            onClick={async () => {
              if (account.id === selectedAccount.id) {
                return messageApi.error("Unable to delete default wallet");
              }

              setDeleteModal(true);
            }}
            text={"Delete Wallet"}
            maxWidth={"100%"}
          />
          {/* <ButtonComp
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
          /> */}
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
                  cursor: "pointer",
                }}
                className="currency_click listItems "
                onClick={async () => {
                  navigate("/add-new-wallet", {
                    state: { type: "create", addNew: true },
                  });
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
                  // navigate("/import-wallet-name");
                  navigate("/add-new-wallet", { state: { type: "import", addNewImport: true } });
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
        title={"Delete Address"}
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

                color: "white",
              }}
            >
              Are you sure you want to delete this wallet?
            </p>
          </div>

          <div
            style={{
              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              marginTop: "30px",
            }}
          >
            <div
              className="green"
              style={{
                padding: "12px 53px",

                backgroundColor: "rgb(56 101 109)",

                color: "white",

                fontSize: "18px",

                borderRadius: "25px",

                marginRight: "20px",

                cursor: "pointer",
              }}
              onClick={async () => {
                try {
                  store.dispatch(setLoading(true));

                  await WalletHelper.deleteWallet(
                    selectedAccount.id,

                    account.address
                  );

                  setDrawer(false);

                  init();

                  store.dispatch(setLoading(false));

                  setDeleteModal(false);
                } catch (e) {
                  store.dispatch(setLoading(false));
                }
              }}
            >
              Yes
            </div>

            <div
              className="red"
              style={{
                padding: "12px 53px",

                color: "#F5DA76",

                fontSize: "18px",

                borderRadius: "25px",

                marginLeft: "20px",

                cursor: "pointer",

                border: "1px solid #F5DA76",

                // border: 1px solid #F5DA76,

                // bo
              }}
              onClick={() => {
                setDeleteModal(false);
              }}
            >
              No
            </div>
          </div>
        </div>
      </ModalCustom>

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
