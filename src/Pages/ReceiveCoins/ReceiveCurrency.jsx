import React, { useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { QRCode } from "react-qrcode-logo";
import { message } from "antd";
import CopyIcon from "../../Assets/CopyIcon.svg";
import "./Receive.scss";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { Link, useLocation } from "react-router-dom";

function ReceiveCurrency() {
  const [selectedCoin, setSelectedCoin] = useState({
    wallet_address: "your-wallet-address", // Replace with actual address or dynamic data
    coin: {
      coin_image: "path-to-coin-image", // Replace with actual coin image
      coin_symbol: "BTC", // Replace with actual coin symbol
    },
  });
  const messageApi = message.useMessage()[0];
  const location = useLocation();

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      messageApi.success("Address copied successfully.");
    } catch (error) {
      messageApi.error("Failed to copy address.");
    }
  };

  // Check if the current path is /receive-currency
  const isReceiveCurrencyRoute = location.state?.nftButton;
  console.log(location, "Location");
  return (
    <div className="receiveCurrency scrollableCont">
      <MenuRestofHeaders backTo={"/receive-tokens"} title={"Receive BTC"} />
      <div className="receiveCurrency_content  manageWalletHeight">
        <div className={`flexedContent padding-Top`}>
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
            <Link style={{ textDecoration: "none" }}>Learn more </Link>
            about ERC-20 tokens.
          </p>
        </div>
        <div style={{ padding: "0 24px" }}>
          {isReceiveCurrencyRoute ? (
            <div className="shareBtn">
              <div className="cancelBtn">
                <ButtonComp text={"Share"} maxWidth={"100%"} />
              </div>
              <ButtonComp text={"Address Book"} maxWidth={"100%"} />
            </div>
          ) : (
            <ButtonComp text={"Share Your Address"} maxWidth={"100%"} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ReceiveCurrency;
