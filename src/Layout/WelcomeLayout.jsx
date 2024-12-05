import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Logo from "../Assets/Logo.png";
import DarkLogo from "../Assets/DarkLogo.svg";
import { useSelector } from "react-redux";
// import style from "../Pages/WelcomeScreens/style.module.scss";

function WelcomeLayout() {
  const { theme } = useSelector((state) => state);

  const location = useLocation();
  let path = location.pathname;
  const splitPaths = path.split("/")[1];
  const { create } = useSelector((state) => state);
  const isDoubleThemeRoute = ["", "createNewWallet"].includes(splitPaths);
  return (
    <div className={"WelcomeLayout"}>
      <div className='WelcomeLayout__container'>
        {create
          ? null
          : !isDoubleThemeRoute && (
              <div className='WelcomeLayout__logo'>
                {/* {theme === "darkTheme" ? ( */}
                <img src={Logo} />
                {/* ) : ( */}
                {/* <img src={DarkLogo} /> */}
                {/* )} */}
              </div>
            )}

        <Outlet />
      </div>
    </div>
  );
}

export default WelcomeLayout;
