import React, { useCallback, useEffect, useState } from "react";
import MenuRestofHeaders from "../../BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import "./AccountDetails.scss";
import ButtonComp from "../../ButtonComp/ButtonComp";
import QubeticsImage from "../../../Assets/QubeticsLogo.png";
import RefreshIcon from "../../../Assets/Refresh.png";
import { useSelector } from "react-redux";
import { getTicsBalance } from "../../../services/dvpn";
import { message } from "antd";

const TICS_DENOM_DECIMALS = {
  qtics: 18,
  qtis: 18,
  utics: 6,
  tics: 0,
};

const toDisplayTics = (rawAmount, denom) => {
  const amount = Number(rawAmount || 0);
  if (!Number.isFinite(amount) || amount <= 0) return "0.00 TICS";
  const normalizedDenom = String(denom || "").toLowerCase();
  const decimals = TICS_DENOM_DECIMALS[normalizedDenom];
  if (typeof decimals === "number") {
    const divisor = 10 ** decimals;
    return `${(amount / divisor).toFixed(2)} TICS`;
  }
  return `${amount.toFixed(2)} TICS`;
};

function AccountDetails() {
  const { account } = useSelector((state) => state);
  const accountAddress =
    account?.coinFamilyAndAddress?.cosmos || account?.coinFamilyAndAddress?.[7] || "";
  const [ticsBalance, setTicsBalance] = useState("0.00 TICS");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchTicsBalance = useCallback(async () => {
    if (!accountAddress) {
      setTicsBalance("0.00 TICS");
      return;
    }
    try {
      setLoadingBalance(true);
      const balance = await getTicsBalance({ walletAddress: accountAddress });
      setTicsBalance(toDisplayTics(balance?.amount || "0", balance?.denom));
    } catch (error) {
      setTicsBalance("0.00 TICS");
    } finally {
      setLoadingBalance(false);
    }
  }, [accountAddress]);

  useEffect(() => {
    fetchTicsBalance();
  }, [fetchTicsBalance]);

  const formatAddress = (address) => {
    if (!address) return "Not available";
    if (address.length <= 18) return address;
    return `${address.slice(0, 11)}...${address.slice(-9)}`;
  };

  const handleCopyAddress = async () => {
    if (!accountAddress) return;
    try {
      await navigator.clipboard.writeText(accountAddress);
      messageApi.destroy();
      messageApi.success("Address copied successfully.");
    } catch (error) {
      messageApi.destroy();
      messageApi.error("Failed to copy address.");
    }
  };

  return (
    <div className={`scrollableCont`} style={{ hight: "auto" }}>
      {contextHolder}
      <div className="searchBarFixed">
        <MenuRestofHeaders title={"Account Details"} backTo={"/dvpnSetting"} />
      </div>
      <div className="credits-panel">
        <div className="account-content">
          <div className="credits-box">
            <div className="left">
              <div className="icon">
                <img src={QubeticsImage} alt="TICS" />
              </div>
              <div className="text">
                <div className="label"><h3>Your Credits</h3></div>
                <div className="amount"><h2>{loadingBalance ? "Loading..." : ticsBalance}</h2></div>
              </div>
            </div>
            <div className="refresh" onClick={fetchTicsBalance}>
              <img src={RefreshIcon} alt="Refresh" />
            </div>
          </div>

          <div className="account-row">
            <h3>Account Address</h3>
            <p>{formatAddress(accountAddress)}</p>
          </div>
        </div>

        <div className="buttons bottomBtn">
          <ButtonComp
            text={"Copy Address"}
            maxWidth={"100%"}
            height={"58px"}
            onClick={handleCopyAddress}
          />
        </div>
      </div>
    </div>
  );
}

export default AccountDetails;
