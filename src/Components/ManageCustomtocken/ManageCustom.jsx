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

      await server.post(
        "/wallet/activeinactive",
        {
          coinId: coin.coin_id,
          walletAddress: walletAddress,
          isActive: checked ? 1 : 0,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
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


  console.log("CCCCCCCCCCCCCCCCNNNNNNNNNNNNN ", coin);
  
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
                // width: "100px",
                // textOverflow: "ellipsis",
                // overflow: "hidden",
                display: "flex",
                alignItems: "center",
              }}
            >
              {currency}
              {valuecurrency !== "" ? "" : ""}
              <p
                style={{
                  marginLeft: "5px",
                  fontWeight: "500",
                }}
              >
                ({valuecurrency})
              </p>
            </p>
            <span
              className="coinNname"
              style={{
              }}
            >
              {/* {name} */}
              $68,090.27 <span style={{ color: "#D33535" }}>-1.44%</span>
            </span>
          </div>
        </div>
        <div
        className="manageListSwitch"
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Switch checked={newStatus} onChange={onChange} />
          {/* <span
            className='networkNameNew'
            style={{
              marginTop: '3px',
            }}
          >
            {network}
          </span> */}
        </div>
      </div>
    </>
  );
}

export default ManageCustom;
