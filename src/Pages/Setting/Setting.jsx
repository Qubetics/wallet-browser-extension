/*global chrome*/
import React, { useState } from "react";
import SettingList from "../../Components/SettingList/SettingList.jsx";
import CurrencyIcons from "../../Assets/settings/currency.svg";
import NativeCurrency from "../../Assets/settings/NativeCurrency.svg";
import AddressBook from "../../Assets/settings/address.svg";
// import Security from "../../Assets/settings/ic_privcay.png";
import ModalCustom from "../../Components/ModalCustom/ModalCustom.jsx";
import InputFieldSimple from "../../Components/InputField/InputFieldSimple.jsx";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import "./Setting.scss";
import warning from "../../Assets/PNG/warning.png";
// import darkSecurity from "../../Assets/settings/DarkPrivacy.svg";
import { useLocation, useNavigate } from "react-router-dom";
import { WalletHelper } from "../../helpers/wallet.helper.js";
import { message } from "antd";
import { store } from "../../index.js";
import { setLoading } from "../../actions/loading.js";
import { DURATION } from "../../config/message.config.js";
import { useSelector } from "react-redux";
import { server } from "../../server.js";
import { generateString } from "../../helpers/common.helper.js";
import Security from "../../Assets/settings/Security.svg";
import PrivacyPolicy from "../../Assets/settings/PrivacyPolicy.svg";
import Transactionhistory from "../../Assets/settings/Transactionhistory.svg";
import Logout from "../../Assets/settings/Logout.svg";

