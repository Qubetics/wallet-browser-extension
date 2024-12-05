/* eslint-disable react-hooks/exhaustive-deps */
/*global chrome*/
import { message } from 'antd';
import { ethers } from 'ethers';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { store } from '../../..';
import { setLoading } from '../../../actions/loading';
import MenuRestofHeaders from '../../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import ButtonComp from '../../../Components/ButtonComp/ButtonComp';
import { InputField } from '../../../Components/InputField/InputFieldSimple';
import ModalCustom from '../../../Components/ModalCustom/ModalCustom';
import { Web3Helper } from '../../../helpers/web3.helper';
import style from './style.module.scss';
import AddressBook from '../../../Assets/address-book-svgrepo-com.svg';
import AddressTable from '../../../Components/AddressTable/AddressTable';
import { useEffect } from 'react';
import { SolanaHelper } from '../../../helpers/solana.helper';
import { BTCHelper } from '../../../helpers/btc.helper';
import { WalletHelper } from '../../../helpers/wallet.helper';
// import { AdaHelper } from '../../../helpers/ada.helper';
import { ENSHelper } from '../../../helpers/ens.helper';
import { UnstoppableDomainHelper } from '../../../helpers/unstopable.helper';
import Add from '../../../Assets/add.svg';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import {
  addCommasToNumber,
  getFlooredFixed,
} from '../../../helpers/conversion.helper';
import { server } from '../../../server';
import {
  formatNumberFiat,
  getCoinBalance,
  getTokenBalance,
} from '../../../helpers/common.helper';

let inputCount = 0;
let transactionSize = 0;
let outputCount = 2;
let btcTosatoshi = 100000000;
let btcTosatoshiMultiplier = 0.00000001;

