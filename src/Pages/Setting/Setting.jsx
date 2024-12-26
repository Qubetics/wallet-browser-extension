/*global chrome*/
import React, { useEffect, useState } from "react";
import SettingList from "../../Components/SettingList/SettingList.jsx";
import Download from "../../Assets/download.svg";
import Useredit from "../../Assets/useredit.svg";
import Eyes from "../../Assets/eyes.svg";
import CurrencyIcons from "../../Assets/settings/currency.svg";
import NativeCurrency from "../../Assets/settings/NativeCurrency.svg";
import Editable from "../../Assets/editable.svg";
import AddressBook from "../../Assets/settings/address.svg";
import HelpDark from "../../Assets/help-dark.png";
import HelpLight from "../../Assets/help-light.png";
// import Security from "../../Assets/settings/ic_privcay.png";
import ModalCustom from "../../Components/ModalCustom/ModalCustom.jsx";
import InputFieldSimple from "../../Components/InputField/InputFieldSimple.jsx";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import "./Setting.scss";
import warning from "../../Assets/PNG/warning.png";
import LogoutIcon from "../../Assets/settings/logout.svg";
import DarkLogout from "../../Assets/settings/darkLogout.svg";
import ModalCloseIcon from "../../Assets/ModalCloseIcon.svg";
import darkclose from "../../Assets/darkclose.svg";
import JoinCom from "../../Assets/joinIcon.svg";
import ThemeIcon from "../../Assets/themeIcon.svg";
import Create from "../../Assets/settings/create.png";
import Price from "../../Assets/settings/price.png";
import Terms from "../../Assets/settings/term.svg";
import darkterm from "../../Assets/settings/Darkterms.svg";
import Wallets from "../../Assets/settings/wallet1.svg";
import WatchOnly from "../../Assets/settings/watch-only.png";
import darkCurrencyIcons from "../../Assets/settings/darkCurrencyIcons.svg";
import Insta from "../../Assets/Insta.svg";
import SnapChat from "../../Assets/snapchat.svg";
import facebookIcon from "../../Assets/facebook.svg";
import twiter from "../../Assets/twitter.svg";
import linkin from "../../Assets/linkIn.svg";
import HistoryList from "../../Assets/his.svg";
import darkChangePin from "../../Assets/settings/darkChangeoin.svg";
import ChangePin from "../../Assets/settings/changepin.svg";
import darkAddressBook from "../../Assets/settings/DarkAdressBook.svg";
import darkHistoryList from "../../Assets/settings/DarkTransaction.svg";
import darkThemeIcon from "../../Assets/settings/DarkTheme.svg";
import darkJoinCom from "../../Assets/settings/DarkJoin.svg";
// import darkSecurity from "../../Assets/settings/DarkPrivacy.svg";
import watsapp from "../../Assets/watsapp.svg";
import { Link, useNavigate } from "react-router-dom";
import { WalletHelper } from "../../helpers/wallet.helper.js";
import { Drawer, message } from "antd";
import { store } from "../../index.js";
import { setLoading } from "../../actions/loading.js";
import { DURATION } from "../../config/message.config.js";
import { useSelector } from "react-redux";
import { server } from "../../server.js";
import { generateString } from "../../helpers/common.helper.js";
import { setAuth } from "../../actions/auth.js";
import Security from "../../Assets/settings/Security.svg";
import AboutUs from "../../Assets/settings/AboutUs.svg";
import PrivacyPolicy from "../../Assets/settings/PrivacyPolicy.svg";
import Transactionhistory from "../../Assets/settings/Transactionhistory.svg";
import Preference from "../../Assets/settings/Preference.svg";
import Logout from "../../Assets/settings/Logout.svg";

function Setting() {
  const ZENDESK_KEY = "REDACTED";
  const [open, setOpen] = useState(false);
  const [openHelp, setOpenHelp] = useState(false);

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
    {
      setinglist: "About Us",
      to: "/",
      ticketcheck: theme == "darkTheme" ? AboutUs : AboutUs,
      RightArow: "true",
    },
    {
      setinglist: "Privacy Policy",
      to: "/",
      ticketcheck: theme == "darkTheme" ? PrivacyPolicy : PrivacyPolicy,
      RightArow: "true",
    },
    {
      setinglist: "Transactions History",
      to: "/history",
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
              getData={setPassword}
              customFunction={async () => {
                const { password: sessionPassword } =
                  await chrome.storage.session.get("password");

                if (sessionPassword !== password) {
                  return messageApi.error("Incorrect password provided.");
                }

                store.dispatch(setLoading(true));
                await WalletHelper.logout();
                store.dispatch(setLoading(false));
                navigate("/", {
                  state: {
                    logout: true,
                  },
                });
              }}
            />
            <div style={{ marginTop: "10px" }}></div>
            <ButtonComp
              text={"Proceed"}
              maxWidth={"100%"}
              onClick={async () => {
                const { password: sessionPassword } =
                  await chrome.storage.session.get("password");

                if (sessionPassword !== password) {
                  return messageApi.error("Incorrect password provided.");
                }

                store.dispatch(setLoading(true));
                await WalletHelper.logout();
                store.dispatch(setLoading(false));
                navigate("/", {
                  state: {
                    logout: true,
                  },
                });
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
                  By resetting, all wallets you have saved within the Qubetics App
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
