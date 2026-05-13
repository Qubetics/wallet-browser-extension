/*global chrome*/
/* global BigInt */
import { message } from 'antd';
import moment from 'moment';
import React from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { store } from '../../..';
import { setLoading } from '../../../actions/loading';
import MenuRestofHeaders from '../../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import ButtonComp from '../../../Components/ButtonComp/ButtonComp';
import ModalCustom from '../../../Components/ModalCustom/ModalCustom';
import { DURATION } from '../../../config/message.config';
import { BTCHelper } from '../../../helpers/btc.helper';
import { SolanaHelper } from '../../../helpers/solana.helper';
import { Web3Helper } from '../../../helpers/web3.helper';
import { getRpcUrl } from '../../../helpers/rpcService';
import './SendConfirm.scss';
import Logo from '../../../Assets/QubeticsLogo.png';
import {
  addCommasToNumber,
  getFlooredFixed,
} from '../../../helpers/conversion.helper';
import { server } from '../../../server';
import { broadcastTx } from '../../../helpers/cosmos.helper';
import { formatNumberInput } from '../../../helpers/common.helper';

function SendConfirm() {
  const {
    state: {
      coin,
      to,
      amount,
      networkFee,
      rawTransaction,
      ENSName,
      contact,
      theme,
      redirectTo,
      gasPriceType,
      sessionPassword,
      selectChain,
      mnemonics,
      cosmosData,
    },
  } = useLocation();

  // console.log('NETWORK FEE', networkFee);
  // console.log('COIN', coin);
  // console.log('TO', to);
  // console.log('AMOUNT', amount);
  // console.log('ENS NAME', ENSName);
  // console.log('CONTACT', contact);
  // console.log('THEME', theme);
  // console.log('REDIRECT TO', redirectTo);
  // console.log('GAS PRICE TYPE', gasPriceType);
  // console.log('SELECT CHAIN', selectChain);
  // console.log('MNEMONICS', mnemonics);
  // console.log('COSMOS DATA', cosmosData);

  const { account, currency } = useSelector((state) => state);
  const [isModalOpen1, setIsModalOpen1] = useState(false);
  const [fiatGasFee, setFiatGasFee] = useState(0);
  const [parentCoin, setParentCoin] = useState(null);
  const [fiatCoin, setFiatCoin] = useState(0);
  const [toName, setToName] = useState(null);

  const navigate = useNavigate();

  const handleOk1 = () => {
    setIsModalOpen1(false);
  };
  const handleCancel1 = () => {
    setIsModalOpen1(true);
  };

  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  const init = async () => {
    store.dispatch(setLoading(true));
    const parentCoin = await server.post(
      '/wallet/nativeCoinFiatPrice',
      {
        coin_family: coin.coin.coin_family,
        fiat_currency: currency.name,
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );
    const { chains } = await chrome.storage.local.get('chains');
    const chain = chains.find(
      (chain) => chain.coinFamily === coin.coin.coin_family
    );
    setParentCoin(chain);
    const feePrice = parentCoin?.data?.data?.fiatCoinPrice;
    if (feePrice) {
      const value = parseFloat(networkFee) * parseFloat(feePrice.value);
      setFiatGasFee(value);
    }
    setToName(contact);
    store.dispatch(setLoading(false));
  };

  useEffect(() => {
    const price = coin?.coin?.fiat_price_data || 0;
    if (price) {
      const value = parseFloat(amount) * parseFloat(price.value);
      setFiatCoin(value);
    }
    init();
  }, []);

  const data =
    selectChain === 'cosmos'
      ? [
          {
            text: 'From',
            textVal: `${cosmosData?.address?.substring(
              0,
              7
            )}.....${cosmosData?.address?.substring(
              cosmosData?.address?.length - 7,
              cosmosData?.address?.length
            )}`,
          },
          {
            text: 'To',
            textVal: `${to.substring(0, 7)}.....${to.substring(
              to.length - 7,
              to.length
            )}`,
          },
          {
            text: 'Network Fee',
            textVal: `${cosmosData?.fee} ${
              parentCoin ? parentCoin.currencySymbol.toUpperCase() : ''
            }/ ${currency.symbol}${addCommasToNumber(
              getFlooredFixed(cosmosData?.feeInUsd, 2)
            )}`,
          },
          {
            text: 'Total value',
            textVal: `${addCommasToNumber(
              parseFloat(getFlooredFixed(+amount + +cosmosData?.fee, 8))
            )} ${coin.coin.coin_symbol.toUpperCase()}/ ${
              currency.symbol
            }${addCommasToNumber(
              getFlooredFixed(+cosmosData?.feeInUsd + +fiatCoin, 2)
            )}`,
          },
          {
            text: 'Date',
            textVal: moment(new Date()).format('MM/DD/YY'),
          },
        ]
      : [
          {
            text: 'From',
            textVal: `${coin.wallet_address.substring(
              0,
              7
            )}.....${coin.wallet_address.substring(to.length - 7, to.length)}`,
          },
          {
            text: 'To',
            textVal: toName
              ? toName
              : ENSName
              ? ENSName
              : `${to.substring(0, 7)}.....${to.substring(
                  to.length - 7,
                  to.length
                )}`,
          },
          {
            text: 'Network Fee',
            textVal: `${formatNumberInput(networkFee, 6)} ${
              parentCoin ? parentCoin.currencySymbol.toUpperCase() : ''
            }/ ${currency.symbol}${addCommasToNumber(
              getFlooredFixed(fiatGasFee, 2)
            )}`,
          },
          {
            text: 'Total value',
            textVal: coin.coin.token_address
              ? `${addCommasToNumber(
                  parseFloat(getFlooredFixed(amount, 8))
                )} ${coin.coin.coin_symbol.toUpperCase()}/ ${
                  currency.symbol
                }${addCommasToNumber(
                  getFlooredFixed(+fiatGasFee + +fiatCoin, 2)
                )}`
              : `${addCommasToNumber(
                  parseFloat(getFlooredFixed(+amount + +networkFee, 8))
                )} ${coin.coin.coin_symbol.toUpperCase()}/ ${
                  currency.symbol
                }${addCommasToNumber(
                  getFlooredFixed(+fiatGasFee + +fiatCoin, 2)
                )}`,
          },
          {
            text: 'Date',
            textVal: moment(new Date()).format('MM/DD/YY'),
          },
        ];

  const handleTransaction = async () => {
    try {
      store.dispatch(setLoading(true));

      const { chains } = await chrome.storage.local.get('chains');
      const chain = chains.find(
        (chain) => chain.coinFamily === coin.coin.coin_family
      );

      if (chain.isEVM) {
        if (selectChain === 'cosmos') {
          const broadcastResponse = await broadcastTx({
            mnemonicsNew: mnemonics,
            fromAddress: cosmosData?.address,
            toAddress: to,
            amount: amount,
            fee: cosmosData?.stdFee,
            _gasLimit: cosmosData.gasLimit,
          });

          // Check if broadcastTx returned an error
          if (broadcastResponse?.success === false) {
            store.dispatch(setLoading(false));
            const errorMessage =
              broadcastResponse?.message ||
              broadcastResponse?.error?.message ||
              'Transaction failed. Please try again.';

            // Extract user-friendly error message
            let userMessage = errorMessage;
            if (
              errorMessage.includes('insufficient funds') ||
              errorMessage.includes('insufficient fee')
            ) {
              userMessage =
                'Insufficient funds to pay for transaction fees. Please ensure you have enough balance to cover the transaction amount and network fees.';
            } else if (errorMessage.includes('staking rewards')) {
              userMessage =
                'Insufficient staking rewards to cover transaction fees. Please ensure you have enough balance or claim staking rewards first.';
            }

            // console.error(
            //   '🚀 ~ handleTransaction ~ broadcastTx error:',
            //   broadcastResponse
            // );
            return messageApi.error(userMessage);
          }

          const { hash, block, transFee, transEstimate } = broadcastResponse;
          // console.log(
          //   '🚀 ~ handleTransaction ~ cosmosTxn:',
          //   hash,
          //   block,
          //   transFee,
          //   transEstimate
          // );

          // Validate that we have required transaction data
          if (!hash) {
            store.dispatch(setLoading(false));
            return messageApi.error(
              'Transaction failed: No transaction hash received.'
            );
          }

          let newData = {
            tx_fee: cosmosData.fee,
            gas_estimate: transEstimate,
            block: block,
            txid: hash,
            amount: amount,
            from: cosmosData?.address,
            to: to,
            tx_type: 'withdraw',
          };

          const response = await server.post(
            `/qubetics/send/nativeAddress`,
            newData,
            {
              headers: {
                Authorization: account.jwtToken,
              },
            }
          );

          if (!response) {
            store.dispatch(setLoading(false));
            return messageApi.error(
              'Insufficient funds to perform transaction.'
            );
          }
        } else {
          if (coin.coin.token_address) {
            const response =
              await Web3Helper.generateRawTransactionForTokenAndBroadcast(
                to,
                coin.wallet_address,
                amount,
                coin.coin.coin_id,
                fiatCoin,
                fiatGasFee,
                currency.name,
                toName,
                chain.slug == 'matic' ? 'polygon' : chain.slug,
                chain.chainId,
                coin.coin.token_address,
                coin.coin.decimals,
                coin.coin.token_type,
                '',
                coin.coin.coin_family,
                gasPriceType,
                undefined,
                sessionPassword
              );

            if (!response) {
              store.dispatch(setLoading(false));
              return messageApi.error(
                'Insufficient funds to perform transaction.'
              );
            }
          } else {
            // console.log('IS EVM COIN CASE ');
            const response =
              await Web3Helper.generateRawTransactionForCoinAndBroadcast(
                to,
                coin.wallet_address,
                amount,
                coin.coin.coin_id,
                fiatCoin,
                fiatGasFee,
                currency.name,
                toName,
                chain.slug == '0' ? 'polygon' : chain.slug,
                chain.chainId,
                coin.coin.coin_symbol,
                coin.coin.coin_family == 1
                  ? getRpcUrl('REACT_APP_BNB_RPC')
                  : coin.coin.coin_family == 2
                  ? getRpcUrl('REACT_APP_ETH_RPC')
                  : coin.coin.coin_family == 4
                  ? getRpcUrl('REACT_APP_MATIC_RPC')
                  : getRpcUrl('REACT_APP_QUBETIC_RPC'),
                '',
                gasPriceType,
                undefined,
                sessionPassword
              );
            // console.log(
            //   'RESPONSE FROM FUNCTION MAKING RAW TRANSACTION :',
            //   response
            // );
            if (!response) {
              store.dispatch(setLoading(false));
              return messageApi.error(
                'Insufficient funds to perform transaction.'
              );
            }
          }
        }
      } else if (!chain.isEVM && chain.currencyName === 'SOL') {
        const solanaHelper = new SolanaHelper(chain.rpcUrl);
        if (coin?.coin?.token_address) {
          const response =
            await solanaHelper.generateRawTransactionForTokenAndBroadcast(
              to,
              coin.wallet_address,
              amount,
              coin.coin.coin_id,
              fiatCoin,
              fiatGasFee,
              currency.name,
              toName,
              `solana/${coin.coin.token_address}`, // chain?.slug,
              chain?.chainId,
              coin?.coin?.token_address,
              coin?.coin?.decimals,
              coin.coin.token_type,
              coin.balance,
              undefined,
              undefined,
              undefined,
              sessionPassword
            );
          if (!response || response?.error) {
            store.dispatch(setLoading(false));
            return messageApi.error(response?.message);
          }
        } else {
          // console.log('INCOIN CASSE');
          const response =
            await solanaHelper.generateRawTransactionForCoinAndBroadcast(
              to,
              coin.wallet_address,
              amount,
              coin.coin.coin_id,
              fiatCoin,
              fiatGasFee,
              currency.name,
              toName,
              `solana/${coin.coin.coin_symbol}`, //chain.slug,
              chain.chainId,
              undefined,
              undefined,
              sessionPassword
            );

          if (!response || response?.error) {
            store.dispatch(setLoading(false));
            return messageApi.error(response?.message);
          } else {
            store.dispatch(setLoading(false));
          }
        }
      } else if (!chain.isEVM && chain.currencyName === 'BTC') {
        let tx_fee = parseFloat(getFlooredFixed(+networkFee, 8));
        const response =
          await BTCHelper.generateRawTransactionForCoinAndBroadcast(
            to,
            coin.wallet_address,
            amount,
            coin.coin.coin_id,
            fiatCoin,
            fiatGasFee,
            currency.name,
            toName,
            `bitcoin/${chain.slug}`,
            chain.chainId,
            rawTransaction,
            tx_fee,
            gasPriceType
          );

        if (!response || response?.error) {
          store.dispatch(setLoading(false));
          return messageApi.error(response?.message);
        }
      }

      store.dispatch(setLoading(false));
      chrome.storage.local.set({ walletBalanceRefreshAt: Date.now() + 60_000 });
      setIsModalOpen1(true);
    } catch (error) {
      // console.error('HANDLE TRANSACTION ERROR: ', error);
      store.dispatch(setLoading(false));

      // Extract user-friendly error message
      let errorMessage = 'Transaction failed. Please try again.';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Check for specific error types
      if (
        errorMessage.includes('insufficient funds') ||
        errorMessage.includes('insufficient fee')
      ) {
        errorMessage =
          'Insufficient funds to pay for transaction fees. Please ensure you have enough balance to cover the transaction amount and network fees.';
      } else if (errorMessage.includes('staking rewards')) {
        errorMessage =
          'Insufficient staking rewards to cover transaction fees. Please ensure you have enough balance or claim staking rewards first.';
      }

      messageApi.error(errorMessage);
    }
  };

  return (
    <div className={`scrollableCont`}>
      {contextHolder}
      <MenuRestofHeaders
        backTo={'/sendCurrency'}
        title={`Send ${coin.coin.coin_symbol.toUpperCase()}`}
        coin={coin}
        amount={amount}
        address={to}
        redirectTo={redirectTo}
      />
      <div className={`flexedContent padding-Top`}>
        <div className="confirmCurrency manageWalletHeight">
          <div>
            <div
              className="confirmCurrency__card"
              style={{
                display: 'flex',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {coin.coin.coin_image ? (
                  <img
                    src={coin.coin.coin_image}
                    alt=""
                    style={{
                      width: '50px',
                    }}
                  />
                ) : null}
              </div>
              <div
                style={{
                  flex: 2,
                }}
              >
                <p className="confirmCurrency__card__textBtm">
                  {currency?.symbol}
                  {addCommasToNumber(getFlooredFixed(fiatCoin, 2))}
                </p>
                <h3 className="confirmCurrency__card__textTop">
                  {formatNumberInput(amount, coin?.coin?.decimals)}{' '}
                  {coin?.coin?.coin_symbol.toUpperCase()}
                </h3>
              </div>
            </div>
            <div className="confirmCurrency__keyValuesOuter">
              {data?.map((ele) => (
                <div className="confirmCurrency__keyValues">
                  <div className="confirmCurrency__keyValues__key">
                    {ele?.text}
                  </div>
                  <div className="confirmCurrency__keyValues__value">
                    {ele?.textVal}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <ButtonComp
              onClick={async () => handleTransaction()}
              text={'Confirm'}
              maxWidth={'100%'}
            />
          </div>
        </div>
      </div>

      <ModalCustom
        handleCancel={handleCancel1}
        isModalOpen={isModalOpen1}
        handleOk={handleOk1}
        customClass="customClassModal"
        closable={false}
      >
        <div className={'confirmationsModal'}>
          <div className={'iInner'}>
            <img
              src={Logo}
              alt=""
              style={{
                width: '70px',
                height: '70px',
              }}
            />
            {/* )} */}
            <div>
              <p style={{ color: 'white' }}>
                Withdraw request of{' '}
                {formatNumberInput(amount, coin?.coin?.decimals)}{' '}
                {coin.coin.coin_symbol.toUpperCase()} has been processed
                successfully.
              </p>
            </div>
          </div>
          <ButtonComp
            text={'OK'}
            maxWidth={'100%'}
            onClick={() => {
              setTimeout(() => {
                navigate('/currencyDetails', {
                  state: {
                    symbol: coin.coin.coin_symbol.toUpperCase(),
                    image: coin.coin.coin_image
                      ? `${process.env.REACT_APP_IMAGE_BASE_URL}${coin.coin.coin_image}`
                      : null,
                    type: '',
                    coin: coin,
                  },
                });
              }, 2000);
            }}
          />
        </div>
      </ModalCustom>
    </div>
  );
}

export default SendConfirm;
