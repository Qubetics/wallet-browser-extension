/*global chrome*/

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
import InputFieldSimple from '../../../Components/InputField/InputFieldSimple';
import ModalCustom from '../../../Components/ModalCustom/ModalCustom';
import { DURATION } from '../../../config/message.config';
import { AdaHelper } from '../../../helpers/ada.helper';
import { BTCHelper } from '../../../helpers/btc.helper';
import { SolanaHelper } from '../../../helpers/solana.helper';
import { Web3Helper } from '../../../helpers/web3.helper';
import './SendConfirm.scss';
import warning from '../../../Assets/PNG/warning.png';
import DarkLogo from '../../../Assets/DarkLogo.svg';
import Logo from '../../../Assets/logo.png';
import {
  addCommasToNumber,
  getFlooredFixed,
} from '../../../helpers/conversion.helper';
import { server } from '../../../server';
import { ClipLoader } from 'react-spinners';
import { WalletHelper } from '../../../helpers/wallet.helper';

function SendConfirmSpritz() {
  const {
    state: {
      coin,
      to,
      amount,
      fiatAmountToSend,
      networkFee,
      rawTransaction,
      bankAccount,
      paymentRequest,
      billPay,
      billItem,
      fromBillPay,
    },
  } = useLocation();

  const { account, currency, theme } = useSelector((state) => state);
  const [isModalOpen1, setIsModalOpen1] = useState(false);
  const [fiatGasFee, setFiatGasFee] = useState(0);
  const [parentCoin, setParentCoin] = useState(null);
  const [fiatCoin, setFiatCoin] = useState(0);
  const [toName, setToName] = useState(null);
  const [sessionPassword, setPassword] = useState(null);
  const [isModalOpen, setOpenmodal] = useState(false);

  const [approvalHash, setApprovalHash] = useState(null);
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);

  const [isLogoutModalOpen, setLogoutOpenmodal] = useState(false);

  /*********************CHECK APPROVAL TRANSACTION STATUS**************** */

  const checkTransactionStatus = async () => {
    const web3Helper = new Web3Helper();
    const result = await web3Helper.getTransactionStatusThroughHash(
      approvalHash,
      coin.coin_data.coin_family == 1
        ? process.env.REACT_APP_ETH_RPC
        : coin.coin_data.coin_family == 3
        ? process.env.REACT_APP_BNB_RPC
        : coin.coin_data.coin_family == 7
        ? process.env.REACT_APP_AVAX_RPC
        : process.env.REACT_APP_MATIC_RPC
    );

    if (result == false) {
      return;
    }

    if (result == 1) {
      setApprovalConfirmed(true);
      setRequireApproval(false);
    } else if (result == 0) {
      setApprovalConfirmed(false);
      setRequireApproval(true);
    }
  };

  useEffect(() => {
    if (approvalHash) {
      const checkApprovalStatus = setInterval(() => {
        checkTransactionStatus();
      }, 2000);

      if (approvalConfirmed) {
        clearInterval(checkApprovalStatus);
      }
    }
  }, [approvalHash]);

  /*********************[END]CHECK APPROVAL TRANSACTION STATUS**************** */

  const navigate = useNavigate();

  const handleOk = () => {
    setOpenmodal(false);
  };

  const handleCancel = () => {
    setOpenmodal(false);
    setPassword(null);
  };

  const handleOk1 = () => {
    setIsModalOpen1(false);
  };
  const handleCancel1 = () => {
    setIsModalOpen1(true);
  };

  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
    maxCount: 1,
  });

  const init = async () => {
    store.dispatch(setLoading(true));

    const price = coin.coin_data.coins_market || 0;

    if (price) {
      const value = parseFloat(amount) * parseFloat(price.current_price);
      setFiatCoin(value);
    }

    const parentCoin = await server.post(
      '/wallet/coin/coins_market_data',
      {
        coin_family: coin.coin_data.coin_family,
        fiat_currency: 'USD',
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    setParentCoin(parentCoin.data.data);
    const feePrice = parentCoin.data.data.coins_market;

    if (feePrice) {
      const value = parseFloat(networkFee) * parseFloat(feePrice.current_price);
      setFiatGasFee(value);
    }

    if (coin.coin_data.token_address) {
      const approvedAmount = await Web3Helper.checkApproval(
        coin.coin_data.token_address,
        coin.address,
        to,
        coin.coin_data.coin_family == 1
          ? process.env.REACT_APP_ETH_RPC
          : coin.coin_data.coin_family == 3
          ? process.env.REACT_APP_BNB_RPC
          : coin.coin_data.coin_family == 7
          ? process.env.REACT_APP_AVAX_RPC
          : process.env.REACT_APP_MATIC_RPC
      );

      if (approvedAmount === false) {
        setLoading(false);
        return messageApi.error(
          'Unable to fetch approval amount. Please try again later.'
        );
      }

      if (parseFloat(approvedAmount) >= parseFloat(amount)) {
        setRequireApproval(false);
        setApprovalConfirmed(true);
        setLoading(false);
      }
    } else {
      setRequireApproval(false);
      setApprovalConfirmed(true);
      setLoading(false);
    }

    store.dispatch(setLoading(false));
  };

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = [
    {
      text: 'From',
      textVal: `${coin.address.substring(0, 7)}.....${coin.address.substring(
        to.length - 7,
        to.length
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
      textVal: `${parseFloat(getFlooredFixed(networkFee, 8))} ${
        parentCoin ? parentCoin.coin_symbol.toUpperCase() : ''
      }/ $${addCommasToNumber(parseFloat(getFlooredFixed(fiatGasFee, 4)))}`,
    },
    {
      text: 'Total value',
      textVal: fromBillPay
        ? `${addCommasToNumber(getFlooredFixed(amount, 5))}
        ${coin?.coin_data?.coin_symbol?.toUpperCase()} / $${
            addCommasToNumber(getFlooredFixed(amount, 5)) *
            coin?.coin_data?.coins_market?.current_price
          }`
        : `${addCommasToNumber(getFlooredFixed(fiatAmountToSend, 2))} ${
            paymentRequest.targetCurrency
          }`,
    },
    {
      text: 'Provider Fee',
      textVal: `$${addCommasToNumber(
        getFlooredFixed(paymentRequest.feeAmount, 2)
      )}`,
    },
    {
      text: 'Date',
      textVal: moment(new Date()).format('MM/DD/YY'),
    },
  ];

  const handleTransaction = async () => {
    const web3helper = new Web3Helper();

    const { chains } = await chrome.storage.local.get('chains');
    const chain = chains.find(
      (chain) => chain.coinFamily === coin.coin_data.coin_family
    );

    if (requireApproval) {
      setLogoutOpenmodal(true);

      const data = await web3helper.sendForApproval(
        coin.coin_data.token_address,
        coin.address,
        to,
        coin.coin_data.id,
        chain.slug,
        coin.coin_data.coin_family == 1
          ? process.env.REACT_APP_ETH_RPC
          : coin.coin_data.coin_family == 3
          ? process.env.REACT_APP_BNB_RPC
          : coin.coin_data.coin_family == 7
          ? process.env.REACT_APP_AVAX_RPC
          : process.env.REACT_APP_MATIC_RPC,
        parseInt(chain.chainId),
        sessionPassword
      );
      if (!data) {
        setLogoutOpenmodal(false);
        return messageApi.error('Insufficient balance in wallet for gas fee.');
      }
      setLogoutOpenmodal(false);
      setRequireApproval(false);
      setApprovalHash(data);
    } else {
      store.dispatch(setLoading(true));
      if (chain.isEVM) {
        const response =
          await Web3Helper.generateRawTransactionForSpritzAndBroadcast(
            to,
            coin.address,
            amount,
            coin.coin_data.id,
            fiatCoin,
            fiatGasFee,
            currency.name,
            toName,
            chain.slug,
            chain.chainId,
            coin.coin_data.token_address,
            coin.coin_data.decimals,
            coin.coin_data.token_type,
            null,
            null,
            paymentRequest.data,
            paymentRequest,
            coin.coin_data.token_address ? true : false,
            sessionPassword,
            coin.coin_data.coin_family == 1
              ? process.env.REACT_APP_ETH_RPC
              : coin.coin_data.coin_family == 3
              ? process.env.REACT_APP_BNB_RPC
              : coin.coin_data.coin_family == 7
              ? process.env.REACT_APP_AVAX_RPC
              : process.env.REACT_APP_MATIC_RPC
          );

        if (!response) {
          store.dispatch(setLoading(false));
          return messageApi.error('Something went wrong.');
        }
      } else if (!chain.isEVM && chain.currencyName === 'BTC') {
        const response =
          await BTCHelper.generateRawTransactionForCoinAndBroadcast(
            to,
            coin.address,
            amount,
            coin.coin_data.id,
            fiatCoin,
            fiatGasFee,
            currency.name,
            toName,
            chain.slug,
            chain.chainId,
            rawTransaction
          );

        if (!response) {
          store.dispatch(setLoading(false));
          return messageApi.error('Something went wrong.');
        }
      }

      store.dispatch(setLoading(false));
      setIsModalOpen1(true);
    }
  };

  return (
    <div className={`scrollableCont`}>
      {contextHolder}
      <MenuRestofHeaders
        backTo={billPay ? '/creditBillPay' : '/enter-price-spritz'}
        title="Confirm" //{`Send ${coin.coin_data.coin_symbol.toUpperCase()}`}
        coin={coin}
        amount={fiatAmountToSend}
        mySpritzAccount={bankAccount}
        account={bankAccount}
        backAmount={fiatAmountToSend}
        billItem={billItem}
      />
      <div className={`flexedContent`}>
        <div className="confirmCurrency">
          <div
            className="confirmCurrency__card"
            style={{
              display: 'flex',
            }}
          >
            <div
              style={{
                flex: 2,
              }}
            >
              <h3 className="confirmCurrency__card__textTop">
                {addCommasToNumber(getFlooredFixed(amount, 5))}{' '}
                {coin.coin_data.coin_symbol.toUpperCase()}
              </h3>
              <p className="confirmCurrency__card__textBtm">
                ${addCommasToNumber(getFlooredFixed(fiatAmountToSend, 2))}
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {coin.coin_data.coin_image ? (
                <img
                  src={`${process.env.REACT_APP_IMAGE_BASE_URL}${coin.coin_data.coin_image}`}
                  alt=""
                  style={{
                    width: '50px',
                  }}
                />
              ) : null}
            </div>
          </div>
          <div className="confirmCurrency__keyValuesOuter">
            {data.map((ele) => (
              <div className="confirmCurrency__keyValues">
                <div className="confirmCurrency__keyValues__key">
                  {ele.text}
                </div>
                <div className="confirmCurrency__keyValues__value">
                  {ele.textVal}
                </div>
              </div>
            ))}
          </div>
          <ButtonComp
            onClick={() => {
              setOpenmodal(true);
            }}
            disabled={!approvalConfirmed && approvalHash}
            text={
              requireApproval
                ? 'Approve'
                : approvalConfirmed
                ? 'Send'
                : 'Approval Pending'
            }
            maxWidth={'100%'}
          />
        </div>
      </div>

      <ModalCustom
        title={'Approval Request'}
        isModalOpen={isLogoutModalOpen}
        customClass="customClassModal"
      >
        <div className="viewphrases">
          <div className="viewphrases__iInner">
            <ClipLoader size={65} color="#00adee" />
            <div
              style={{
                marginTop: '20px',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  textAlign: 'center',
                }}
              >
                Approval request has been processed successfully. Waiting for
                blockchain confirmation.
              </p>
            </div>
          </div>
        </div>
      </ModalCustom>

      <ModalCustom
        title={'Enter password'}
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleOk}
        customClass="customClassModal"
      >
        <div className="viewphrases">
          <InputFieldSimple
            placeholder="Password"
            getData={setPassword}
            value={sessionPassword}
            customFunction={async () => {
              const isCorrectPassword = await WalletHelper.verifyPassword(
                sessionPassword
              );
              // console.log(
              //   'isCorrectPassword on Enter in send confirm',
              //   isCorrectPassword
              // );

              if (sessionPassword != null) {
                if (!isCorrectPassword) {
                  return messageApi.error('Incorrect password provided.');
                }
              } else {
                return messageApi.error('Please enter password.');
              }

              setOpenmodal(false);
              setPassword(null);

              handleTransaction();
            }}
          />
          <div className="viewphrases__iInner">
            <img src={warning} />
            <div>
              <p>Do not share your password with anyone!</p>
              <p>It can be used to steal all your funds.</p>
            </div>
          </div>
          <ButtonComp
            text={'Proceed'}
            maxWidth={'100%'}
            onClick={async () => {
              const isCorrectPassword = await WalletHelper.verifyPassword(
                sessionPassword
              );
              if (sessionPassword != null) {
                if (!isCorrectPassword) {
                  return messageApi.error('Incorrect password provided.');
                }
              } else {
                return messageApi.error('Please enter password.');
              }
              setOpenmodal(false);
              setPassword(null);
              handleTransaction();
            }}
          />
        </div>
      </ModalCustom>

      <ModalCustom
        // title={"Show Secret Phrase"}
        handleCancel={handleCancel1}
        isModalOpen={isModalOpen1}
        handleOk={handleOk1}
        customClass="customClassModal"
        closable={false}
      >
        <div className={'confirmationsModal'}>
          <div className={'iInner'}>
            {theme == 'darkTheme' ? (
              <img src={DarkLogo} alt="" />
            ) : (
              <img src={Logo} alt="" />
            )}
            <div>
              <p>
                Withdraw request of{' '}
                {addCommasToNumber(getFlooredFixed(amount, 5))}{' '}
                {coin.coin_data.coin_symbol.toUpperCase()} has been processed
                successfully.
              </p>
            </div>
          </div>
          <ButtonComp
            text={'OK'}
            maxWidth={'100%'}
            onClick={() => {
              return navigate('/withdraw', {
                state: {
                  coin: coin,
                  account: bankAccount,
                  mySpritzAccount: bankAccount,
                  backAmount: fiatAmountToSend,
                },
              });
            }}
          />
        </div>
      </ModalCustom>
    </div>
  );
}

export default SendConfirmSpritz;
