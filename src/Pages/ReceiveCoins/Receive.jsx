import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import CoinsTable from "../../Components/CoinsTable/CoinsTable";
import "./Receive.scss";
import { useSelector } from "react-redux";
import { InputField } from "../../Components/InputField/InputFieldSimple";
import { useLocation } from "react-router-dom";
import Search from "../../Assets/SearchIcon.svg";
import BigNumber from "bignumber.js";
import {
  addCommasToNumber,
  exponential_to_decimal,
  formatSmallNumber,
  getFlooredFixed,
} from "../../helpers/conversion.helper";
import { server } from "../../server";
import { store } from "../..";
import { setTokens } from "../../actions/tokens";
import { QRCode } from "react-qrcode-logo";
import { message } from "antd";
import { DURATION } from "../../config/message.config";
import CopyIconBlue from "../../Assets/CopyIconBlue.svg";
import ModalCustom from "../../Components/ModalCustom/ModalCustom";
import { setLoading } from "../../actions/loading";
import { token_type } from "../../helpers/constant";

function ReceiveTokens() {
  const { account, tokens, currency, balanceIn } = useSelector(
    (state) => state
  );

  const [keyword, setKeyword] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [list, setList] = useState([]);

  const showModal = (coin) => {
    setIsModalOpen(true);
    setSelectedCoin(coin);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const { state } = useLocation();

  const init = async () => {
    store.dispatch(setLoading(true));
    const walletsList = await server.post(
      `/wallet/portfolio`,
      {
        addressListKeys: account.addressLists,
        coin_family: account.coinFamilies,
        fiat_type: currency.name,
        limit: 2000,
        page: 1,
        search: keyword,
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    store.dispatch(setTokens(walletsList.data.data));
    store.dispatch(setLoading(false));
  };

  useEffect(() => {
    let debounceTimer;

    const handleDebouncedSearch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        init();
      }, 2000);
    };

    if (keyword) {
      handleDebouncedSearch();
    } else {
      init();
    }

    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  return (
    <div className={`scrollableCont send`}>
      <div className="searchBarFixed">
        {contextHolder}
        <MenuRestofHeaders
          backTo={"/wallet"}
          title={"Receive"}
          redirectTo={state?.nft ? "nft" : null}
          coin={state ? (state.coin ? state.coin : null) : null}
        />

        {state?.nft ? null : (
          <div className="search">
            <InputField
              placeholder={"Search"}
              value={keyword}
              checkForSymbols={true}
              getData={(value) => {
                setKeyword(value);
              }}
              addonBefore={
                <span>
                  <img
                    src={Search}
                    style={{
                      width: "17px",
                    }}
                    alt=""
                  />
                </span>
              }
            />
          </div>
        )}
      </div>
      <div className={`flexedContent`}>
        {(state?.nft ? list : tokens).length > 0 ? (
          <CoinsTable
            dataArray={tokens.map((token) => {
              const price = token.coin.fiat_price_data || null;

              const myPrice = new BigNumber(price ? price.value : 0);
              const balance = new BigNumber(token.balance);
              const result = myPrice.times(balance);
              const formattedResult = result.toString();

              return {
                position: token.sort_order,
                coinIcon: token.coin.coin_image,
                coinName: token.coin.coin_symbol.toUpperCase(),
                coinSubName: token.coin.coin_name,
                coinPrice: myPrice.toNumber()
                  ? formatSmallNumber(
                      exponential_to_decimal(myPrice.toNumber())
                    )
                  : "0.00",
                coinStatus: getFlooredFixed(
                  price
                    ? parseFloat(
                        price.price_change_percentage_24h || 0
                      ).toLocaleString()
                    : 0,
                  2
                ),
                currCryptoBal: balanceIn
                  ? `${addCommasToNumber(
                      parseFloat(getFlooredFixed(token.balance, 6))
                    )}`
                  : `****`,
                currCryptoBalSymbol: token.coin.coin_symbol.toUpperCase(),
                currDollerBal: balanceIn
                  ? addCommasToNumber(getFlooredFixed(formattedResult, 2))
                  : "****",
                routeTo: "receive-currency",
                type: token?.coin?.token_address!==null ? token_type(token.coin.coin_family):'',    //token.coin.coin_family === 1 ? "BEP20" : "ERC20",
                status: true,
                coin: token,
                // showModal,
              };
            })}
          />
        ) : (
          <p
            className="noAddress"
            style={{
              marginTop: "50%",
              fontWeight: "bold",
              fontSize: "17px",
            }}
          >
            No assets found
          </p>
        )}
      </div>

      {/* {selectedCoin ? (
        <ModalCustom
          isModalOpen={isModalOpen}
          handleOk={handleOk}
          handleCancel={handleCancel}
          customClass={"change"}
        >
          <div className="balanceDetails__modal">
            <div>
              <div className="balanceDetails__modal__scanner">
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
                  style={{
                    borderRadius: "20px",
                    padding: "15px",
                  }}
                />
              </div>
            </div>
            <p className="balanceDetails__modal__title">
              Receive {selectedCoin.coin.coin_symbol.toUpperCase()}
            </p>
            <p
              className="modalAddres"
              style={{
                width: "100%",
                textAlign: "center",
                marginBottom: "17px",
                fontSize: "15px",
                fontWeight: "bold",
              }}
            >
              Address
            </p>
            <div
              className="balanceDetails__modal__wrapedText"
              onClick={async () => {
                await navigator.clipboard.writeText(
                  selectedCoin.wallet_address
                );
                messageApi.success("Address copied successfully.");
              }}
            >
              <img src={CopyIconBlue} width={15} height={16} alt="" />
              <span>{selectedCoin.wallet_address}</span>
            </div>
          </div>
        </ModalCustom>
      ) : null} */}
    </div>
  );
}

export default ReceiveTokens;
