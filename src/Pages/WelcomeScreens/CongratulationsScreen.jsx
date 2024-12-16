import React from "react";
import "./Welcome.scss";
import Lottie from "react-lottie-player";
import Congratulations from "../../Assets/JsonFiles/Congratulations.json";
import WalletCreated from "../../Assets/WalletCreated .gif";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { useNavigate } from "react-router-dom";
function CongratulationsScreen() {
  const navigate = useNavigate();
  return (
    <div className="setPassword__secretPharse walletReady">
      <img src={WalletCreated} alt="WalletCreated " width={"308px"} />
      <h1>ALL DONE!</h1>
      <p>Wallet Created Successfully</p>
      <ButtonComp
        text={"Continue"}
        maxWidth={"100%"}
        onClick={() => navigate("/wallet")}
      />
    </div>
  );
}

export default CongratulationsScreen;
