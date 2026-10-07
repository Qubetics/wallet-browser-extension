import axios from 'axios';
import { store } from '..';
import { IS_PRODUCTION } from '../config/bitcoin.config';
import { server } from '../server';
import { validate } from 'bitcoin-address-validation';
const BIP84 = require('bip84');


export class BTCHelper {

  static validateBTCAddress = (address) => {
    try {
      if (!address || typeof address !== 'string') {
        return false;
      }
      return validate(address);
    } catch (error) {
      // console.error('BTC address validation error:', error);
      return false;
    }
  };

  static generateBitcoinAddress = async (mnemonics) => {
    var root = new BIP84.fromSeed(mnemonics, '', IS_PRODUCTION);
    var child0 = root.deriveAccount(0);
    var account0 = new BIP84.fromZPrv(child0);
    return account0.getAddress(0);
  };

  static generateBitcoinAddressTestnet = async (mnemonics) => {
    var root = new BIP84.fromSeed(mnemonics, '', !IS_PRODUCTION);
    var child0 = root.deriveAccount(0);
    var account0 = new BIP84.fromZPrv(child0);
    // console.log(
    return account0.getAddress(0);
  };

  static getMempoolBTC = async (address) => {
    const { account } = store.getState();
    try {
      const { data } = await server.get(
        // `/btc/unspent_new`,
        `mpc/fetchMempoolBalance/${address}`,
        // {
        //   address: address,
        // },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
     return data?.data.toFixed(8) || '0';

    } catch (error) {
      // console.log(error);
      return false;
    }
  };

  static getUnspent = async (address) => {
    const { account } = store.getState();
    try {
      const { data } = await server.get(
        // `/btc/unspent_new`,
        `/bitcoin/unspent/${address}`,
        // {
        //   address: address,
        // },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      // console.log('BTC FEESSSS ', data);

      return data.data || [];
    } catch (error) {
      // console.log(error);
      return false;
    }
  };

  static async getBTCGasPrice() {
    try {
      const data = await axios.get('https://api.blockchain.info/mempool/fees');
      // console.log(data);
      return data?.data?.priority || 3;
    } catch (error) {
      return false;
    }
  }

  static generateRawTransactionForCoinAndBroadcast = async (
    to,
    from,
    amount,
    coinId,
    fiatPrice,
    networkFeeInFiat,
    fiatType,
    contact,
    slug,
    chainId,
    rawTransaction,
    tx_fee,
    orderId,
    type
  ) => {
    try {
      // console.log(
      //   'TO',
      //   to,
      //   'FROM',
      //   from,
      //   'AMOUNT',
      //   amount,
      //   'SLUG',
      //   slug,
      //   'RAW',
      //   rawTransaction,
      //   'ORDERID',
      //   orderId,
      //   'TYPE',
      //   type
      // );
      const { account } = store.getState();
      // console.log('ACCOUNT : ', account);
      let payload = {
        tx_raw: rawTransaction,
        from: from,
        to: to,
        amount: amount,
        gas_price: '', //gasPriceRes.fast * Math.pow(10, 9),//gasInEth,
        tx_type: type || 'withdraw',
      };
      payload['order_id'] = orderId;
      const myResponse = await server.post(`${slug}/send`, payload, {
        headers: {
          Authorization: account.jwtToken,
        },
      });

      // console.log('RESPONSE FROM TXN REQUEST  BTC:', myResponse);

      return myResponse.data;
    } catch (error) {
      // console.log(error);
      return {
        error: true,
        message:
          error?.response?.data?.message ||
          'Something went wrong. Please try again later.',
      };
    }
  };
}