function Setting() {
  const [open, setOpen] = useState(false);
  const [openHelp, setOpenHelp] = useState(false);
  const { state } = useLocation();
  const { chain, account } = useSelector((state) => state);
  const navigate = useNavigate();
  const [password, setPassword] = useState(null);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const { theme } = useSelector((state) => state);
  const [isModalOpen, setOpenmodal] = useState(false);
  const [isLogoutModalOpen, setLogoutOpenmodal] = useState(false);
  const [socialIcons, setSocialIcons] = useState([]);

  const chunkArray = (array, chunkSize) => {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
  };

  const onClick = () => {
    setOpenmodal(true);
  };

  const handleOk = () => {
    setOpenmodal(false);
  };

  const handleCancel = () => {
    setOpenmodal(false);
  };

  const onLogoutClick = () => {
    setLogoutOpenmodal(true);
  };

  const handlLogouteOk = async () => {
    setLogoutOpenmodal(false);
  };

  const handleLogoutCancel = () => {
    setLogoutOpenmodal(false);
  };

  const onCloseHandle = () => {
    setOpen(false);
  };
  const drawerOpen = () => {
    setOpen(true);
  };

  const onCloseHandle1 = () => {
    setOpenHelp(false);
  };
  const drawerOpen1 = () => {
    setOpenHelp(true);
  };

  const handleChatBot = async () => {
    store.dispatch(setLoading(true));
    const checkUserToNavigate = await server.post(
      "/wallet/open_faq",
      {
        wallet_address: account.address,
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    if (checkUserToNavigate.data.status) {
      let randomString = generateString(15);
      store.dispatch(setLoading(false));
      // window.open(`http://localhost:3000/chat/${account.address}/${randomString}`);
      window.open(
        `https://REDACTED/chat/${account.address}/${randomString}`
        // `http://localhost:3000/faq/${account.address}/${randomString}`
      );
    }
  };

  const data = [
    {
      setinglist: "Manage Account",
      to: "/manage-wallet",
      ticketcheck: theme == "darkTheme" ? CurrencyIcons : CurrencyIcons,
      RightArow: "true",
      // from:"myWallet"
      from:"settings"
    },
    {
      setinglist: "Security",
      to: "/securitySetting",
      ticketcheck: theme == "darkTheme" ? Security : Security,
      RightArow: "true",
    },
    {
      setinglist: "Native Currency",
      to: "/currencyPreference",
      ticketcheck: theme == "darkTheme" ? NativeCurrency : NativeCurrency,
      RightArow: "true",
    },
    // {
    //   setinglist: "About Us",
    //   to: "",
    //   ticketcheck: theme == "darkTheme" ? AboutUs : AboutUs,
    //   RightArow: "true",
    // },
    {
      setinglist: "Privacy Policy",
      to: "https://www.qubetics.com/privacy-policy/",
      ticketcheck: theme == "darkTheme" ? PrivacyPolicy : PrivacyPolicy,
      RightArow: "true",
    },
    {
      setinglist: "Transaction History",
      to: "/history",
      path:"settings", 
      ticketcheck:
        theme == "darkTheme" ? Transactionhistory : Transactionhistory,
      RightArow: "RightArow",
    },
    {
      setinglist: "Address Book",
      to: "/address-book",
      ticketcheck: theme == "darkTheme" ? AddressBook : AddressBook,
      RightArow: "RightArow",
    },
    // {
    //   setinglist: "Preference",
    //   to: "/",
    //   ticketcheck: theme == "darkTheme" ? Preference : Preference,
    //   RightArow: "RightArow",
    // },
    // {
    //   setinglist: "Change Password",
    //   to: "/changePin",
    //   ticketcheck: theme == "darkTheme" ? darkChangePin : ChangePin,
    //   RightArow: "RightArow",
    // },
    {
      setinglist: "Logout",
      to: "/logout",
      ticketcheck: theme == "darkTheme" ? Logout : Logout,
      RightArow: "RightArow",
    },
  ];
  return (
    <div className={`scrollableCont`}>
      <div className={`flexedContent`}>
        {contextHolder}
        {data.map((data) => (
          <SettingList
            setinglist={data.setinglist}
            to={data.to}
            ticketcheck={data.ticketcheck}
            onClick={data.onClick}
            switchToggle={data.switchToggle}
            RightArow={data.RightArow}
            path={data?.path}
            from={data?.from}
          />
        ))}

        <ModalCustom
          title={"Password"}
          handleCancel={handleCancel}
          isModalOpen={isModalOpen}
          handleOk={handleOk}
          customClass="customClassModal"
        >
          <div className="viewphrases">
            <InputFieldSimple
              placeholder="Password"
              // getData={setPassword}
              getData={(value) => {
                const hasEmoji = /[\p{Extended_Pictographic}]/u.test(value);
                if (value.length <= 100 && !hasEmoji) {
                  setPassword(value);
                }
              }}
              customFunction={async () => {
                const isCorrectPassword = await WalletHelper.verifyPassword(password);
                if (!isCorrectPassword) {
                  return messageApi.error("Incorrect password provided.");
                }
                else{
                  store.dispatch(setLoading(true));
                  await WalletHelper.logout();
                  store.dispatch(setLoading(false));
                  navigate("/", {
                    state: {
                      logout: true,
                    },
                  });
                }
              }}
            />
            <div style={{ marginTop: "10px" }}></div>
            <ButtonComp
              text={"Proceed"}
              maxWidth={"100%"}
              onClick={async () => {
                const isCorrectPassword = await WalletHelper.verifyPassword(password);
                if (!isCorrectPassword) {
                  return messageApi.error("Incorrect password provided.");
                }
                else{
                  store.dispatch(setLoading(true));
                await WalletHelper.logout();
                store.dispatch(setLoading(false));
                navigate("/", {
                  state: {
                    logout: true,
                  },
                });
                }
              }}
            />
          </div>
        </ModalCustom>

        <ModalCustom
          title={"Logout"}
          handleCancel={handleLogoutCancel}
          isModalOpen={isLogoutModalOpen}
          handleOk={handlLogouteOk}
          customClass="customClassModal"
        >
          <div className="viewphrases">
            <div className="viewphrases__iInner">
              <img src={warning} />
              <div>
                <p>
                  By resetting, all wallets you have saved within the Qubetics Extension
                  will be erased. Please make sure you have each wallet's
                  12-word seed phrase written down before resetting.
                </p>
              </div>
            </div>
            <ButtonComp
              text={"Proceed"}
              maxWidth={"100%"}
              onClick={async () => {
                setOpenmodal(true);
              }}
            />
          </div>
        </ModalCustom>
      </div>
    </div>
  );
}

export default Setting;
