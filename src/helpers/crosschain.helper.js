import axios from "axios";
import { SWFT_BASE_URL } from "../config/crosschain.config";
import { AdaHelper } from "./ada.helper";
import { BTCHelper } from "./btc.helper";
import { getFlooredFixed } from "./conversion.helper";
import { SolanaHelper } from "./solana.helper";
import { WalletHelper } from "./wallet.helper";
import { Web3Helper } from "./web3.helper";
import { SWIFT_ERROR } from "./constant";
import { server } from "../server";
import { store } from "..";
// import { message } from "antd";
// const [messageApi] = message.useMessage({});

export class CrossChainHelper {
  axiosInstance;
  chainId;

  constructor(chainId) {
    this.axiosInstance = axios.create({
      baseURL: SWFT_BASE_URL,
    });
    this.chainId = chainId;
  }

  getQuoteAndRoute = async (fromCoinId, toCoinId, amount) => {
    try {
      const { account } = store.getState();
      const response = await server.post(
        "/swftc/getBaseInfo",
        {
          depositCoinCode: fromCoinId,
          receiveCoinCode: toCoinId,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      const exchangeRate = response.data.data.data;
      if (exchangeRate.instantRate == 0) {
        return false;
      }

      let instantRate = exchangeRate?.instantRate;
      console.log(instantRate);
      let receiveCoinFee = exchangeRate?.receiveCoinFee;
      console.log(receiveCoinFee);

      let convertedAmount = amount * instantRate;
      console.log(convertedAmount);
      convertedAmount = (convertedAmount * 99.7) / 100;
      console.log(convertedAmount);

      convertedAmount = convertedAmount - receiveCoinFee;
      console.log(convertedAmount);

      convertedAmount = convertedAmount <= 0 ? 0 : convertedAmount;
      console.log(convertedAmount);

      console.log({
        pair: [fromCoinId, toCoinId],
        outAmount: convertedAmount,
        exchangeData: exchangeRate,
      });
      return {
        pair: [fromCoinId, toCoinId],
        outAmount: convertedAmount,
        exchangeData: exchangeRate,
      };
    } catch (error) {
      return false;
    }
  };

  sendOrder = async (
    fromCoin,
    toCoin,
    depositAmount,
    receiveAmount,
    walletAddress,
    chain,
    fee,
    fiatValue,
    parentCoin,
    rpc,
    symbol,
    sessionPassword
  ) => {
    try {
      console.log({
        depositCoinCode: fromCoin.symbol,
        receiveCoinCode: toCoin.symbol,
        depositCoinAmt: getFlooredFixed(depositAmount, 8),
        receiveCoinAmt: receiveAmount,
        destinationAddr: toCoin.address,
        refundAddr: walletAddress,
        equipmentNo: walletAddress,
        sourceType: "iOS",
        sourceFlag: "widget",
        fromCoin: fromCoin,
        chain: chain,
      });

      const { account } = store.getState();

      console.log('ACCOUNT FOUND CROSS CHAIN SEND ORDER :',account)

      const response = await server.post(
        "/swftc/accountExchange",
        {
          depositCoinCode: fromCoin.symbol,
          receiveCoinCode: toCoin.symbol,
          depositCoinAmt: getFlooredFixed(depositAmount, 8),
          receiveCoinAmt: receiveAmount,
          destinationAddr: toCoin.address,
          refundAddr: walletAddress,
          equipmentNo: "123456568",
          sourceType: "iOS",
          // source_flag: "widget",
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      console.log("RESPOSNE FROM API TO SWAP CROSS-CHAIN: ", response);
      
      const orderData = response.data.data.data;

      let hash = "";

      let coinFamily = fromCoin?.coinFamily;
      console.log("COINFAMILKY", coinFamily);
      let gasPriceType = 3;

      if (fromCoin?.coinFamily === 3) {
        let inputCount = 0;
        let transactionSize = 0;
        let outputCount = 2;
        let btcTosatoshi = 100000000;
        let btcTosatoshiMultiplier = 0.00000001;
        let rawTransaction; // Declare outside to make it accessible
        let networkFee;
        let tx_fee = parseFloat(getFlooredFixed(+networkFee, 8));

        try {
          const gasPrice = await BTCHelper.getBTCGasPrice();
          const unspent = await BTCHelper.getUnspent(walletAddress);
          if (!unspent) {
            // store.dispatch(setLoading(false));
            // return messageApi.error("Unable to fetch unspent at the moment.");
            return console.error("Unable to fetch unspent at the moment.");
          }
          if (unspent.length === 0) {
            // store.dispatch(setLoading(false));
            // return messageApi.error(
            //   "You have a pending transaction in your account or you do not have enough balance to proceed with the transaction."
            // );
            return console.error(
              "You have a pending transaction in your account or you do not have enough balance to proceed with the transaction."
            );
          }
          const inputs = [];
          let totalAmountAvailable = 0;
          unspent.forEach((element) => {
            let utxo = {};
            utxo.satoshis = Math.floor(Number(element.satoshis));
            utxo.script = element.scriptPubKey;
            utxo.address = walletAddress;
            utxo.txId = element.txid;
            utxo.outputIndex = element.vout;
            totalAmountAvailable += parseFloat(utxo.satoshis);
            inputCount += 1;
            inputs.push(utxo);
          });

          console.log("--------inputs-------> ", inputs);

          transactionSize =
            inputCount * 146 + outputCount * 34 + 10 - inputCount;
          let fee = transactionSize * gasPrice;
          const totalFee = (
            transactionSize *
            gasPrice *
            btcTosatoshiMultiplier
          ).toFixed(8);
          console.log(
            "🚀 ~ file: SwapBtc crosschain helper.jsx:591 ~ onClick={ ~ totalFee:",
            +totalFee,
            depositAmount
          );

          const totalAmount = +totalFee + depositAmount;
          console.log(
            "🚀 ~ file: SendCoins.jsx:594 ~ onClick={ ~ totalAmount:",
            totalAmount
          );

          if (totalAmount > fromCoin?.balance) {
            // store.dispatch(setLoading(false));
            // return messageApi.error(
            //   "Not enough balance to proceed with the transaction."
            // );
            return console.error(
              "Not enough balance to proceed with the transaction."
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
              Math.round(depositAmount * btcTosatoshi) -
              fee <
            0
          ) {
            // store.dispatch(setLoading(false));
            // return messageApi.error(
            //   "Insufficient Balance to proceed with the transactions."
            // );
            return console.error(
              "Insufficient Balance to proceed with the transactions."
            );
          } else {
            const bitcore = require("bitcore-lib");
            const transaction = new bitcore.Transaction();
            console.log(
              "🚀 ~ file: SendCoins.jsx:630 ~ transaction:",
              transaction
            );
            // console.log(inputs);
            transaction.from(inputs);
            console.log(
              "🚀 ~ file: SendCoins.jsx:632 ~ transaction:",
              transaction
            );

            console.log("orderDataorderDataorderData ", orderData);
            console.log("depositAmount :::: ", depositAmount);
            console.log("btcTosatoshi::::: ", btcTosatoshi);
            
            
            transaction.to(
              orderData?.platformAddr,
              parseInt(Math.round(depositAmount * btcTosatoshi).toString())
            );
            // console.log(
            //   "🚀 ~ file: SendCoins.jsx:635 ~ address:",
            //   address
            // );

            console.log(
              "🚀 ~ file: SendCoins.jsx:637 ~ transaction:",
              transaction
            );
            // console.log(
            //   "🚀 ~ file: SendCoins.jsx:636 ~ transaction:",
            //   transaction
            // );
            let satoshis = 0;
            for (var i = 0; i < inputs.length; i++) {
              satoshis = inputs[i]?.satoshis + satoshis;
            }
            if (
              satoshis -
                (fee +
                  parseInt(
                    Math.round(depositAmount * btcTosatoshi).toString()
                  )) >
              546
            ) {
              transaction.change(walletAddress);
            }
            
            if (
              satoshis -
                (fee +
                  parseInt(
                    Math.round(depositAmount * btcTosatoshi).toString()
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
                        Math.round(depositAmount * btcTosatoshi).toString()
                      )))
              );
            }

            const btcPrivateKey = await WalletHelper.getBitcoinPrivateKeyWithPassword(sessionPassword);

            console.log(
              "🚀 ~ file: SendCoins.jsx:656 ~ btcPrivateKey:",
              btcPrivateKey
            );
            if (!btcPrivateKey) {
              // store.dispatch(setLoading(false));
              return console.error(
                "Unable to fetch private key at the moment please try again later."
              );
            }
            transaction.sign(btcPrivateKey);
            networkFee = (
              transactionSize *
              gasPrice *
              btcTosatoshiMultiplier
            ).toFixed(8);
            rawTransaction = transaction.serialize(); // Assign raw transaction
            console.log('RAW TRANSACTION:',rawTransaction)
            // store.dispatch(setLoading(false));
          }
        } catch (error) {
          console.log("ERROR CROSS_CHAIN HELPER BTC", error);
          // store.dispatch(setLoading(false));
          return console.error(error.message);
        }

        hash = await BTCHelper.generateRawTransactionForCoinAndBroadcast(
          orderData.platformAddr,
          walletAddress,
          depositAmount,
          fromCoin.id,
          fiatValue,
          0,
          "USD",
          null,
          `bitcoin/${chain.slug}`, //chain.slug,
          chain.chainId,
          rawTransaction,
          tx_fee,
          orderData.orderId,
          "cross_chain"
        );
        console.log('HASH CREATED IN BTC CROSS-CHAIN SWAP :',hash)
      } else if (fromCoin?.coinFamily === 5 && fromCoin.tokenAddress) {
        const solanaHelper = new SolanaHelper(chain.rpcUrl);
        hash = await solanaHelper.generateRawTransactionForTokenAndBroadcast(
          orderData.platformAddr,
          walletAddress,
          depositAmount,
          fromCoin.id,
          fiatValue,
          0,
          "USD",
          null,
          `solana/${chain.slug}`, //chain.slug,
          chain.chainId,
          fromCoin.tokenAddress,
          Math.pow(10, fromCoin.decimals),
          "",
          orderData.orderId,
          "cross_chain",
          gasPriceType,
          sessionPassword
        );
      } else if (fromCoin?.coinFamily === 5) {
        const solanaHelper = new SolanaHelper(chain.rpcUrl);
        hash = await solanaHelper.generateRawTransactionForCoinAndBroadcast(
          orderData.platformAddr,
          walletAddress,
          depositAmount,
          fromCoin.id,
          fiatValue,
          0,
          "USD",
          null,
          `solana/${chain.slug}`,
          chain.chainId,
          orderData.orderId,
          "cross_chain",
          sessionPassword
        );
      } else if (fromCoin?.coinFamily != 5 && fromCoin.tokenAddress) {
        console.log("IN TOKEN CROSS SWAP EVM");
        hash = await Web3Helper.generateRawTransactionForTokenAndBroadcast(
          orderData.platformAddr,
          walletAddress,
          depositAmount,
          fromCoin.id,
          fiatValue,
          0,
          "USD",
          null,
          chain.slug,
          chain.chainId,
          fromCoin.tokenAddress,
          Math.pow(10, fromCoin.decimals),
          symbol,
          "cross_chain",
          coinFamily,
          gasPriceType,
          orderData.orderId,
          sessionPassword
        );
      } else {
        hash = await Web3Helper.generateRawTransactionForCoinAndBroadcast(
          orderData.platformAddr,
          walletAddress,
          depositAmount,
          fromCoin.id,
          fiatValue,
          0,
          "USD",
          null,
          chain.slug,
          chain.chainId,
          symbol,
          rpc,
          "cross_chain",
          "",
          orderData.orderId,
          sessionPassword
        );
      }

      if (!hash) {
        return false;
      }

      await this.axiosInstance.post("/v2/modifyTxId", {
        orderId: orderData.orderId,
        depositTxid: hash,
      });

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };
}
