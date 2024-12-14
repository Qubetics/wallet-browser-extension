import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import leftImg from "../Assets/leftImg.svg";

function WelcomeLayout() {
  const { theme } = useSelector((state) => state); // Access theme from Redux
  const location = useLocation(); // Get the current path
  const navigate = useNavigate(); // Navigate programmatically

  const path = location.pathname;

  const routeData = {
    "/terms-policy": {
      heading: "Legal",
      subHeading:
        "Please review the Qubetics Wallet Terms of Service and Privacy Policy.",
    },
    "/createNewWallet": {
      heading: "Wallet Name",
      subHeading:
        "You can label your own wallet and manage multiple wallets here.",
    },
    "/setPassword": {
      heading: "Create Password",
    },
    "/add-secret-phrase": {
      heading: "Write Down Your Seed Phrase",
      subHeading:
        "This is your seed phrase. Write it down on a paper and keep it in a safe place. You'll be asked to re-enter this phrase (in order) on the next step.",
    },
  };

  const defaultData = { heading: "", subHeading: "" };
  const { heading, subHeading } = routeData[path] || defaultData;

  // Define whether the current route supports a dual theme
  const isDoubleThemeRoute = ["", "createNewWallet"].includes(
    path.split("/")[1]
  );

  const layoutHeader = (
    <div className="WelcomeLayout__header">
      <button
        className="WelcomeLayout__back-button"
        onClick={() => navigate(-1)} // Navigate to the previous page
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
