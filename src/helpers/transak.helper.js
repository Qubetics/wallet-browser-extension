import {
  TRANSAK_PROD_API_KEY,
  TRANSAK_STAGE_API_KEY,
} from '../config/transak.config';
import transakSDK from '@transak/transak-sdk';
import { WalletHelper } from './wallet.helper';
import axios from 'axios';
import { server } from '../server';

export class TranskHelper {
  settings;
  chainId;
  constructor(
    testnet,
    chainId,
    walletAddress,
    amount,
    symbol,
    network,
    type,
    fiatType
  ) {
    if (type === 'BUY') {
      this.settings = {
        apiKey: testnet ? TRANSAK_STAGE_API_KEY : TRANSAK_PROD_API_KEY,
        environment: testnet ? 'STAGING' : 'PRODUCTION',
        defaultCryptoCurrency: symbol.toUpperCase(),
        cryptoCurrencyCode: symbol.toUpperCase(),
        network,
        walletAddress,
        fiatCurrency: fiatType,
        themeColor: '4096ff',
        hostURL: '',
        productsAvailed: 'BUY',
        fiatAmount: amount,
        widgetHeight: '500px',
        widgetWidth: '380px',
      };
    } else {
      this.settings = {
        apiKey: testnet ? TRANSAK_STAGE_API_KEY : TRANSAK_PROD_API_KEY,
        environment: testnet ? 'STAGING' : 'PRODUCTION',
        defaultCryptoCurrency: symbol.toUpperCase(),
        cryptoCurrencyCode: symbol.toUpperCase(),
        network,
        walletAddress,
        productsAvailed: 'SELL',
        fiatCurrency: fiatType,
        themeColor: '4096ff',
        hostURL: '',
        cryptoAmount: amount,
        widgetHeight: '500px',
        widgetWidth: '380px',
        paymentMethod: 'credit_debit_card',
      };
    }

    // console.log(this.settings);
    this.chainId = chainId;
  }

  initiate = async () => {
    const transak = new transakSDK(this.settings);
    transak.init();
    transak.on(transak.ALL_EVENTS, async (data) => {
      if (data.eventName === 'TRANSAK_ORDER_SUCCESSFUL') {
        await WalletHelper.addTransaction(
          this.chainId,
          data.status.walletAddress,
          data.status.walletAddress,
          0,
          data.status.cryptoAmount,
          null,
          data.status.cryptoCurrency,
          data.status.cryptoCurrency,
          null,
          0,
          'TRANSAK',
          data.status.id,
          data.status.status
        );
      }
    });
  };

  getMInMax = async (symbol, type, network) => {
    try {
      const { data } = await axios.get(
        type === 'BUY'
          ? `https://api.transak.com/api/v2/currencies/price?partnerApiKey=${TRANSAK_PROD_API_KEY}&fiatCurrency=USD&cryptoCurrency=${symbol}&isBuyOrSell=${type}&network=${network}`
          : `https://api.transak.com/api/v2/currencies/price?partnerApiKey=${TRANSAK_PROD_API_KEY}&fiatCurrency=EUR&cryptoCurrency=${symbol}&paymentMethod=credit_debit_card&isBuyOrSell=${type}&network=${network}`
      );
      return data;
    } catch (error) {
      return {
        status: 'error',
        message: error.response.data.error.message,
      };
    }
  };

