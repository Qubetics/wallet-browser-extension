/*global chrome*/
import React, { useEffect, useState } from "react";
import "./ManageCustom.scss";

import { message, Switch } from "antd";
import { useSelector } from "react-redux";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { server } from "../../server";
import { WalletHelper } from "../../helpers/wallet.helper";

function ManageCustom(props) {
  const [messageApi, contextHolder] = message.useMessage();

  const { account } = useSelector((state) => state);
  const {
    name,
    currency,
    img,
    valuecurrency,
    status,
    id,
    coinFamily,
    walletAddress,
    symbol,
    coin,
  } = props;

  const [newStatus, setStatus] = useState(null);

  let network = "";

  switch (coin.coin_family) {
    case 1:
      network = "ETH";
      break;
    case 3:
      network = "BNB";
      break;
    case 7:
      network = "AVAX";
      break;
    case 6:
      network = "POL";
      break;
    case 8:
      network = "CRO";
      break;
    case 4:
      network = "SOL";
      break;
    case 2:
      network = "BTC";
      break;
    case 5:
      network = "ADA";
      break;
    case 9:
      network = "PLS";
      break;
    default:
      network = "ethereum";
      break;
  }

  const onChange = async (checked) => {
    try {
      store.dispatch(setLoading(true));
      const { deviceId } = chrome.storage.local.get("deviceId");

      await server.post(
        "/wallet/manage_coins",
        {
          coin_id: id,
          coin_family: coinFamily,
          wallet_address: walletAddress,
          is_active: checked ? 1 : 0,
          evm_address: account.isWatchOnly
            ? walletAddress
            : account.coinFamilyAndAddress[1],
          coin_type: account.isWatchOnly
            ? "old"
            : coin.wallet_addresses_data
            ? "old"
            : "new",
          device_token: coin.wallet_addresses_data ? undefined : deviceId,
          device_type: coin.wallet_addresses_data ? undefined : "WEB",
          is_watch_only: account?.isWatchOnly ? 1 : 0,
          wallet_name: account?.name
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      console.log(
        currency.toUpperCase() === network.toUpperCase(),
        currency,
        network
      );

      store.dispatch(setLoading(false));
      setStatus(checked);
    } catch (error) {
      store.dispatch(setLoading(false));
      return messageApi.error("Something went wrong.");
    }
  };

  useEffect(() => {
    setStatus(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <>
      <div className="manageList">
        {contextHolder}
        <div className="manageList__imgcurrency">
          {img ? (
            <img src={img} alt="" />
          ) : (
            <div
              className="randb extra borderDarkLight"
              style={{
                height: "30px",
                width: "30px",
                background: "rgb(202, 201, 201)",
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                border: "1px solid",
              }}
            >
              {symbol.split("")[0].toUpperCase()}
            </div>
          )}

          <div
            className="manageList__imgcurrency_Name"
            style={{
              textAlign: "left",
            }}
          >
            <p
              style={{
                width: "100px",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {currency}
              {valuecurrency !== "" ? "/" : ""}
              <span
                style={{
                  marginLeft: "10px",
                }}
              >
                {valuecurrency}
              </span>
            </p>
            <span
              className="coinNname"
              style={{
                marginTop: "10px",
              }}
            >
              {name}
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "relative",
            top: "14px",
          }}
        >
          <Switch checked={newStatus} onChange={onChange} />
          <span
            className="networkNameNew"
            style={{
              marginTop: "3px",
            }}
          >
            {network}
          </span>
        </div>
      </div>
    </>
  );
}

export default ManageCustom;
