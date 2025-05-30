import React from "react";
import "./footer.scss";
// import WalletIcon from "../../Assets/walletIcon.svg";
// import AlertIcon from "../../Assets/Alerts.svg";
// import SettignIcon from "../../Assets/SettignIcon.svg";
import { Link, useLocation } from "react-router-dom";
// import Browser from "../../Assets/broswer.svg";
// import portfolioIcon from "../../Assets/portfolioIcon.svg";
import {
  AlertsIcon,
  BrowserIcon,
  PortfolioIcon,
  SettignIcon,
  WalletIcon,
} from "../../Assets/SvgImg.jsx";

function MenuFooter() {
  const getLocation = useLocation();
  const path = getLocation.pathname.replace("/", "");

  return (
    <>
      <div className="menuItems">
        <Link
          to={
            path === "wallet"
              ? "/wallet"
              : path === "walletListing"
              ? "/wallet"
              : "/wallet"
          }
          // onClick={() => setactiveLink("wallet")}
          className={`${"menuItems__items"} ${
            path === "wallet" ? "itemsActive" : ""
          }`}
        >
          <div className="img">
            {/* <img src={WalletIcon} /> */}
            <WalletIcon />
          </div>
          {/* <span className='title'>Wallets</span> */}
        </Link>
        <Link
          to="/swap"
          // onClick={() => setactiveLink("defi")}
          className={`${"menuItems__items"} ${path === "swap" ? "itemsActive" : ""}`}
        >
          <div className="img">
            {/* <img src={AlertIcon} /> */}

            <AlertsIcon />
          </div>
          {/* <span className='title'>Swap</span> */}
        </Link>
        <Link
          to="/portfolio"
          // onClick={() => setactiveLink("setting")}
          className={`${"menuItems__items"} ${
            path === "portfolio" ? "itemsActive" : ""
          }`}
        >
          <div className="img">
            {/* <img src={portfolioIcon} /> */}
            <PortfolioIcon />
          </div>
          {/* <span className='title'>Portfolio</span> */}
        </Link>
        <Link
          to="/conectswapedApp"
          // onClick={() => setactiveLink("defi")}
          className={`${"menuItems__items"} ${
            path === "conectswapedApp" ? "itemsActive" : ""
          }`}
        >
          <div className="img">
            {/* <img src={Browser} /> */}
            <BrowserIcon />
          </div>
          {/* <span
            className='title'
            style={{
              position: 'relative',
              top: '4px',
            }}
          >
            DApp
          </span> */}
        </Link>

        <Link
          to="/setting"
          // onClick={() => setactiveLink("setting")}
          className={`${"menuItems__items"} ${
            path === "setting" ? "itemsActive" : ""
          }`}
        >
          <div className="img">
            {/* <img src={SettignIcon} /> */}
            <SettignIcon />
          </div>
          {/* <span className='title'>Settings</span> */}
        </Link>
      </div>
    </>
  );
}

export default MenuFooter;
