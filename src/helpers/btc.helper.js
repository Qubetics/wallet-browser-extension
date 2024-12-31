import axios from "axios";
import { store } from "..";
import { IS_PRODUCTION } from "../config/bitcoin.config";
import { server } from "../server";
import { WalletHelper } from "./wallet.helper";

const BIP84 = require("bip84");

let inputCount = 0;
let transactionSize = 0;
let outputCount = 2;
let btcTosatoshi = 100000000;
let btcTosatoshiMultiplier = 0.00000001;

export class BTCHelper {
  static generateBitcoinAddress = async (mnemonics) => {
    var root = new BIP84.fromSeed(mnemonics, "", !IS_PRODUCTION);
    var child0 = root.deriveAccount(0);
    var account0 = new BIP84.fromZPrv(child0);
    return account0.getAddress(0);
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
      console.log("BTC FEESSSS ", data);
      
      return data.data || [];
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  static async getBTCGasPrice() {
    try {
      const data = await axios.get("https://api.blockchain.info/mempool/fees");
      console.log(data);
      return data.data.priority || 3;
    } catch (error) {
      return false;
    }
  }

  static async generateRawTransaction(fromAddress, toAddress, amount) {
    const unspent = await this.getUnspent(fromAddress);
    const gasPrice = await this.getBTCGasPrice();
    if (!unspent) {
      return {
        message: "Unable to fetch unspent at the moment.",
      };
    }

    if (unspent.length === 0) {
      return {
        message:
          "You have a pending transaction in your account or you do not have enough balance to proceed with the transaction.",
      };
    }

    const inputs = [];
    let totalAmountAvailable = 0;

    unspent.forEach((element) => {
      let utxo = {};
      utxo.satoshis = Math.floor(Number(element.value));
      utxo.script = element.script;
      utxo.address = fromAddress;
      utxo.txId = element.tx_hash;
      utxo.outputIndex = element.tx_output_n;
      totalAmountAvailable += parseFloat(utxo.satoshis);
      inputCount += 1;
      inputs.push(utxo);
    });

    transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
    let fee = transactionSize * gasPrice;
    const totalFee = (
      transactionSize *
      gasPrice *
      btcTosatoshiMultiplier
    ).toFixed(8);

    const totalAmount = +totalFee + parseFloat(amount);
    const balance = await this.getCoinBalance(fromAddress);
    if (+totalAmount > +balance) {
      return {
        message: "Not enough balance to proceed with the transaction.",
      };
    }

    if (totalAmountAvailable - Math.round(amount * btcTosatoshi) - fee < 0) {
      return {
        message: "Insufficient Balance to proceed with the transactions.",
      };
    } else {
      const bitcore = require("bitcore-lib");

      const transaction = new bitcore.Transaction();
      transaction.from(inputs);
      transaction.to(
        "",
        parseInt(Math.round(amount * btcTosatoshi).toString())
      );
      let satoshis = 0;
      for (var i = 0; i < inputs.length; i++) {
        satoshis = inputs[i].satoshis + satoshis;
      }
      if (
        satoshis -
        (fee + parseInt(Math.round(amount * btcTosatoshi).toString())) >
        546
      ) {
        transaction.change(fromAddress);
      }
      if (
        satoshis -
        (fee + parseInt(Math.round(amount * btcTosatoshi).toString())) >
        546
      ) {
        transaction.fee(fee);
      } else {
        transaction.fee(
          fee +
          (satoshis -
            (fee + parseInt(Math.round(amount * btcTosatoshi).toString())))
        );
      }

      const btcPrivateKey = await WalletHelper.getBitcoinPrivateKey();

      if (!btcPrivateKey) {
        return {
          message:
            "Unable to fetch private key at the moment please try again later.",
        };
      }

      transaction.sign(btcPrivateKey);
      const rawTransaction = transaction.serialize();
      return rawTransaction;
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
    type,
     
  ) => {
    try { 
      
      const { account } = store.getState();

      const myResponse = await server.post(
        `${slug}/send`,
        {
          tx_raw: rawTransaction,
          from: from,
          to: to,
          amount: amount,
          gas_price: '',//gasPriceRes.fast * Math.pow(10, 9),//gasInEth,
          tx_type: type || 'withdraw',

          // address_book_name: contact || "",
          // amount: parseFloat(amount),
          // coin_id: coinId,
          // fiat_price: fiatPrice.toString(),
          // fiat_type: fiatType,
          // from_address: from,
          // source_type: "ANDROID",
          // tx_fee,
          // to_address: to,
          // trnx_type: type || "withdraw",
          // trnx_raw: rawTransaction,
          // order_id: orderId || undefined,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      return myResponse.data;
    } catch (error) {
      console.log(error);
      return false;
    }
  };
}
