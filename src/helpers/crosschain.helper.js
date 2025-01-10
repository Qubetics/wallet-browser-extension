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
    symbol
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
      });

      const { account } = store.getState();

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

      const orderData = response.data.data.data;

      let hash = "";

      let coinFamily = fromCoin?.coinFamily;
      let gasPriceType = 3;

      if (fromCoin.tokenAddress) {
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
          orderData.orderId
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
          '',
          orderData.orderId
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
