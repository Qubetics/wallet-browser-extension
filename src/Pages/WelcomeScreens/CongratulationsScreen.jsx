import React from "react";
import "./Welcome.scss";
import Lottie from "react-lottie-player";
import Congratulations from "../../Assets/JsonFiles/Congratulations.json";
import WalletCreated from "../../Assets/WalletCreated .gif";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
function CongratulationsScreen() {
  return (
    <div className="setPassword__secretPharse walletReady">
      <img src={WalletCreated} alt="WalletCreated " width={"308px"} />
      <h1>ALL DONE!</h1>
      <p>Wallet Created Successfully</p>
      <ButtonComp text={"Continue"} maxWidth={"100%"} />
    </div>
  );
}

export default CongratulationsScreen;
