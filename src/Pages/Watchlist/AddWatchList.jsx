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
import { message } from 'antd';
import { DURATION } from '../../config/message.config';
import { setLoading } from '../../actions/loading';
import { token_type } from '../../helpers/constant';

function AddWatchList() {
  const { account, currency, balanceIn, loading } = useSelector((state) => state);
  const location = useLocation();
  const isFromPortfolio = location.state?.isFromPortfolio ?? false;
  const [keyword, setKeyword] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [list, setList] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [add, setAdd] = useState(false);
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
      `/wallet/getWatchlist`,
      {
        wallet_address: account.addressLists,
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

    setTokens(walletsList.data.data);
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
          backTo={isFromPortfolio ? '/portfolio' : '/watch-list-tokens'}
          title={'Add Watch List'}
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
        {/* <Link to='/add-token' style={{ marginBottom: '20px' }}>
          <ButtonComp text={'Add to Watch List'} maxWidth={'100%'} />
        </Link> */}
        {(state?.nft ? list : tokens).length > 0 ? (
          <CoinsTable
            dataArray={tokens.map((token) => {
              const price = token.fiat_price_data || null;

              const myPrice = new BigNumber(price ? price.value : 0);
              const balance = new BigNumber(token.balance);
              const result = myPrice.times(balance);
              const formattedResult = result.toString();

              return {
                position: token.sort_order,
                coinIcon: token.coin_image,
                coinName: token.coin_symbol.toUpperCase(),
                coinSubName: token.coin_name,
                coinPrice: myPrice.toNumber()
                  ? `$${formatSmallNumber(
                      exponential_to_decimal(myPrice.toNumber())
                    )}`
                  : '$0.00',
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
                currCryptoBalSymbol: token.coin_symbol.toUpperCase(),
                currDollerBal: balanceIn
                  ? addCommasToNumber(getFlooredFixed(formattedResult, 2))
                  : '****',
                routeTo: 'no-where',
                type: token.is_token !== 0 ? token_type(token.coin_family) : '',
                status: true,
                coin: token,
                watch: async () => {
                  // console.log('coin?.coin', token, account);
                  try {
                    await server.post(
                      'wallet/updateWatchlist',
                      {
                        data: [
                          {
                            address:
                              token.coin_family === 3 || token.coin_family === 5
                                ? token?.wallets[0]?.wallet_address
                                : account.address,
                            coin_id: token.coin_id,
                            status: token.watchlist_data ? 0 : 1,
                          },
                        ],
                      },
                      {
                        headers: {
                          Authorization: account.jwtToken,
                        },
                      }
                    );
                    init();
                  } catch (error) {
                    messageApi.error('Unable to favourite the selected coin');
                  }
                },
                isActiveInWatchList: token.watchlist_data ? true : false,
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
            {loading ? 'Loading...' : 'No record found'}
          </p>
        )}
      </div>
    </div>
  );
}

export default AddWatchList;
