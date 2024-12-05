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
      `/wallet/tokens`,
      {
        address_list: account.addressLists,
        coin_family: state?.nft ? [1, 3] : account.coinFamilies,
        fiat_currency: currency.name,
        per_page: 2000,
        page: 1,
        search: keyword ? keyword.trim() : undefined,
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

    console.log(
      walletsList.data.data.filter((wallet) => !wallet.coin_data.token_address)
    );

    if (state?.nft) {
      setList(
        walletsList.data.data.filter(
          (wallet) =>
            !wallet.coin_data.token_address &&
            (wallet.coin_data.coin_family == 1 ||
              wallet.coin_data.coin_family == 3)
        )
      );
    } else {
      store.dispatch(setTokens(walletsList.data.data));
    }

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
      {contextHolder}
      <MenuRestofHeaders
        backTo={'/wallet'}
        title={'Receive'}
        redirectTo={state?.nft ? 'nft' : null}
        coin={state ? (state.coin ? state.coin : null) : null}
      />

      <div className={`flexedContent`}>
        {state?.nft ? null : (
          <div className='search' style={{ marginBottom: '20px' }}>
            <InputField
              placeholder={'Search'}
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
                      width: '17px',
                    }}
                    alt=''
                  />
                </span>
              }
            />
          </div>
        )}

        {(state?.nft ? list : tokens).length > 0 ? (
          <CoinsTable
            dataArray={(state?.nft ? list : tokens).map((token) => {
              const price = token.coin_data.coins_market || null;
              const myPrice = new BigNumber(price ? price.current_price : 0);
              const balance = new BigNumber(token.balance);
              const result = myPrice.times(balance);
              const formattedResult = result.toString();

              return {
                coinIcon: token.coin_data.coin_image
                  ? `${process.env.REACT_APP_IMAGE_BASE_URL}${token.coin_data.coin_image}`
                  : null,
                coinName: token.coin_data.coin_symbol.toUpperCase(),
                coinSubName: token.coin_data.coin_name,
                coinPrice: myPrice.toNumber()
                  ? formatSmallNumber(myPrice.toString())
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
                    )} ${token.coin_data.coin_symbol.toUpperCase()}`
                  : '****',
                currDollerBal: balanceIn
                  ? addCommasToNumber(getFlooredFixed(formattedResult, 2))
                  : '****',
                routeTo: 'sendCurrency',
                type:
                  token.coin_data.coin_symbol === 'bnb'
                    ? 'BEP20'
                    : token.coin_data.token_address
                    ? token.coin_data.coin_family == 4
                      ? 'SPL20'
                      : token.coin_data.token_type
                    : '',
                status: true,
                coin: token,
                showModal,
              };
            })}
          />
        ) : (
          <p
            className='noAddress'
            style={{
              marginTop: '50%',
              fontWeight: 'bold',
              fontSize: '17px',
            }}
          >
            No assets found
          </p>
        )}
      </div>

      {selectedCoin ? (
        <ModalCustom
          isModalOpen={isModalOpen}
          handleOk={handleOk}
          handleCancel={handleCancel}
          customClass={'change'}
        >
          <div className='balanceDetails__modal'>
            <div>
              <div className='balanceDetails__modal__scanner'>
                <QRCode
                  value={selectedCoin.address}
                  size={230}
                  qrStyle='square'
                  eyeRadius={10}
                  logoImage={`${process.env.REACT_APP_IMAGE_BASE_URL}${selectedCoin.coin_data.coin_image}`}
                  logoHeight={55}
                  logoWidth={55}
                  logoPadding={8}
                  logoPaddingStyle='circle'
                  style={{
                    borderRadius: '20px',
                    padding: '15px',
                  }}
                />
              </div>
            </div>
            <p className='balanceDetails__modal__title'>
              Receive {selectedCoin.coin_data.coin_symbol.toUpperCase()}
            </p>
            <p
              className='modalAddres'
              style={{
                width: '100%',
                textAlign: 'center',
                marginBottom: '17px',
                fontSize: '15px',
                fontWeight: 'bold',
              }}
            >
              Address
            </p>
            <div
              className='balanceDetails__modal__wrapedText'
              onClick={async () => {
                await navigator.clipboard.writeText(selectedCoin.address);
                messageApi.success('Address copied successfully.');
              }}
            >
              <img src={CopyIconBlue} width={15} height={16} alt='' />
              <span>{selectedCoin.address}</span>
            </div>
          </div>
        </ModalCustom>
      ) : null}
    </div>
  );
}

export default ReceiveTokens;
