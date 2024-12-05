import React from "react";
import "./Welcome.scss";
import Lottie from "react-lottie-player";
import Congratulations from "../../Assets/JsonFiles/Congratulations.json";

function CongratulationsScreen({ children }) {
  return (
    <div className='setPassword__secretPharse'>
      <div style={{ display: "flex", justifyContent: "center" }}></div>
      <p
        className='setPassword__secretPharse__grayText'
        style={{ marginBottom: "36px" }}
      >
        Your Wallet Is Ready!
      </p>
      {children}
    </div>
  );
}

export default CongratulationsScreen;
