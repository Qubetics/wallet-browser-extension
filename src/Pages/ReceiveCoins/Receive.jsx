import React, { useEffect, useState } from 'react';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import CoinsTable from '../../Components/CoinsTable/CoinsTable';
import './Receive.scss';
import { useSelector } from 'react-redux';
import { InputField } from '../../Components/InputField/InputFieldSimple';
import { useLocation } from 'react-router-dom';
import Search from '../../Assets/SearchIcon.svg';
import BigNumber from 'bignumber.js';
import {
  addCommasToNumber,
  exponential_to_decimal,
  formatSmallNumber,
  getFlooredFixed,
} from '../../helpers/conversion.helper';
import { server } from '../../server';
import { store } from '../..';
import { setTokens } from '../../actions/tokens';
import { QRCode } from 'react-qrcode-logo';
import { message } from 'antd';
import { DURATION } from '../../config/message.config';
import CopyIconBlue from '../../Assets/CopyIconBlue.svg';
import ModalCustom from '../../Components/ModalCustom/ModalCustom';
import { setLoading } from '../../actions/loading';
import { token_type } from '../../helpers/constant';

function ReceiveTokens() {
  const { account, tokens, currency, balanceIn, loading } = useSelector(
    (state) => state
  );
  const [list, setList] = useState([]);
  const [keyword, setKeyword] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  const { state } = useLocation();

  const init = async () => {
    store.dispatch(setLoading(true));
    try {
      const walletsList = await server.post(
        `/wallet/portfolio`,
        {
          addressListKeys: account?.addressLists?.slice(0, 6),
          coin_family: account.coinFamilies,
          fiat_type: currency.name,
          limit: 2000,
          page: 1,
          search: keyword?.trim(),
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      // console.log('all tokens in receive screen:',walletsList);
      store.dispatch(setTokens(walletsList?.data?.data));
    } catch (error) {
      messageApi.error('Unable to load your assets. Please try again.');
    } finally {
      store.dispatch(setLoading(false));
    }
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
  }, [keyword]);

  return (
    <div className={`scrollableCont send`}>
      <div className="searchBarFixed">
        {contextHolder}
        <MenuRestofHeaders
          backTo={'/wallet'}
          title={'Receive'}
          redirectTo={state?.nft ? 'nft' : null}
          coin={state ? (state.coin ? state.coin : null) : null}
        />

        {state?.nft ? null : (
          <div className="search">
            <InputField
              placeholder={'Search'}
              value={keyword}
              checkForSymbols={true}
              getData={(value) => {
                const hasEmoji = /[\p{Extended_Pictographic}]/u.test(value);
                if (hasEmoji) {
                  return false;
                }
                if (value.length > 25) {
                  return false;
                }
                setKeyword(value);
              }}
              addonBefore={
                <span>
                  <img
                    src={Search}
                    style={{
                      width: '17px',
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
                  : '0.00',
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
                  : '****',
                routeTo: 'receive-currency',
                type:
                  token?.coin?.token_address !== null
                    ? token_type(token.coin.coin_family)
                    : '', //token.coin.coin_family === 1 ? "BEP20" : "ERC20",
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
              marginTop: '50%',
              fontWeight: 'bold',
              fontSize: '17px',
            }}
          >
            {loading ? 'Loading...' : 'No assets found'}
          </p>
        )}
      </div>
    </div>
  );
}

export default ReceiveTokens;
