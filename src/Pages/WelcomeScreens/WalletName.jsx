import React, { useState } from "react";
import "./Welcome.scss"
import { InputFieldOnly } from "../../Components/InputField/InputFieldSimple.jsx";
function WalletName() {
  const [name, setName] = useState(null);

  return (
    <>
      <div className="cardWhite">
        <h2 className="cardWhite__title">Wallet Name</h2>
        <p className="cardWhite__subTitle">
          You can simply identify multiple wallets and label your own wallet.4
        </p>
        <div className="cardWhite__linkOuter">
          <InputFieldOnly placeholder={"Token Name"} label='Amount' />
          <div className="send__infoText">0 BTC ~ $88.02</div>
        </div>
      </div>
    </>
  );
}

export default WalletName;
