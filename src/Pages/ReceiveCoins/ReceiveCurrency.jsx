import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { QRCode } from "react-qrcode-logo";
import { message } from "antd";
import CopyIcon from "../../Assets/CopyIcon.svg";
import "./Receive.scss";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

function ReceiveCurrency() {
  const [selectedCoin, setSelectedCoin] = useState({
    wallet_address: "your-wallet-address", // Replace with actual address or dynamic data
    coin: {
      coin_image: "path-to-coin-image", // Replace with actual coin image
      coin_symbol: "BTC", // Replace with actual coin symbol
    },
  });
  const { account } = useSelector((state) => state);

  const [messageApi, contextHolder] = message.useMessage();
  const location = useLocation();
  console.log("LOCATION IN RECIEVE", location);

  useEffect(() => {
    const coin = {
      wallet_address: location?.state?.coin?.wallet_address, // Replace with actual address or dynamic data

      coin: {
        coin_image: location?.state?.coin?.coin?.coin_image, // Replace with actual coin image

        coin_symbol: location?.state?.symbol, // Replace with actual coin symbol
      },
    };

    setSelectedCoin(coin);
  }, []);

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

  function goToBack(address) {
    navigator.clipboard.writeText(address);
    messageApi.success("Address copied successfully.");
  }

  return (
    <div className="receiveCurrency scrollableCont">
      {contextHolder}
      <MenuRestofHeaders
        backTo={isReceiveCurrencyRoute?"/nftDetail":"/receive-tokens"}
        title={
          isReceiveCurrencyRoute
            ? `Receive NFT`
            : `Receive ${location?.state?.symbol?.toUpperCase()}`
        }
      />
      <div className="receiveCurrency_content  manageWalletHeight">
        <div className={`flexedContent padding-Top`}>
          <div className="receiveCurrency_balanceDetails">
            <QRCode
              value={
                isReceiveCurrencyRoute
                  ? account?.coinFamilyAndAddress[2]
                  : selectedCoin.wallet_address
              }
              size={230}
              qrStyle="dots"
              eyeRadius={10}
              logoImage={
                isReceiveCurrencyRoute ? null : selectedCoin.coin.coin_image
              }
              logoHeight={55}
              logoWidth={55}
              logoPadding={8}
              logoPaddingStyle="circle"
              bgColor="#000"
              fgColor="#fff"
            />
          </div>
          <div className="receiveCurrency_copy">
            <div>
              <p>Your Qubetics Address</p>
              {/* <h5>{selectedCoin.wallet_address?.substring(0, 15)}...</h5> */}
              <h5>
                {isReceiveCurrencyRoute
                  ? `${account?.coinFamilyAndAddress[2].slice(0, 15)}...`
                  : `${selectedCoin.wallet_address.slice(0, 15)}...`}
              </h5>
            </div>
            <ButtonComp
              onClick={() =>
                isReceiveCurrencyRoute
                  ? goToBack(account?.coinFamilyAndAddress[2])
                  : goToBack(selectedCoin.wallet_address)
              }
              text={
                <span className="copyText">
                  Copy <img src={CopyIcon} alt="copy" />
                </span>
              }
              maxWidth={"88px"}
            />
          </div>

          {/* <p className="receiveCurrency_sendCoin">
            Lorem ipsum dolor sit amet consectetur. Pulvinar risus eget nulla in
            pretium sit. Purus placerat vulputate in vulputate venenatis
            adipiscing quis maecenas auctor.
            <br />
            <Link style={{ textDecoration: "none" }}>Learn more </Link>
            about {`${location?.state?.symbol?.toUpperCase()}`} tokens.
          </p> */}
        </div>
        {/* <div style={{ padding: "0 24px" }}>
          {isReceiveCurrencyRoute ? (
            <div className="shareBtn">
              <div className="cancelBtn">
                <ButtonComp text={"Share"} maxWidth={"100%"} />
              </div>
              <ButtonComp text={"Address Book"} maxWidth={"100%"} />
            </div>
          ) : (
            // <ButtonComp text={"Share Your Address"} maxWidth={"100%"} />
            ""
          )}
        </div> */}
      </div>
    </div>
  );
}

export default ReceiveCurrency;
