import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import leftImg from "../Assets/leftImg.svg";

function WelcomeLayout() {
  const { theme } = useSelector((state) => state);
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;

  const routeData = {
    "/terms-policy": {
      heading: "Legal",
      subHeading:
        "Please review the Qubetics Extension Privacy Policy.",
    },
    "/createNewWallet": {
      heading: "Wallet Name",
      subHeading:
        "You can label your own wallet and manage multiple wallets here.",
    },
    "/setPassword": {
      // heading: "Create Password",
    },
  };

  const defaultData = { heading: "", subHeading: "" };
  const { heading, subHeading } = routeData[path] || defaultData;

  const isDoubleThemeRoute = ["", "createNewWallet"].includes(
    path.split("/")[1]
  );

  const layoutHeader = (
    <div className="WelcomeLayout__header">
      <button
        className="WelcomeLayout__back-button"
        onClick={() => navigate(-1)}
      >
        <img src={leftImg} alt="backBtn" />
      </button>
      <h3 className="WelcomeLayout__heading">{heading}</h3>
      <p className="welcomeScreens-text">{subHeading}</p>
    </div>
  );

  return (
    <div className={`WelcomeLayout ${theme === "dark" ? "dark-theme" : ""}`}>
      <div className="WelcomeLayout__container">
        <Outlet context={{ layoutHeader }} />
      </div>
    </div>
  );
}

export default WelcomeLayout;
