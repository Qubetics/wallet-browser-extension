/*global chrome*/

import React, { useEffect, useState } from "react";
import "./Welcome.scss";
import PlusBordredIcon from "../../Assets/PlusBordredIcon.svg";
import RefreshIcon from "../../Assets/RefreshIcon.svg";
import ArrowRightIcon from "../../Assets/ArrowRightIcon.svg";
import { Link, useLocation, useNavigate } from "react-router-dom";
import darkclose from "../../Assets/darkclose.svg";
import ModalCloseIcon from "../../Assets/ModalCloseIcon.svg";
import Wallet from "../../Assets/wallet.svg";
import AppLogo from "../../Assets/appLogo.svg";
import DarkAppLogo from "../../Assets/darkAppLogo.svg";
import { useSelector } from "react-redux";
import Lottie from "react-lottie-player";
import AttlasWallet from "../../Assets/JsonFiles/walletAnimation.json";
function WelcomeScreen() {
  const navigate = useNavigate();
  const [isLegalAppear, setIsLegalAppear] = useState(true);
  const { create } = useSelector((state) => state);




  const init = async () => {
    const tabs = await chrome.tabs.getCurrent();
    const isSidePanelOpen = await chrome.storage.local.get('openSidePanel');

    const { legalPolicy } = await chrome.storage.local.get("legalPolicy");
    // console.log("Init Legal:::",legalPolicy);
    if (legalPolicy === undefined) {
      // console.log("in tha condi:::");
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
  // console.log("isLegalAppear:::", isLegalAppear);
  return (
    <div className="cardWhite">
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {theme === "darkTheme" ? (
          <img src={DarkAppLogo} />
        ) : (
          <img src={AppLogo} />
        )}
        {create ? (
          <div
            className="crosIconCard"
            onClick={() => {
              return navigate("/walletListing");
            }}
          >
            {theme == "darkTheme" ? (
              <img src={darkclose} />
            ) : (
              <img src={ModalCloseIcon} />
            )}
          </div>
        ) : null}
      </div>

      <div className="jsonWalletBg">
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Lottie
            animationData={AttlasWallet}
            style={{ width: 190, height: 160 }}
            loop
            play
          />
        </div>
      </div>
      <h2 className="cardWhite__title">
        You Already Know <br />
        How To Use It...
      </h2>
      <div className="cardWhite__linkOuter">
        <Link
          className="cardWhite__linkOuter__lytblue"
          to={isLegalAppear ? "/legal" : "/createNewWallet"}
          onClick={(e) => {
            e.preventDefault();
            navigate(isLegalAppear ? "/legal" : "/createNewWallet", {
              state: { type: "import" },
            });
          }}
        >
          <span className="cardWhite__linkOuter__linkImage">
            {/* <img src={RefreshIcon} width={20} height={20} /> */}
            Import Existing Wallet
          </span>
          {/* <span>
            <img src={ArrowRightIcon} width={8} height={15} />
          </span> */}
        </Link>
        {/* <div className="cardWhite__linkOuter__hr"></div> */}

        {/* <div className="cardWhite__linkOuter__hr"></div> */}
        <Link
          className="cardWhite__linkOuter__lytblue"
          to={isLegalAppear ? "/legal" : "/watch-list"}
          onClick={(e) => {
            e.preventDefault();
            navigate(isLegalAppear ? "/legal" : "/watch-list", {
              state: { type: "watch-list" },
            });
          }}
        >
          <span className="cardWhite__linkOuter__linkImage">
            {/* <img src={Wallet} width={20} height={20} /> */}
            Watch-Only Wallet
          </span>
          {/* <span>
            <img src={ArrowRightIcon} width={8} height={15} />
          </span> */}
        </Link>

        <Link
          to={isLegalAppear ? "/legal" : "/createNewWallet"}
          className="cardWhite__linkOuter__darkBlue"
          onClick={(e) => {
            e.preventDefault();
            navigate(isLegalAppear ? "/legal" : "/createNewWallet", {
              state: { type: "create" },
            });
          }}
        >
          <span className="cardWhite__linkOuter__linkImage">
            {/* <img src={PlusBordredIcon} width={20} height={20} /> */}
            Create New Wallet
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