  getMercuryoPrice = async (
    symbol,
    type,
    fiatAmount,
    fiatType,
    coin,
    walletAddress,
    account
  ) => {
    try {
      // console.log(
      //   symbol,
      //   type,
      //   fiatAmount,
      //   fiatType,
      //   coin,
      //   walletAddress,
      //   account
      // );

      
      let payload = {
        crypto: symbol,
        transak_network: coin.network,
        alchemy_network: coin.alchemy_network,
        fiat: fiatType,
        country: 'US',
        amount: +fiatAmount,
        payWayCode: '10001',
        side: type.toUpperCase(),
        end_user_id: walletAddress,
        digital_currency: coin.simplexCoinSymbol
          ? coin.simplexCoinSymbol.toUpperCase()
          : '',
        fiat_currency: fiatType,
        requested_currency: fiatType,
        requested_amount: +fiatAmount,
        client_ip: '1.2.3.4',
        coin_family: coin.coin_family,
      };
      // console.log('🚀 ~ TranskHelper ~ payload:', payload);
      for (let key in payload) {
        if (payload[key] == null || payload[key] == '') {
          delete payload[key]; // Delete the key from the payload object
        }
      }

      const { data } = await server.post(
        `on_off_ramp/fetch_price_new`,
        payload,
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      return data?.data;
    } catch (error) {
      // console.log(error, 'alchemy');
      return {
        status: 'error',
        message:
          'Unable to process your request. Entered amount is nor supported by the partner.',
      };
    }
  };

  generateAlchemyOrderURL = async (
    walletAddress,
    coinSymbol,
    chainSymbol,
    fiatAmount,
    type,
    fiatType,
    account,
    transactionId
  ) => {
    let plainText = '';

    if (type === 'BUY') {
      plainText = `address=${walletAddress}&appId=${process.env.REACT_APP_ALCHEMY_PAY_APP_ID}`;
    } else {
      plainText = this.getSignStrSell({
        appId: process.env.REACT_APP_ALCHEMY_PAY_APP_ID,
        cryptoAmount: fiatAmount,
        fiat: fiatType,
        urlType: 'app',
      });
    }

    // console.log(plainText);

    const { data } = await server.post(
      '/on_off_ramp/encrypt',
      {
        plainText: plainText,
        secretKeyData: process.env.REACT_APP_TRANSAK_SECRET_KEY,
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    let URL = null;

    if (type === 'BUY') {
      URL = `https://ramp.alchemypay.org/?crypto=${coinSymbol}&network=${chainSymbol}&country=US&fiatAmount=${fiatAmount}&fiat=${fiatType}&appId=${process.env.REACT_APP_ALCHEMY_PAY_APP_ID}&address=${walletAddress}&sign=${data.data}&redirectURL=${process.env.REACT_APP_REDIRECT_URL}/transaction-success&callbackUrl=${process.env.REACT_APP_BASE_URL}/on_off_ramp/alchemy_webhook&showTable=buy&merchantOrderNo=${transactionId}`;
    } else {
      // URL = `https://ramp.alchemypay.org/?appId=${process.env.REACT_APP_ALCHEMY_PAY_APP_ID}&crypto=${coinSymbol}&network=${chainSymbol}&urlType=app&showTable=sell&country=US&cryptoAmount=${fiatAmount}&fiat=${fiatType}&type=sell&sign=${data.data}#/index`;
      URL = `https://ramp.alchemypay.org/?appId=${process.env.REACT_APP_ALCHEMY_PAY_APP_ID}&crypto=${coinSymbol}&network=${chainSymbol}&showTable=sell&merchantOrderNo=${transactionId}&country=US&cryptoAmount=${fiatAmount}&fiat=${fiatType}&type=sell&urlType=app&memo=&merchantName=${process.env.REACT_APP_ALCHEMY_PAY_MERCHANT_NAME}&sign=${data.data}&callbackUrl=${process.env.REACT_APP_BASE_URL}/on_off_ramp/alchemy_webhook&redirectURL=${process.env.REACT_APP_REDIRECT_URL}/transaction-success`;
    }

    return URL;
  };

  getSignStrSell(data) {
    var sign_parameter = [
      'address',
      'appId',
      'callbackUrl',
      'cryptoAmount',
      'fiat',
      'fiatAmount',
      'memo',
      'urlType',
      'withdrawUrl',
    ];
    var dic = {};
    for (let v in sign_parameter) {
      var key = sign_parameter[v];
      if (key in data) {
        dic[key] = data[key];
      }
    }
    var signStr = '';
    for (let k in dic) {
      signStr = signStr + k + '=' + dic[k] + '&';
    }
    return signStr.substring(0, signStr.length - 1);
  }

}
