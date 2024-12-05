/*global chrome*/
/* eslint-disable jsx-a11y/alt-text */
import React, { useEffect, useRef, useState } from 'react';
import './Wallet.scss';
import FilterIcon from '../../Assets/twoLine.svg';
import LightManage from '../../Assets/light-manage.svg';
import CoinsTable from '../../Components/CoinsTable/CoinsTable';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Refresh from '../../Assets/refersh.png';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import BigNumber from 'bignumber.js';
import { server } from '../../server';
import {
  addCommasToNumber,
  exponential_to_decimal,
  formatSmallNumber,
  getFlooredFixed,
} from '../../helpers/conversion.helper';
import { setTokens } from '../../actions/tokens';
import useCurrentHeight from '../../CustomHooks/useCurrentHeight';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import NFTappear from '../Nft/NFTappear';
import CoinsTableDraggable from '../../Components/CoinsTable/CoinsTableDraggable';

function Wallet() {
  const { account, currency, tokens, balanceIn, theme } = useSelector(
    (state) => state
  );

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const getSidePanelStatus = async () => {
    const isSidePanelOpen = await chrome.storage.local.get('openSidePanel');
    setIsSidePanelOpen(isSidePanelOpen.openSidePanel);
  };

  useEffect(() => {
    getSidePanelStatus();
  }, [isSidePanelOpen]);

  const stateLocation = useLocation();

  const [currentPage, setCurrentPage] = useState(1);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [total, setTotal] = useState(0);
  const [sel, setSel] = useState(
    stateLocation.state ? (stateLocation.state.showNftTrue ? 1 : 0) : 0
  );
  const [refresh, setRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const height = useCurrentHeight();
  const [loading, setLoading] = useState(false);
  const init = async (refresh) => {
    setLoading(true);
    const walletsList = await server.post(
      `/wallet/tokens`,
      {
        address_list: account.addressLists,
        coin_family: account.coinFamilies,
        fiat_currency: currency.name,
        per_page: 2000,
        page: currentPage,
        is_watch_only: account.isWatchOnly ? 1 : 0,
        wallet_name: account.name,
        address_list_array: Object.keys(account.coinFamilyAndAddress)
          .map((key) => {
            return {
              coin_family: key,
              address: account.coinFamilyAndAddress[key],
            };
          })
          .filter((el) => el.address),
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );
    server.post(
      `/wallet/fetch_wallet_balance`,
      {
        address_list: Object.keys(account.coinFamilyAndAddress).map((key) => {
          return {
            coin_family: key,
            address: account.coinFamilyAndAddress[key],
          };
        }),
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );
    setTotal(walletsList.data.meta.total);
    store.dispatch(setTokens(walletsList.data.data));
    setIsFetchingData(false);
    setLoading(false);
  };

  useEffect(() => {
    init();
  }, [currentPage, refresh]);

  const parentRef = useRef(null);

  const handleScroll = () => {
    // Get the parent container's height and scroll position
    const { scrollHeight, scrollTop, clientHeight } = parentRef.current;

    // Check if the user has reached the bottom of the scrollable container
    const tolerance = 15; // Adjust this value as needed
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - tolerance;

    if (isAtBottom && !isFetchingData && currentPage < Math.ceil(total / 10)) {
      // // Prevent loading more data if already refreshing or reached the last page
      // setIsFetchingData(true);
      // // Increment the currentPage state to load the next page
      // setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  return (
    <div className='wallet'>
      <Tabs
        defaultIndex={
          stateLocation.state ? (stateLocation.state.showNftTrue ? 1 : 0) : 0
        }
      >
        <TabList
          className='swapTabList'
          style={{
            border: 'none',
            borderRadius: '30px',
            display: 'flex',
            justifyContent: 'space-evenly',
            listStyle: 'none',
          }}
        >
          <Tab
            className='swapTab tokenTab'
            onClick={() => {
              setSel(0);
            }}
            style={{
              backgroundColor: sel === 0 ? '#4096ff' : 'transparent',
              // color: sel === 0 ? "#fff" : "#fff",
              borderRadius: '30px',

              fontSize: '13px',
              flex: 1,
              borderColor: '#4096ff',
              fontWeight: '700',
            }}
          >
            Tokens
          </Tab>
          <Tab
            className='swapTab tokenTab'
            onClick={() => {
              if (
                account.isWatchOnly &&
                account.coinFamilies.length === 1 &&
                account.coinFamilies[0] == 2
              ) {
                return;
              }
              setSel(1);
            }}
            disabled={
              account.isWatchOnly &&
              account.coinFamilies.length === 1 &&
              account.coinFamilies[0] == 2
            }
            style={{
              backgroundColor: sel === 1 ? '#4096ff' : 'transparent',
              // color: sel === 1 ? "#fff" : "#fff",
              borderRadius: '30px',
              fontSize: '13px',
              flex: 1,
              borderColor: '#4096ff',
              fontWeight: '700',
              filter:
                account.isWatchOnly &&
                account.coinFamilies.length === 1 &&
                account.coinFamilies[0] == 2
                  ? 'grayscale(1) blur(1px)'
                  : '',
            }}
          >
            NFTs
          </Tab>
        </TabList>
        <TabPanel>
          <div className='wallet__heading'>
            <h3 className='wallet__heading__text'>Tokens</h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div className='wallet__heading__filter'>
                <Link
                  to=''
                  onClick={async (e) => {
                    e.preventDefault();
                    setIsRefreshing(true);
                    await init(true);
                    setIsRefreshing(false);
                  }}
                >
                  <img
                    src={Refresh}
                    style={{
                      width: '34px',
                      marginRight: '22px',
                      animation: isRefreshing
                        ? 'spin 2s linear infinite'
                        : 'none',
                    }}
                  />
                </Link>
              </div>
              <div className='wallet__heading__filter'>
                <Link to='/manage'>
                  <img src={theme === 'darkTheme' ? LightManage : FilterIcon} />
                </Link>
              </div>
            </div>
          </div>
          <div
            className={`${'wallet__tableOuter'} ${
              height <= 600 ? 'wallet__tabelOuterExt' : ''
            }`}
            ref={parentRef}
            onScroll={handleScroll}
            style={!isSidePanelOpen ? { height: '218px' } : {}}
          >
            {tokens.length === 0 ? (
              <p className='noAddress'>
                {loading
                  ? ''
                  : 'No token available. Please add new tokens or enable them from the manage section.'}
              </p>
            ) : (
              <CoinsTableDraggable
                refresh={setRefresh}
                dataArray={
                  Array.isArray(tokens) &&
                  tokens.map((token, index) => {
                    const price = token.coin_data.coins_market || null;

                    const myPrice = new BigNumber(
                      price ? price.current_price : 0
                    );
                    const balance = new BigNumber(token.balance);
                    const result = myPrice.times(balance);
                    const formattedResult = result.toString();

                    return {
                      position: token.sort_order,
                      coinIcon: token.coin_data.coin_image
                        ? `${process.env.REACT_APP_IMAGE_BASE_URL}${token.coin_data.coin_image}`
                        : null,
                      coinName: token.coin_data.coin_symbol.toUpperCase(),
                      coinSubName: token.coin_data.coin_name,
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
                      currCryptoBalSymbol: token.coin_data.coin_symbol.toUpperCase(),
                      currDollerBal: balanceIn
                        ? addCommasToNumber(getFlooredFixed(formattedResult, 2))
                        : '****',
                      routeTo: 'currencyDetails',
                      type: token.coin_data.token_type
                        ? token.coin_data.coin_family == 4
                          ? 'SPL20'
                          : token.coin_data.token_type
                        : token.coin_data.coin_symbol === 'bnb'
                        ? 'BEP20'
                        : '',
                      status: true,
                      coin: token,
                    };
                  })
                }
              />
            )}
          </div>
        </TabPanel>
        <TabPanel>
          <NFTappear />
        </TabPanel>
      </Tabs>
    </div>
  );
}

export default Wallet;
