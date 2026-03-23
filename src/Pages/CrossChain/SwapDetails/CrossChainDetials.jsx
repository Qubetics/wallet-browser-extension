/* eslint-disable jsx-a11y/alt-text */
/*global chrome*/

import React from 'react';
import MenuRestofHeaders from '../../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import './CrossChainDetials.scss';
import ArrowDashedLine from '../../../Assets/arr.svg';
import ButtonComp from '../../../Components/ButtonComp/ButtonComp';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { useRef } from 'react';
import { Web3Helper } from '../../../helpers/web3.helper';
import { message } from 'antd';
import { useState } from 'react';
import ModalCustom from '../../../Components/ModalCustom/ModalCustom';
import { ClipLoader } from 'react-spinners';
import { Loader } from '../../../Components/Loader/Loader';
import { CrossChainHelper } from '../../../helpers/crosschain.helper';
import { DURATION } from '../../../config/message.config';
import InputFieldSimple from '../../../Components/InputField/InputFieldSimple';
import Logo from '../../../Assets/logo.png';
import { WalletHelper } from '../../../helpers/wallet.helper';
import QubeticsLogo from '../../../Assets/QubeticsLogo.png';
import { formatNumberInput } from '../../../helpers/common.helper';

function getFlooredFixed(v, d) {
  return (Math.floor(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
}

function addCommasToNumber(number) {
  var parts = number.toString().split('.');
  var integerPart = parts[0];
  var decimalPart = parts[1] || ''; // Handle cases where there is no decimal part

  // Add commas to the integer part
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Combine the integer and decimal parts
  if (decimalPart !== '') {
    return integerPart + '.' + decimalPart;
  } else {
    return integerPart;
  }
}

function CrossChainDetails() {
  const { chain, account, currency, theme } = useSelector((state) => state);
  const {
    state: {
      token1,
      token2,
      amount,
      amount2,
      tokenChain,
      networkFee,
      walletAddress,
      token1Price,
      parentCoin,
      rpc,
      coinSymbol,
    },
  } = useLocation();

  const [isModalOpen1, setIsModalOpen1] = useState(false);

  const handleOk1 = () => {
    setIsModalOpen1(false);
  };
  const handleCancel1 = () => {
    setIsModalOpen1(false);
  };

  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const web3Helper = useRef(new Web3Helper(chain.rpcUrl));
  const crossChainHelper = useRef(new CrossChainHelper(chain.chainId));
  const [swapModal, setSwapModal] = useState(false);
  const [gasPrice, setGasPrice] = useState(null);
  const [gasEstimate, setGasEstimate] = useState(
    token1.tokenAddress ? 42000 : 21000
  );
  const [loading, setLoading] = useState(true);
  const [sessionPassword, setPassword] = useState(null);
  const [isModalOpen, setOpenmodal] = useState(false);

  const handleOk = () => {
    setOpenmodal(false);
  };

  const handleCancel = () => {
    setOpenmodal(false);
    setPassword(null);
  };
  const init = async () => {
    const gasPrice = networkFee;
    setGasPrice(gasPrice);
    setLoading(false);
  };

  useEffect(() => {
    init();
  }, []);

  const handleSwap = async () => {
    // console.log('sessionPassword   handleSwap', sessionPassword);
    setSwapModal(true);
    const data = await crossChainHelper.current.sendOrder(
      token1,
      token2,
      amount,
      amount2,
      walletAddress,
      tokenChain,
      networkFee,
      token1Price,
      parentCoin,
      rpc,
      coinSymbol,
      sessionPassword
    );

    if (!data) {
      setSwapModal(false);
      return messageApi.error(
        'Unable to process your transaction at the moment. Please try again later.'
      );
    }
    setSwapModal(false);
    return setIsModalOpen1(true);
  };

  return (
    <div className={`scrollableCont`}>
      {loading ? <Loader /> : null}
      {contextHolder}
      <MenuRestofHeaders backTo={'/swap'} title={'Swap'} />
      <div className={`flexedContent`}>
        <div className="swapDetails">
          <div className="swapDetails__iconsTop swapDetails__iconsTop-specific">
            <div>
              {token1.image ? (
                <img src={token1.image} width={30} height={30} />
              ) : (
                <div
                  className="randb"
                  style={{
                    height: '35px',
                    width: '35px',
                    background: '#fff',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {token1.symbol.split('')[0]}
                </div>
              )}
              <p style={{ margin: 0 }}>From</p>
            </div>
            <img
              src={ArrowDashedLine}
              width={144}
              height={12}
              style={{ marginTop: 10 }}
            />
            <div>
              {token2.image ? (
                <img src={token2.image} width={30} height={30} />
              ) : (
                <div
                  className="randb"
                  style={{
                    height: '35px',
                    width: '35px',
                    background: '#fff',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {token2.symbol.split('')[0]}
                </div>
              )}
              <p style={{ margin: 0 }}>To</p>
            </div>
          </div>
          <div className="swapDetails__valueText swapDetails__valueText-specific ">
            <p className="swapDetails__valueText__text swapDetails__valueText-specific-text">
              {/* <p style={{ margin: 0 }}>From</p> */}
              {/* <br /> */}
              {addCommasToNumber(getFlooredFixed(parseFloat(amount), 6))}{' '}
              {token1.symbol}
            </p>
            <p className="swapDetails__valueText__text swapDetails__valueText-specific-text">
              {/* <p style={{ margin: 0 }}>To</p> */}
              {addCommasToNumber(getFlooredFixed(parseFloat(amount2), 4))}{' '}
              {token2.symbol}
            </p>
          </div>
          {/* <div className="swapDetails__border"></div> */}
          <div className="swapDetails__address" style={{ marginTop: '16px' }}>
            <p className="swapDetails__address__key">From</p>
            <p className="swapDetails__address__val">
              <sapn>{`${token1.address.substring(0, 8)}.....
          ${token1.address.substring(
            token1.address.length - 8,
            token1.address.length
          )}`}</sapn>
            </p>
          </div>
          <div className="swapDetails__address">
            <p className="swapDetails__address__key">To</p>
            <p className="swapDetails__address__val">
              <sapn>
                {' '}
                {`${token2.address.substring(0, 8)}.....
          ${token2.address.substring(
            token2.address.length - 8,
            token2.address.length
          )}`}
              </sapn>
            </p>
          </div>
          {/* <div className="swapDetails__border"></div> */}
          <div
            className="swapDetails__keyValuesText"
            style={{ marginTop: '0' }}
          >
            <div className="swapDetails__keyValuesText__inner">
              <p className="swapDetails__keyValuesText__key">Type</p>
              <p className="swapDetails__keyValuesText__val">Cross-Chain</p>
            </div>
            <div className="swapDetails__keyValuesText__inner">
              <p className="swapDetails__keyValuesText__key">Network Fee</p>
              <p className="swapDetails__keyValuesText__val">
                {addCommasToNumber(getFlooredFixed(networkFee, 10))}{' '}
                {tokenChain.currencySymbol} / ({currency.symbol}{' '}
                {addCommasToNumber(
                  getFlooredFixed(parentCoin?.value * networkFee, 2)
                )}
                )
              </p>
            </div>
            <div className="swapDetails__keyValuesText__inner">
              <p className="swapDetails__keyValuesText__key">
                Estimated time of receiving
              </p>
              <p className="swapDetails__keyValuesText__val">1~20 Minutes</p>
            </div>
          </div>
          <ButtonComp
            onClick={() => setOpenmodal(true)}
            text={'Swap'}
            maxWidth={'100%'}
          />
        </div>
      </div>

      <ModalCustom
        title={'Swap Transaction'}
        isModalOpen={swapModal}
        customClass="customClassModal"
      >
        <div className="viewphrases">
          <div
            className=""
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <ClipLoader size={65} color="#00adee" />
            <div
              style={{
                marginTop: '20px',
                textAlign: 'center',
              }}
            >
              <p
                className="noAddress"
                style={{
                  textAlign: 'center',
                }}
              >
                Swap request sent. Waiting for blockchain confirmation.
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
          <div
            style={{
              marginBottom: '36px',
              width: '100%',
            }}
          >
            <InputFieldSimple
              placeholder="Password"
              getData={setPassword}
              value={sessionPassword}
              customFunction={async () => {
                const isCorrectPassword = await WalletHelper.verifyPassword(
                  sessionPassword
                );
                if (!isCorrectPassword) {
                  return messageApi.error('Incorrect password provided.');
                }
                setOpenmodal(false);
                handleSwap();
              }}
            />
          </div>

          <ButtonComp
            text={'Proceed'}
            maxWidth={'100%'}
            onClick={async () => {
              const isCorrectPassword = await WalletHelper.verifyPassword(
                sessionPassword
              );
              if (!isCorrectPassword) {
                return messageApi.error('Incorrect password provided.');
              }
              setOpenmodal(false);
              handleSwap();
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
      >
        <div className={'confirmationsModal'}>
          <div className={'iInner'}>
            {theme == 'darkTheme' ? (
              <img src={QubeticsLogo} />
            ) : (
              <img
                src={QubeticsLogo}
                style={{
                  height: '100px',
                }}
              />
            )}
            <div>
              <p>
                Swap request of {formatNumberInput(amount)}{' '}
                {token1.symbol.toUpperCase()} has been processed successfully.
              </p>
            </div>
          </div>
          <ButtonComp
            text={'OK'}
            maxWidth={'100%'}
            onClick={() => {
              return navigate('/wallet');
            }}
          />
        </div>
      </ModalCustom>
    </div>
  );
}

export default CrossChainDetails;
