import React, { useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { QRCode } from "react-qrcode-logo";
import { message } from "antd";
import CopyIcon from "../../Assets/CopyIcon.svg";
import "./Receive.scss";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { Link } from "react-router-dom";

function ReceiveCurrency() {
  const [selectedCoin, setSelectedCoin] = useState({
    wallet_address: "your-wallet-address", // Replace with actual address or dynamic data
    coin: {
      coin_image: "path-to-coin-image", // Replace with actual coin image
      coin_symbol: "BTC", // Replace with actual coin symbol
    },
  });
  const messageApi = message.useMessage()[0];

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      messageApi.success("Address copied successfully.");
    } catch (error) {
      messageApi.error("Failed to copy address.");
    }
  };

  return (
    <div className="receiveCurrency">
      <MenuRestofHeaders backTo={"/receive-tokens"} title={"Receive BTC"} />
      <div className="receiveCurrency_content scrollableCont">
        <div className={`flexedContent`}>
          <div className="receiveCurrency_balanceDetails">
            <QRCode
              value={selectedCoin.wallet_address}
              size={230}
              qrStyle="square"
              eyeRadius={10}
              logoImage={selectedCoin.coin.coin_image}
              logoHeight={55}
              logoWidth={55}
              logoPadding={8}
              logoPaddingStyle="circle"
              // style={{
              //   borderRadius: "20px",
              //   padding: "15px",
              // }}
            />
          </div>
          <div className="receiveCurrency_copy">
            <div>
              <p>Your Qubetics Address</p>
              <h5>bnb1fwfhpkmhcsh4vzaaax</h5>
            </div>
            <ButtonComp
              text={
                <span className="copyText">
                  Copy <img src={CopyIcon} alt="copy" />
                </span>
              }
              maxWidth={"88px"}
            />
          </div>

          <p className="receiveCurrency_sendCoin">
            Lorem ipsum dolor sit amet consectetur. Pulvinar risus eget nulla in
            pretium sit. Purus placerat vulputate in vulputate venenatis
            adipiscing quis maecenas auctor.
            <br />
            <Link>Learn more </Link>
             about ERC-20 tokens.
          </p>
          <ButtonComp text={"share your address"} maxWidth={"100%"} />
        </div>
      </div>
    </div>
  );
}

export default ReceiveCurrency;
