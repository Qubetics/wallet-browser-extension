/*global chrome*/
/* eslint-disable jsx-a11y/alt-text */
import React, { useEffect, useRef, useState } from 'react';
import './Wallet.scss';
import FilterIcon from '../../Assets/twoLine.svg';
import LightManage from '../../Assets/light-manage.svg';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import nftIcon from '../../Assets/nftIcon.svg';
import { store } from '../..';
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
import CoinsTableDraggable from '../../Components/CoinsTable/CoinsTableDraggable';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import { message } from 'antd';
import { DURATION } from '../../config/message.config';

function Wallet() {
  const { account, currency, tokens, balanceIn, theme } = useSelector(
    (state) => state
  );
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const { state } = useLocation();
  const navigate = useNavigate();

  const getSidePanelStatus = async () => {
    const isSidePanelOpen = await chrome.storage.local.get('openSidePanel');
    setIsSidePanelOpen(isSidePanelOpen.openSidePanel);
  };

  useEffect(() => {
    getSidePanelStatus();
  }, [isSidePanelOpen]);

  const [currentPage, setCurrentPage] = useState(1);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [total, setTotal] = useState(0);
  const [sel, setSel] = useState(state ? (state?.showNftTrue ? 1 : 0) : 0);
  const [refresh, setRefresh] = useState(false);
  const height = useCurrentHeight();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
    maxCount: 1,
  });

  const init = async (_account) => {
    setLoading(true);
    const throwError = (msg) => messageApi.error(msg);
    try {
      const walletsList = await server.post(
        `/wallet/portfolio`,
        {
          addressListKeys: _account
            ? _account?.addressLists?.slice(0, 6)
            : account?.addressLists?.slice(0, 6),
          coin_family: _account
            ? _account?.coinFamilies
            : account?.coinFamilies,
          fiat_type: currency.name,
          limit: 2000,
          page: currentPage,
          search: '',
        },
        {
          headers: {
            Authorization: _account ? _account?.jwtToken : account?.jwtToken,
          },
        }
      );

      setTotal(walletsList?.data?.meta?.total);
      store.dispatch(setTokens(walletsList?.data?.data));
    } catch (error) {
      setTotal(0);
      store.dispatch(setTokens([]));
      throwError('Something went wrong');
    } finally {
      setIsFetchingData(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    init(state?.updatedAccount);
  }, [currentPage, refresh, state?.updatedAccount, account]);

  const parentRef = useRef(null);

  const handleScroll = () => {
    const { scrollHeight, scrollTop, clientHeight } = parentRef.current;
    const tolerance = 15;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - tolerance;
    if (isAtBottom && !isFetchingData && currentPage < Math.ceil(total / 10)) {
    }
  };

  return (
    <div className="wallet">
      <div className="wallet__heading">
        <h3 className="wallet__heading__text">Crypto's</h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '11px',
          }}
        >
          <div className="wallet__heading__filter">
            <div
              onClick={() => navigate('/nftDetail', { state: { detail: {} } })}
            >
              <img src={nftIcon} />
            </div>
          </div>
          <div className="wallet__heading__filter">
            <Link to="/manage">
              <img src={theme === 'darkTheme' ? LightManage : FilterIcon} />
            </Link>
          </div>
        </div>
      </div>
      <div
        className={`${'wallet__tableOuter'} ${
          height <= 600 ? 'height: 218px' : ''
        }`}
        ref={parentRef}
        onScroll={handleScroll}
      >
        {tokens.length === 0 ? (
          <p className="noAddress">
            {loading
              ? ''
              : 'No token available. Please add new tokens or enable them from the manage section.'}
          </p>
        ) : (
          <CoinsTableDraggable
            refresh={setRefresh}
            dataArray={
              Array.isArray(tokens) &&
              tokens.map((token) => {
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
                        parseFloat(getFlooredFixed(token.balance, 4))
                      )}`
                    : `****`,
                  currCryptoBalSymbol: balanceIn
                    ? token.coin.coin_symbol.toUpperCase()
                    : '****',
                  currDollerBal: balanceIn
                    ? addCommasToNumber(getFlooredFixed(formattedResult, 2))
                    : '****',
                  routeTo: 'currencyDetails',
                  type: token.coin.is_token
                    ? token.coin.coin_family === 1
                      ? 'BEP20'
                      : token.coin.coin_family === 2
                      ? 'ERC20'
                      : token.coin.coin_family === 4
                      ? 'ERC20'
                      : token.coin.coin_family === 5
                      ? 'SPL'
                      : token.coin.coin_family === 6
                      ? 'TRC20'
                      : token.coin.coin_family === 7
                      ? 'TICS20'
                      : ''
                    : '',
                  status: true,
                  coin: token,
                };
              })
            }
          />
        )}
              <div
        className={`${'walletBtn'} ${height <= 600 ? 'walletBtnOuterExt' : ''}`}
      >
        <ButtonComp
          maxWidth="190px"
          onClick={() => {
            return navigate('/add-token');
          }}
          text={
            <span>
              {/* <img src={UserPlusRounded} alt="img" /> */}
              Add Custom Token
            </span>
          }
        />
      </div>
      </div>
    </div>
  );
}

export default Wallet;