function SendCoins() {
  const { account, currency } = useSelector((state) => state);

  const {
    state: { coin, redirectTo, backAddress, backAmount },
  } = useLocation();
  const navigate = useNavigate();

  const [myBalance, setBalance] = useState(0);
  let [address, setAddress] = useState(backAddress || null);
  const [contact, setContact] = useState(null);
  const [amount, setAmount] = useState(backAmount || null);
  const [value, setValue] = useState(0.0);
  const [price, setPrice] = useState(0);
  const [percent, setPercent] = useState(null);
  const [isLogoutModalOpen, setLogoutOpenmodal] = useState(false);
  const [messageApi, contextHolder] = message.useMessage({});
  const [list, setList] = useState([]);

  useEffect(() => {
    init();
    const price = coin.coin_data.coins_market || 0;

    if (price) {
      const value = parseFloat(coin.balance) * parseFloat(price.current_price);
      setValue(value);
      setPrice(price.current_price);
    }
  }, []);

  const init = async () => {
    try {
      setBalance(coin.balance);
      store.dispatch(setLoading(true));
      console.log({
        wallet_address:
          account.coinFamilyAndAddress[coin.coin_data.coin_family],
      });
      const { data } = await server.post(
        '/wallet/address_book/list',
        {
          wallet_address:
            account.coinFamilyAndAddress[coin.coin_data.coin_family],
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      setList(
        data.data.filter((el) => el.coin_family === coin.coin_data.coin_family)
      );
      
      store.dispatch(setLoading(false));
    } catch (error) {
      store.dispatch(setLoading(false));
      messageApi.error(error.message);
    }
  };

  const onLogoutClick = () => {
    setLogoutOpenmodal(true);
  };

  const handlLogouteOk = () => {
    setLogoutOpenmodal(false);
  };

  const handleLogoutCancel = () => {
    setLogoutOpenmodal(false);
  };

  const getBlockChain = (coin_family) => {
    switch (coin_family) {
      case '1': {
        return { coin: 'ETH', rpcUrl: process.env.REACT_APP_ETH_RPC };
      }
      case '2': {
        return { coin: 'BTC', rpcUrl: process.env.REACT_APP_BTC_RPC };
      }
      case '3': {
        return {
          coin: 'BSC',
          rpcUrl: 'https://bsc-dataseed1.binance.org/',
          // process.env.REACT_APP_BNB_RPC
        };
      }
      case '4': {
        return { coin: 'SOL', rpcUrl: 'https://api.mainnet-beta.solana.com' };
      }
      case '5': {
        return { coin: 'ADA', rpcUrl: '' };
      }
      case '6': {
        return { coin: 'POL', rpcUrl: process.env.REACT_APP_MATIC_RPC };
      }
      case '7': {
        return {
          coin: 'AVAX',
          rpcUrl: process.env.REACT_APP_AVAX_RPC,
        };
      }
      case '8': {
        return { coin: 'CRO', rpcUrl: '' };
      }
      case '9': {
        return { coin: 'PLS', rpcUrl: process.env.REACT_APP_PLS_RPC };
      }
    }
  };
  const calculatePercentageWise = async (percentage) => {
    if (coin.coin_data.token_address) {
      let rpc;
      let amountToSend = 0;

      if (coin.coin_data.coin_family != 4 && coin.coin_data.coin_family != 5) {
        switch (coin.coin_data.coin_family) {
          case 1:
            rpc = process.env.REACT_APP_ETH_RPC;
            break;
          case 9:
            rpc = process.env.REACT_APP_PLS_RPC;
            break;
          case 3:
            rpc = process.env.REACT_APP_BNB_RPC;
            break;
          case 6:
            rpc = process.env.REACT_APP_MATIC_RPC;
            break;
          case 7:
            rpc = process.env.REACT_APP_AVAX_RPC;
            break;
          case 8:
            rpc = process.env.REACT_APP_CRO_RPC;
            break;
          default:
            rpc = process.env.REACT_APP_ETH_RPC; // Default to Ethereum RPC if no specific case matches
        }
        store.dispatch(setLoading(true));
        amountToSend = await Web3Helper.getTokenBalance(
          coin.coin_data.token_address,
          coin.address,
          rpc
        );
    
     
        
        if (!amountToSend) {
          store.dispatch(setLoading(false));
          amountToSend = coin.balance;
        }
           setBalance(amountToSend)
        store.dispatch(setLoading(false));
      } else {
        amountToSend = coin.balance;
      }

      //setAmount without rounding off the last didgits after decimal use bignumber
      const amountToSend2 = new BigNumber(amountToSend);

      // Calculate the maximum number of decimal places based on the precision of the number
      const maxDecimals = amountToSend2.decimalPlaces();

      // Set the amount without rounding and without exponential notation
      const amountString = amountToSend2.toFixed(
        maxDecimals,
        BigNumber.ROUND_DOWN
      );

      setAmount(amountString);
    } else {
      const { chains } = await chrome.storage.local.get('chains');
      const chain = chains.find(
        (chain) => chain.coinFamily === coin.coin_data.coin_family
      );

      if (chain.isEVM) {
        store.dispatch(setLoading(true));
        const balance = new BigNumber(coin.balance).times(
          coin.coin_data.decimals
        );

        const amountToSend = new BigNumber(balance);

        // console.log(amountToSend.toString());

        // Get the current gas price
        const gasPrice = await Web3Helper.getGasPrice(
          chain.slug,
          coin.address,
          coin.address,
          coin.coin_data.token_address ? 1 : 0,
          coin.coin_data.token_address
        );

        if (!gasPrice) {
          store.dispatch(setLoading(false));
          return messageApi.error('Unable to fetch gas price at the moment.');
        }

        // Estimate the gas cost for a sample transaction
        // const gasLimit = gasPrice.estimate * 2; // Assuming a standard transaction
        const gasLimit = gasPrice.estimate; // Assuming a standard transaction
        const gasCost = new BigNumber(
          new BigNumber(gasPrice.price).times(1000000000)
        ).times(gasLimit);

        // Apply the buffer factor to the gas cost
        const bufferedGasCost = gasCost.times(2.5);
        // Subtract the buffered gas cost from the maximum BNB
        const maxBNBAfterGas = new BigNumber(amountToSend).minus(
          bufferedGasCost
        );

        if (maxBNBAfterGas.isNegative()) {
          store.dispatch(setLoading(false));
          return messageApi.error('Insufficient balance to cover gas fee.');
        }

        // console.log(
        //   maxBNBAfterGas
        //     .integerValue(BigNumber.ROUND_DOWN)
        //     .dividedBy(coin.coin_data.decimals)
        //     .toString()
        // );
        let amt = formatNumberFiat(
          maxBNBAfterGas
            .integerValue(BigNumber.ROUND_DOWN)
            .dividedBy(coin.coin_data.decimals)
            .toString()
        );
        setAmount(amt);
        store.dispatch(setLoading(false));
      } else if (!chain.isEVM && chain.currencyName === 'SOL') {
        const solanaHelper = new SolanaHelper(chain.rpcUrl);

        store.dispatch(setLoading(true));
        let balance = coin.balance;
        balance = (balance * 99) / 100;
        const gasPrice = solanaHelper.getGasPrice();
        balance = balance - 0.0015; // Added fee with some buffer values i.e 0.001495 + gas price = 0.0015
        // balance = balance - 0.0015;
        const amountToSend = parseFloat(balance) * (percentage / 100);
        // console.log("amountToSend::::::::::", amountToSend);
        if (parseFloat(amountToSend) - parseFloat(gasPrice) * 3 < 0) {
          store.dispatch(setLoading(false));
          return messageApi.error(
            'You do not have enough balance to proceed with the transaction.'
          );
        }
        let amt = formatNumberFiat(
          (parseFloat(amountToSend) - parseFloat(gasPrice) * 3)
            .toFixed(6)
            .toString()
        );
        setAmount(amt);
        store.dispatch(setLoading(false));
      } else if (!chain.isEVM && chain.currencyName === 'BTC') {
        try {
          store.dispatch(setLoading(true));
          const gasPrice = await BTCHelper.getBTCGasPrice();
          const unspent = await BTCHelper.getUnspent(coin.address);
          let balance = coin.balance;
          balance = (balance * 99) / 100;
          // console.log(
          //   "🚀 ~ file: SendCoins.jsx:193 ~ calculatePercentageWise ~ balance:",
          //   balance
          // );

          const amountToSend = parseFloat(balance) * (percentage / 100);
          // console.log(
          //   "🚀 ~ file: SendCoins.jsx:195 ~ calculatePercentageWise ~ amountToSend:",
          //   amountToSend
          // );

          if (!unspent) {
            store.dispatch(setLoading(false));
            return messageApi.error('Unable to fetch unspent at the moment.');
          }

          if (unspent.length === 0) {
            store.dispatch(setLoading(false));
            return messageApi.error(
              'You have a pending transaction in your account or you do not have enough balance to proceed with the transaction.'
            );
          }

          const inputs = [];
          let totalAmountAvailable = 0;

          unspent.forEach((element) => {
            let utxo = {};
            utxo.satoshis = Math.floor(Number(element.value));
            utxo.script = element.script;
            utxo.address = coin.address;
            utxo.txId = element.tx_hash;
            utxo.outputIndex = element.tx_output_n;
            totalAmountAvailable += parseFloat(utxo.satoshis);
            inputCount += 1;
            inputs.push(utxo);
          });

          transactionSize =
            inputCount * 146 + outputCount * 34 + 10 - inputCount;
          const totalFee = (
            transactionSize *
            gasPrice *
            btcTosatoshiMultiplier
          ).toFixed(8);
          // console.log(
          //   "🚀 ~ file: SendCoins.jsx:232 ~ calculatePercentageWise ~ totalFee:",
          //   totalFee
          // );

          if (amountToSend - totalFee * 2.5 < 0) {
            store.dispatch(setLoading(false));

            return messageApi.error(
              'You do not have enough balance to proceed with the transaction.'
            );
          }

          let amt = formatNumberFiat(
            (amountToSend - totalFee * 2.5).toString()
          );
          setAmount(amt);
          store.dispatch(setLoading(false));
        } catch (error) {
          store.dispatch(setLoading(false));
          return messageApi.error(error.message);
        }
      } else if (!chain.isEVM && chain.currencyName === 'ADA') {
        try {
          store.dispatch(setLoading(true));

          const fee = null;
          // await AdaHelper.getFee(coin.address, coin.address, 1);
          let balance = coin.balance;
          balance = (balance * 99) / 100;
          let amountToSend = parseFloat(balance) * (percentage / 100);

          // console.log(
          //   "CALLLLLLLLLL ",
          //   parseFloat(amountToSend) - parseFloat(fee) - 2
          // );
          if (parseFloat(amountToSend) - parseFloat(fee) - 2 < 0) {
            store.dispatch(setLoading(false));

            return messageApi.error(
              'You do not have enough balance to proceed with the transaction.'
            );
          }

          let amt = formatNumberFiat(
            (parseFloat(amountToSend) - parseFloat(fee) - 2).toFixed(6)
          );
          setAmount(amt);
          store.dispatch(setLoading(false));
        } catch (error) {
          console.log('ERROR assignment : ', error);
          store.dispatch(setLoading(false));
          setLoading(false);
          return messageApi.error(error.message);
        }
      }
    }
  };

  return (
    <div className={`scrollableCont ${style.send}`}>
      {contextHolder}
      <MenuRestofHeaders
        backTo={redirectTo ? redirectTo : '/send'}
        title={`Send ${coin.coin_data.coin_symbol.toUpperCase()}`}
        coin={coin}
      />
      <div className={`flexedContent`}>
        <InputField
          placeholder={'Wallet Address'}
          label='Address'
          value={address}
          checkForSymbols={true}
          getData={setAddress}
          addonAfter={
            <>
              <span
                onClick={async (e) => {
                  onLogoutClick();
                }}
              >
                <img
                  src={AddressBook}
                  style={{
                    width: '25px',
                    marginRight: '10px',
                  }}
                  alt=''
                />
              </span>
              <span
                className={style.send__pasteText}
                style={{
                  position: 'relative',
                  top: '-9px',
                }}
                onClick={async (e) => {
                  const text = await navigator.clipboard.readText();
                  setAddress(text);
                }}
              >
                Paste
              </span>
            </>
          }
        />
        <InputField
          placeholder={'Enter Amount'}
          addonAfter={
            <>
              <span
                className={style.send__pasteText}
                style={{
                  position: 'relative',
                  top: '-1px',
                  left: '-5px',
                  borderLeft: '0px',
                }}
                onClick={() => {
                  calculatePercentageWise(100);
                }}
              >
                Max
              </span>
            </>
          }
          getData={(amount) => {
            const afterDecimal = amount.split('.')[1];

            // Get the maximum allowed characters before the decimal point (15 characters)
            const maxCharactersBeforeDecimal = 15;

            if (afterDecimal) {
              // Get the maximum allowed decimals for the cryptocurrency (e.g., Bitcoin has 8 decimals)
              const maxDecimals = coin.coin_data.decimals.toString().length - 1;
              // Check if the entered decimal part is longer than the maximum allowed
              if (afterDecimal.toString().length > maxDecimals) {
                return; // Return if decimal part is too long
              }

              // Check if the characters before the decimal exceed the maximum allowed
              const beforeDecimal = amount.split('.')[0];
              if (
                beforeDecimal.toString().length > maxCharactersBeforeDecimal
              ) {
                return; // Return if characters before decimal exceed the maximum allowed
              }
            } else {
              // If there's no decimal, check the whole input length
              if (amount.length > maxCharactersBeforeDecimal) {
                return; // Return if the whole input exceeds the maximum allowed
              }
            }

            setAmount(amount);
          }}
          type={'number'}
          label='Amount'
          value={amount} //  {amount}
          checkForSymbols={true}
        />

        <div className={style.do}>
          <div
            className={style.send__infoText}
            // style={{
            //   position: 'relative',
            //   left: '20px',
            // }}
          >
            = {currency.symbol}
            {addCommasToNumber(
              getFlooredFixed(
                parseFloat(amount ? amount : 0) * parseFloat(price),
                2
              )
            )}
          </div>
          <div className={style.send__infoText}>
            <span
              style={{
                color: 'rgb(0, 174, 239)',
                // position: 'relative',
                // top: '-6px',
              }}
            >
              {' '}
              Available Balance{' '}
            </span>
            <br></br> {addCommasToNumber(getFlooredFixed(myBalance, 5))}{' '}
            {coin.coin_data.coin_symbol.toUpperCase()} ~ {currency.symbol}
            {getFlooredFixed(value, 2)}
          </div>
        </div>

        <ButtonComp
          onClick={async () => {
            store.dispatch(setLoading(true));

            const { chains } = await chrome.storage.local.get('chains');
            const chain = chains.find(
              (chain) => chain.coinFamily === coin.coin_data.coin_family
            );

            if (!chain.isEVM && chain.currencyName === 'ADA' && amount < 1) {
              store.dispatch(setLoading(false));
              return messageApi.error(
                'The minimum value must be greater than 1 or equal to 1.'
              );
            }

            if (!amount) {
              store.dispatch(setLoading(false));
              return messageApi.error(
                'Please enter a valid amount to proceed.'
              );
            }

            const finalAmount = new BigNumber(amount);
            const balance = new BigNumber(myBalance);

            if (finalAmount.gt(balance)) {
              store.dispatch(setLoading(false));
              return messageApi.error(
                'Insufficient balance to proceed with the transaction'
              );
            }

            if (isNaN(parseFloat(amount))) {
              store.dispatch(setLoading(false));
              return messageApi.error(
                'Please enter a valid amount to proceed.'
              );
            }
            if (parseFloat(amount) <= 0) {
              store.dispatch(setLoading(false));
              return messageApi.error(
                'Please enter a valid amount to proceed.'
              );
            }
            if (!address) {
              store.dispatch(setLoading(false));
              return messageApi.error(
                'Please enter a valid address to proceed.'
              );
            }

            const myAddress = account.coinFamilyAndAddress[chain.coinFamily];

            if (myAddress.toLowerCase() === address.toLowerCase()) {
              store.dispatch(setLoading(false));
              return messageApi.error('You cannot send to your own address.');
            }

            let ENSName = null;
            const checkIfUserEnteredENS = address.split('.')[1]
              ? address.split('.')[1].toLowerCase()
              : null;
            if (checkIfUserEnteredENS) {
              if (checkIfUserEnteredENS === 'eth') {
                const checkForENS = await ENSHelper.findAddress(address);
                if (!checkForENS.status) {
                  store.dispatch(setLoading(false));
                  return messageApi.error('Invalid ENS name provided.');
                } else {
                  ENSName = address;
                  address = checkForENS.address;
                }
              } else {
                const checkForENS = await UnstoppableDomainHelper.findAddress(
                  address,
                  chain.currencySymbol.toUpperCase()
                );
                if (!checkForENS.status) {
                  store.dispatch(setLoading(false));
                  return messageApi.error('Invalid domain name provided.');
                } else {
                  ENSName = address;
                  address = checkForENS.address;
                }
              }
            }

            const findContact = list.find(
              (l) => l.address.toLowerCase() === address.toLowerCase()
            );

            if (chain.isEVM) {
              if (!ethers.utils.isAddress(address)) {
                store.dispatch(setLoading(false));
                return messageApi.error(
                  'Please provide a valid address to proceed.'
                );
              }

              if (!amount) {
                store.dispatch(setLoading(false));
                return messageApi.error(
                  'Please provide a valid amount to proceed.'
                );
              }

              const nativeCoinResponse = await server.post(
                '/wallet/get_coin_balances',
                {
                  wallet_address: coin.address,
                  coin_family: coin.coin_data.coin_family,
                  fiat_currency: currency.name,
                },
                {
                  headers: {
                    Authorization: account.jwtToken,
                  },
                }
              );

              const gasData = await Web3Helper.getGasPrice(
                chain.slug,
                coin.address,
                coin.address,
                coin.coin_data.token_address ? 1 : 0,
                coin?.coin_data?.token_address
              );

              // console.log("GASSSS DATA : ", gasData);
              if (!gasData) {
                store.dispatch(setLoading(false));
                return messageApi.error(
                  'Unable to fetch gas price at the moment.'
                );
              }

              const nativeCoinBalance = new BigNumber(
                nativeCoinResponse.data.data.balance
              );
              // console.log("nativeCoinBalance DATA : ", nativeCoinBalance);
              const finalAmount = new BigNumber(amount);
              console.log('🚀 ~ finalAmount:', finalAmount.toString());
              let gasEstimate = new BigNumber(gasData.estimate);
              const gasPrice = new BigNumber(gasData.price).times(1000000000);

              const gasInEth = gasPrice
                .times(gasEstimate)
                .div(Math.pow(10, 18));

              console.log(
                'nativeCoinBalance ::: ',
                Number(nativeCoinBalance),
                '  gasInEth :: ',
                Number(gasInEth)
              );
              if (coin.coin_data.token_address) {
                if (nativeCoinBalance.isLessThan(gasInEth)) {
                  store.dispatch(setLoading(false));
                  return messageApi.error(
                    'Insufficient fee to proceed with the transaction.'
                  );
                }

                const tokenBalance = new BigNumber(myBalance);
                console.log('🚀 ~ tokenBalance:', tokenBalance.toString());

                if (tokenBalance.isLessThan(finalAmount)) {
                  store.dispatch(setLoading(false));
                  return messageApi.error(
                    'Insufficient balance to proceed with the transaction'
                  );
                }
              } else {
                const totalAmountIncludingGasPriceInEth =
                  gasInEth.plus(finalAmount);

                if (
                  nativeCoinBalance.isLessThan(
                    totalAmountIncludingGasPriceInEth
                  )
                ) {
                  store.dispatch(setLoading(false));
                  return messageApi.error(
                    'Insufficient balance to proceed with the transaction'
                  );
                }
              }

              store.dispatch(setLoading(false));
              navigate('/confirmCurrency', {
                state: {
                  to: address,
                  amount: amount,
                  coin,
                  networkFee: gasInEth.toFixed(5),
                  ENSName,
                  contact: findContact?.name,
                  redirectTo,
                },
              });
            } else if (!chain.isEVM && chain.currencyName === 'SOL') {
              const solanaHelper = new SolanaHelper(chain.rpcUrl);

              const gasPrice = solanaHelper.getGasPrice();

              if (amount > parseFloat(myBalance)) {
                store.dispatch(setLoading(false));
                return messageApi.error(
                  'Please provide a valid amount to proceed.'
                );
              }
              store.dispatch(setLoading(false));
              navigate('/confirmCurrency', {
                state: {
                  to: address,
                  amount: amount,
                  coin,
                  networkFee: gasPrice,
                  redirectTo,
                },
              });
            } else if (!chain.isEVM && chain.currencyName === 'BTC') {
              try {
                const gasPrice = await BTCHelper.getBTCGasPrice();
                const unspent = await BTCHelper.getUnspent(coin.address);
                if (!unspent) {
                  store.dispatch(setLoading(false));
                  return messageApi.error(
                    'Unable to fetch unspent at the moment.'
                  );
                }
                if (unspent.length === 0) {
                  store.dispatch(setLoading(false));
                  return messageApi.error(
                    'You have a pending transaction in your account or you do not have enough balance to proceed with the transaction.'
                  );
                }
                const inputs = [];
                let totalAmountAvailable = 0;
                unspent.forEach((element) => {
                  let utxo = {};
                  utxo.satoshis = Math.floor(Number(element.value));
                  utxo.script = element.script;
                  utxo.address = coin.address;
                  utxo.txId = element.tx_hash;
                  utxo.outputIndex = element.tx_output_n;
                  totalAmountAvailable += parseFloat(utxo.satoshis);
                  inputCount += 1;
                  inputs.push(utxo);
                });
                transactionSize =
                  inputCount * 146 + outputCount * 34 + 10 - inputCount;
                let fee = transactionSize * gasPrice;
                const totalFee = (
                  transactionSize *
                  gasPrice *
                  btcTosatoshiMultiplier
                ).toFixed(8);
                console.log(
                  '🚀 ~ file: SendCoins.jsx:591 ~ onClick={ ~ totalFee:',
                  +totalFee,
                  amount
                );

                const totalAmount = +totalFee + amount;
                console.log(
                  '🚀 ~ file: SendCoins.jsx:594 ~ onClick={ ~ totalAmount:',
                  totalAmount
                );

                if (totalAmount > myBalance) {
                  store.dispatch(setLoading(false));
                  return messageApi.error(
                    'Not enough balance to proceed with the transaction.'
                  );
                }

                // console.log(
                //   totalAmountAvailable,
                //   Math.round(amount * btcTosatoshi),
                //   btcTosatoshi,
                //   fee,
                //   amount
                // );
                if (
                  totalAmountAvailable -
                    Math.round(amount * btcTosatoshi) -
                    fee <
                  0
                ) {
                  store.dispatch(setLoading(false));
                  return messageApi.error(
                    'Insufficient Balance to proceed with the transactions.'
                  );
                } else {
                  const bitcore = require('bitcore-lib');
                  const transaction = new bitcore.Transaction();
                  console.log(
                    '🚀 ~ file: SendCoins.jsx:630 ~ transaction:',
                    transaction
                  );
                  // console.log(inputs);
                  transaction.from(inputs);
                  console.log(
                    '🚀 ~ file: SendCoins.jsx:632 ~ transaction:',
                    transaction
                  );

                  transaction.to(
                    address,
                    parseInt(Math.round(amount * btcTosatoshi).toString())
                  );
                  // console.log(
                  //   "🚀 ~ file: SendCoins.jsx:635 ~ address:",
                  //   address
                  // );

                  // console.log(
                  //   "🚀 ~ file: SendCoins.jsx:637 ~ transaction:",
                  //   transaction
                  // );
                  // console.log(
                  //   "🚀 ~ file: SendCoins.jsx:636 ~ transaction:",
                  //   transaction
                  // );
                  let satoshis = 0;
                  for (var i = 0; i < inputs.length; i++) {
                    satoshis = inputs[i].satoshis + satoshis;
                  }
                  if (
                    satoshis -
                      (fee +
                        parseInt(
                          Math.round(amount * btcTosatoshi).toString()
                        )) >
                    546
                  ) {
                    transaction.change(coin.address);
                  }
                  if (
                    satoshis -
                      (fee +
                        parseInt(
                          Math.round(amount * btcTosatoshi).toString()
                        )) >
                    546
                  ) {
                    transaction.fee(fee);
                  } else {
                    transaction.fee(
                      fee +
                        (satoshis -
                          (fee +
                            parseInt(
                              Math.round(amount * btcTosatoshi).toString()
                            )))
                    );
                  }
                  const btcPrivateKey =
                    await WalletHelper.getBitcoinPrivateKey();

                  // console.log(
                  //   "🚀 ~ file: SendCoins.jsx:656 ~ btcPrivateKey:",
                  //   btcPrivateKey
                  // );

                  if (!btcPrivateKey) {
                    store.dispatch(setLoading(false));
                    return messageApi.error(
                      'Unable to fetch private key at the moment please try again later.'
                    );
                  }
                  transaction.sign(btcPrivateKey);
                  const rawTransaction = transaction.serialize();
                  store.dispatch(setLoading(false));
                  navigate('/confirmCurrency', {
                    state: {
                      rawTransaction,
                      to: address,
                      amount: amount,
                      coin,
                      ENSName,
                      redirectTo,
                      networkFee: (
                        transactionSize *
                        gasPrice *
                        btcTosatoshiMultiplier
                      ).toFixed(8),
                    },
                  });
                }
              } catch (error) {
                console.log(error);
                store.dispatch(setLoading(false));
                return messageApi.error(error.message);
              }
            } else if (!chain.isEVM && chain.currencyName === 'ADA') {
              try {
                if (coin.tokenAddress) {
                  store.dispatch(setLoading(true));
                  const fee = null;
                  // await AdaHelper.getFee(
                  //   address,
                  //   coin.address,
                  //   amount
                  // );
                  if (!fee) {
                    store.dispatch(setLoading(false));
                    return messageApi.error('Unable to fetch fee.');
                  }
                  const adaBalance = myBalance;
                  if (
                    parseFloat(adaBalance) <
                    parseFloat(fee) + parseFloat(1)
                  ) {
                    store.dispatch(setLoading(false));
                    return messageApi.error(
                      'You do not have enough gas fee to proceed with the transaction.'
                    );
                  }
                  const totalAmount = parseFloat(amount);
                  if (totalAmount > parseFloat(myBalance)) {
                    store.dispatch(setLoading(false));
                    return messageApi.error(
                      'You do not have enough balance to proceed with the transaction.'
                    );
                  }
                  store.dispatch(setLoading(false));
                  navigate('/confirmCurrency', {
                    state: {
                      to: address,
                      amount: amount,
                      coin,
                      networkFee: fee,
                      ENSName,
                    },
                  });
                } else {
                  store.dispatch(setLoading(true));
                  const fee = null;
                  //  await AdaHelper.getFee(
                  //   address,
                  //   coin.address,
                  //   amount
                  // );
                  if (!fee) {
                    store.dispatch(setLoading(false));
                    return messageApi.error('Unable to fetch fee.');
                  }
                  const totalAmount = parseFloat(fee) + parseFloat(amount);
                  if (totalAmount > parseFloat(myBalance)) {
                    store.dispatch(setLoading(false));
                    return messageApi.error(
                      'You do not have enough balance to proceed with the transaction.'
                    );
                  }
                  store.dispatch(setLoading(false));
                  navigate('/confirmCurrency', {
                    state: {
                      to: address,
                      amount: amount,
                      coin,
                      networkFee: fee,
                      ENSName,
                      redirectTo,
                    },
                  });
                }
              } catch (error) {
                console.log('CATCHHHHHHHH ', error);
              }
            }
          }}
          text={'Continue'}
          maxWidth={'100%'}
        />
      </div>
      <ModalCustom
        title={'Address Book'}
        handleCancel={handleLogoutCancel}
        isModalOpen={isLogoutModalOpen}
        handleOk={handlLogouteOk}
        customClass='customClassModal'
      >
        <div className={style.viewphrases}>
          {list.length > 0 ? (
            <>
              <AddressTable
                setAddress={(value, name) => {
                  setAddress(value);
                  setContact(name);
                  handlLogouteOk();
                }}
                dataArray={list.map((el) => {
                  return {
                    address: el.address,
                    name: el.name.toUpperCase(),
                  };
                })}
              />
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: '10px',
                }}
              >
                <span
                  style={{ cursor: 'pointer', display: 'flex' }}
                  to={void 0}
                  onClick={() => {
                    navigate('/add-contact', {
                      state: {
                        coin,
                        redirectTo,
                      },
                    });
                  }}
                >
                  <img src={Add} alt='' />
                  <span className='noAddress'>Add Address</span>
                </span>
              </div>
            </>
          ) : (
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <span
                style={{ cursor: 'pointer', display: 'flex' }}
                to={void 0}
                onClick={() => {
                  navigate('/add-contact', {
                    state: {
                      coin,
                      redirectTo,
                    },
                  });
                }}
              >
                <img src={Add} style={{ marginRight: '7px' }} alt='' />
                <span className='noAddress'>Add Address</span>
              </span>
            </div>
          )}
        </div>
      </ModalCustom>
    </div>
  );
}

export default SendCoins;
