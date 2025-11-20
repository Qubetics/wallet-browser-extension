/*global chrome*/

import React, { useEffect, useState } from "react";
import "./Welcome.scss";
import { Link, useLocation, useNavigate } from "react-router-dom";
import darkclose from "../../Assets/darkclose.svg";
import ModalCloseIcon from "../../Assets/ModalCloseIcon.svg";
// import AppLogo from "../../Assets/appLogo.svg";
// import DarkAppLogo from "../../Assets/darkAppLogo.svg";
import { useSelector } from "react-redux";
import Lottie from "react-lottie-player";
import Logo from "../../Assets/JsonFiles/LogoV1.json"
// import MainLogo from "../../Assets/main-logo.gif";

function WelcomeScreen() {
  const navigate = useNavigate();
  const [isLegalAppear, setIsLegalAppear] = useState(true);
  const { create } = useSelector((state) => state);

  const init = async () => {
    const tabs = await chrome.tabs.getCurrent();
    const isSidePanelOpen = await chrome.storage.local.get("openSidePanel");

    const { legalPolicy } = await chrome.storage.local.get("legalPolicy");
    if (legalPolicy === undefined) {
      await chrome.storage.local.set({
        legalPolicy: true,
      });
    }
    setIsLegalAppear(legalPolicy);
    if (!tabs && !isSidePanelOpen.openSidePanel) {
      if (create) {
        return chrome.tabs.create({ url: "index.html#add-wallet" });
      }
      return chrome.tabs.create({ url: "index.html#" });
    }
    return true;
  };

  const { auth, theme } = useSelector((state) => state);

  const getLocation = useLocation();
  const path = getLocation.pathname.replace("/", "");

  useEffect(() => {
    init();

    if (auth && path !== "add-wallet") {
      navigate("/wallet");
    }
  }, []);
  
  return (
    <div className="cardWhite">
      <h2 className="cardWhite__title">Welcome to Qubetics</h2>
      <div className="cardWhite_mainLogo">
        <Lottie loop animationData={Logo} play style={{ height: 280 }} />
        {/* <img src={MainLogo} alt="logo" /> */}
      </div>

      <div className="cardWhite__linkOuter bottomBtn">
        <Link
          className="cardWhite__linkOuter__lytblue"
          to={"/terms-policy"}
          onClick={async (e) => {
            e.preventDefault();
            await chrome.storage.session.set({ walletFlowType: "import" });
            navigate("/terms-policy", {
              state: { type: "import" },
            });
          }}
        >
          <span className="cardWhite__linkOuter__linkImage">
            I already have a wallet
          </span>
        </Link>
{/* //    genre swim struggle survey craft empty ghost monster orient play hobby exercise */}
        <Link
          to={"/terms-policy"}
          className="cardWhite__linkOuter__darkBlue"
          onClick={async (e) => {
            e.preventDefault();
            await chrome.storage.session.set({ walletFlowType: "create" });
            // navigate("/createNewWallet", {
            navigate("/terms-policy", {
              state: { type: "create" },
            });
          }}
        >
          <span className="cardWhite__linkOuter__linkImage">
            {/* <img src={PlusBordredIcon} width={20} height={20} /> */}
            Create a new wallet
          </span>
          {/* <span>
            <img src={ArrowRightIcon} width={8} height={15} />
          </span> */}
        </Link>
      </div>
    </div>
  );
}

export default WelcomeScreen;
