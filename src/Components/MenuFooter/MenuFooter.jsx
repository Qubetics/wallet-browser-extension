import React, { useEffect, useMemo, useState } from "react";
import "./footer.scss";
import { Link, useLocation } from "react-router-dom";
import {
  AlertsIcon,
  BrowserIcon,
  DVpnIcon,
  HomeDVpnIcon,
  PortfolioIcon,
  RecentSessionsIcon,
  ServersIcon,
  SettignIcon,
  WalletIcon,
} from "../../Assets/SvgImg.jsx";
import { findRunningAgent } from "../../services/dvpn";

function MenuFooter() {
  const getLocation = useLocation();
  const path = getLocation.pathname.replace("/", "");
  const dvpnRoutes = useMemo(
    () =>
      new Set([
        "dvpn",
        "recentSessions",
        "servers",
        "serversDetails",
        "serversNodes",
        "dvpnSetting",
        "service-provider",
      ]),
    []
  );
  const isDvpnMenu = dvpnRoutes.has(path);
  const [agentReachable, setAgentReachable] = useState(null);
  const [isAdminRequired, setIsAdminRequired] = useState(false);

  useEffect(() => {
    if (!isDvpnMenu) {
      setAgentReachable(null);
      return undefined;
    }

    let cancelled = false;
    const check = async () => {
      const result = await findRunningAgent().catch(() => ({ reachable: false }));
      if (!cancelled) {
        setAgentReachable(!!result?.reachable);
        setIsAdminRequired(result?.reachable && result?.diag?.is_admin === false);
      }
    };

    check();
    const poll = setInterval(check, 2000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [isDvpnMenu]);

  const disableDvpnLinks = agentReachable === false || isAdminRequired === true;
  const disabledClass = disableDvpnLinks ? "isDisabled" : "";
  const preventIfDisabled = (event) => {
    if (!disableDvpnLinks) return;
    event.preventDefault();
    event.stopPropagation();
  };
  return (
    <>
      {!isDvpnMenu ? (
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
            className={`${"menuItems__items"} ${path === "wallet" ? "itemsActive" : ""
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
            className={`${"menuItems__items"} ${path === "portfolio" ? "itemsActive" : ""
              }`}
          >
            <div className="img">
              <PortfolioIcon />
            </div>
          </Link>
          <Link
            to="/conectswapedApp"
            // onClick={() => setactiveLink("defi")}
            className={`${"menuItems__items"} ${path === "conectswapedApp" ? "itemsActive" : ""
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
            to="/dvpn"
            className={`${"menuItems__items"} ${path === "dvpn" ? "itemsActive" : ""
              }`}
          >
            <div className="img">
              <DVpnIcon />
            </div>
          </Link>
          <Link
            to="/setting"
            // onClick={() => setactiveLink("setting")}
            className={`${"menuItems__items"} ${path === "setting" ? "itemsActive" : ""
              }`}
          >
            <div className="img">
              {/* <img src={SettignIcon} /> */}
              <SettignIcon />
            </div>
            {/* <span className='title'>Settings</span> */}
          </Link>
        </div>
      ) : (
        <div className="menuItems">
          <Link
            to="/dvpn"
            className={`${"menuItems__items"} ${path === "dvpn" ? "itemsActive" : ""
              }`}
          >
            <div className="img">
              <HomeDVpnIcon className="strokeFill" />
            </div>
          </Link>

          <Link
            to="/wallet"
            className={`${"menuItems__items"} ${path === "wallet" ? "itemsActive" : ""
              }`}
          >
            <div className="img">
              <WalletIcon />
            </div>
          </Link>
          <Link
            to="/recentSessions"
            className={`${"menuItems__items"} ${path === "recentSessions" ? "itemsActive" : ""
              } ${disabledClass}`}
            onClick={preventIfDisabled}
            aria-disabled={disableDvpnLinks}
          >
            <div className="img">
              <RecentSessionsIcon />
            </div>
          </Link>
          <Link
            to="/service-provider"
            className={`${"menuItems__items"} ${["service-provider", "servers", "serversDetails", "serversNodes"].includes(path) ? "itemsActive" : ""
              } ${disabledClass}`}
            onClick={preventIfDisabled}
            aria-disabled={disableDvpnLinks}
          >
            <div className="img">
              <ServersIcon className="strokeFill" />
            </div>
          </Link>
          <Link
            to="/dvpnSetting"
            className={`${"menuItems__items"} ${path === "dvpnSetting" ? "itemsActive" : ""
              } ${disabledClass}`}
            onClick={preventIfDisabled}
            aria-disabled={disableDvpnLinks}
          >
            <div className="img">
              <SettignIcon />
            </div>
          </Link>
          
        </div>
      )}
    </>
  );
}

export default MenuFooter;
