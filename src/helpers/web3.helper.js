import { ABI, ERC_1155, ERC_721_ABI, WRAP_ABI } from "../config/abi";
import { WalletHelper } from "./wallet.helper";
import { server } from "../server";
import { store } from "..";
import Web3 from "web3";
import BigNumber from "bignumber.js";
import { ethers } from "ethers";

export class Web3Helper {
  static getGasPrice = async (
    slug,
    toAddress,
    fromAddress,
    isToken,
    tokenAddress,
    tokenValue,
    tokenType,
    amount
  ) => {
    const { account } = store.getState();
    try {
      // console.log(
      //   "get gas fees price ::: ",
      //   slug,
      //   toAddress,
      //   fromAddress,
      //   isToken,
      //   tokenAddress,
      //   tokenValue,
      //   tokenType,
      //   amount
      // );
      const { data } = await server.post(
        `/${slug}/get_fee_price`,
        {
          to_address: toAddress,
          from_address: fromAddress,
          is_token: isToken,
          token_address: isToken ? tokenAddress || undefined : undefined,
          token_type: tokenType || undefined,
          token_value:
            tokenValue !== undefined && tokenValue !== null
              ? parseFloat(tokenValue) === 0
                ? 0
                : parseFloat(tokenValue)
              : undefined,
          amount: amount || undefined,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      // console.log("FEESSSSSSSSSSSSSS : ", data);
      return {
        estimate: data.data.gas_estimate,
        price:
          typeof data.data.gas_price === "object"
            ? slug === "bnb" &&
              parseInt(data.data.gas_price.fast_gas_price) == 0
              ? 3
              : parseInt(data.data.gas_price.fast_gas_price)
            : parseInt(data.data.gas_price),
        balance: data.data.balance,
        nonce: data.data.nonce,
      };
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  static checkApproval = async (tokenAddress, owner, spender, rpc) => {
    console.log(
      "🚀 ~ Web3Helper ~ checkApproval= ~ tokenAddress, owner, spender, rpc:",
      tokenAddress,
      owner,
      spender,
      rpc
    );
    try {
      const provider = new Web3.providers.HttpProvider(rpc);
      const web3 = new Web3(provider);

      const contract = new web3.eth.Contract(ABI, tokenAddress);
      const approvedAmount = await contract.methods
        .allowance(owner, spender)
        .call();

      return approvedAmount;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  async sendForApproval(
    tokenAddress,
    walletAddress,
    spenderAddress,
    coinId,
    slug,
    rpcUrl,
    chainId
  ) {
    try {
      const web3Provider = new ethers.providers.JsonRpcProvider(rpcUrl);

      const { account } = store.getState();
      const WALLET_SECRET = await WalletHelper.getPrivateKey();
      const contract = new ethers.Contract(
        tokenAddress, // The address of the ERC20 token contract
        ABI, // Replace with the actual ABI of the ERC20 token contract
        web3Provider // The provider you're using (e.g., Infura, Alchemy, etc.)
      );

      // Unlimited allowance value (2^256 - 1)
      const unlimitedAllowance = ethers.constants.MaxUint256;

      // Generate the approve transaction
      const approveTx = await contract.populateTransaction.approve(
        spenderAddress,
        unlimitedAllowance
      );

      const gasLimitRequired = await contract.estimateGas.approve(
        spenderAddress,
        unlimitedAllowance,
        {
          from: walletAddress,
        }
      );

      const gasPrice = await Web3Helper.getGasPrice(
        slug,
        walletAddress,
        walletAddress,
        0
      );

      approveTx.gasLimit = gasLimitRequired._hex;
      approveTx.gasPrice = Web3.utils.toHex(gasPrice.price * Math.pow(10, 9));
      approveTx.from = walletAddress;
      approveTx.value = "0x0";
      approveTx.chainId = chainId;
      approveTx.nonce = gasPrice.nonce;

      // Sign the transaction with the wallet's private key
      const wallet = new ethers.Wallet(WALLET_SECRET, this.web3Provider);
      const signedTransaction = await wallet.signTransaction(approveTx);

      // Send the signed transaction to the server for approval
      const response = await server.post(
        `/${slug}/send`,
        {
          address_book_name: "",
          amount: 0, // Set to 0 for an approve transaction
          coin_id: coinId, // Set to the appropriate coin ID
          fiat_price: 0,
          fiat_type: "usd", // Set to the appropriate fiat type
          from_address: walletAddress,
          gas_estimate: parseFloat(gasLimitRequired.toString()),
          gas_price: gasPrice.price,
          source_type: "ANDROID",
          to_address: tokenAddress, // The ERC20 token contract address (to_address should be the token address for an approval transaction)
          trnx_raw: signedTransaction.split("0x")[1],
          trnx_type: "approval",
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      return response.data.tx_hash;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  static async fetchGasEstimateForWrap(
    tokenAddress,
    walletAddress,
    rpcUrl,
    functionToCall,
    amount
  ) {
    try {
      const web3Provider = new ethers.providers.JsonRpcProvider(rpcUrl);

      const contract = new ethers.Contract(
        tokenAddress, // The address of the ERC20 token contract
        WRAP_ABI, // Replace with the actual ABI of the ERC20 token contract
        web3Provider // The provider you're using (e.g., Infura, Alchemy, etc.)
      );

      let gasLimitRequired;
      if (functionToCall === "deposit") {
        // Use the provided function name dynamically
        gasLimitRequired = await contract.estimateGas[functionToCall]({
          from: walletAddress,
        });
      } else {
        // Use the provided function name dynamically
        gasLimitRequired = await contract.estimateGas[functionToCall](
          Web3.utils.toHex(amount.toNumber()),
          {
            from: walletAddress,
          }
        );
      }

      return gasLimitRequired.toNumber();
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  getTransactionStatusThroughHash = async (hash, rpc) => {
    try {
      const web3Provider = new ethers.providers.JsonRpcProvider(rpc);
      const data = await web3Provider.getTransactionReceipt(hash);
      return data.status;
    } catch (error) {
      return false;
    }
  };

  static getTokenBalance = async (tokenAddress, owner, rpc) => {
    try {
      const provider = new Web3.providers.HttpProvider(rpc);
      const web3 = new Web3(provider);

      const contract = new web3.eth.Contract(ABI, tokenAddress);
      const balance = await contract.methods.balanceOf(owner).call();
      const decimals = await contract.methods.decimals().call();

      const originalNumber = balance;
      const bigNumber = new BigNumber(originalNumber);
      const inputAmount = bigNumber
        .dividedBy(new BigNumber(10).pow(decimals))
        .toString();

      return inputAmount;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  static getCoinBalance = async (owner, rpc) => {
    try {
      const provider = new Web3.providers.HttpProvider(rpc);
      const web3 = new Web3(provider);

      const balance = await web3.eth.getBalance(owner);

      const originalNumber = balance;
      const bigNumber = new BigNumber(originalNumber);
      const inputAmount = bigNumber
        .dividedBy(new BigNumber(10).pow(18))
        .toString();

      return inputAmount;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

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
    orderId,
    type
  ) => {
    try {
      const { account } = store.getState();
      const web3 = new Web3();

      const privateKey = await WalletHelper.getPrivateKey();
      if (!privateKey) {
        return false;
      }
      const gasPriceRes = await this.getGasPrice(slug, to, from, 0);

      const nonce = gasPriceRes.nonce;
      const gaslimit = gasPriceRes.estimate;
      const balance = gasPriceRes.balance;
      const gasInEth =
        (gasPriceRes.price * Math.pow(10, 9) * gaslimit) / Math.pow(10, 18);
      const totalAmount = +gasInEth + +amount;

      console.log(
        "🚀 ~ file: web3.helper.js:131 ~ Web3Helper ~ balance:",
        balance
      );
      console.log(
        "🚀 ~ file: web3.helper.js:131 ~ Web3Helper ~ totalAmount:",
        totalAmount
      );

      if (totalAmount > balance) {
        return false;
      }

      console.log(
        Math.round(+amount * 10 ** 18).toLocaleString("fullwide", {
          useGrouping: false,
        })
      );

      const transaction = {
        nonce,
        gasPrice: web3.utils.toHex(gasPriceRes.price * Math.pow(10, 9)),
        gasLimit: web3.utils.toHex(gaslimit),
        to: to,
        value: web3.utils.toHex(
          Math.round(+amount * 10 ** 18).toLocaleString("fullwide", {
            useGrouping: false,
          })
        ),
        from: from,
        data: "",
        chainId,
      };

      const signedTransaction = await web3.eth.accounts.signTransaction(
        transaction,
        privateKey
      );

      const myResponse = await server.post(
        `${slug}/send`,
        {
          address_book_name: contact || "",
          amount: parseFloat(amount),
          coin_id: coinId,
          fiat_price: fiatPrice.toString(),
          fiat_type: fiatType,
          from_address: from,
          gas_estimate: gasPriceRes.estimate,
          gas_price: gasPriceRes.price,
          source_type: "ANDROID",
          to_address: to,
          trnx_raw: signedTransaction.rawTransaction.split("0x")[1],
          trnx_type: type || "withdraw",
          order_id: orderId || undefined,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      return myResponse.data.tx_hash;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  static generateOnlyRawTransaction = async (
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
    orderId,
    type
  ) => {
    try {
      const { account } = store.getState();
      const web3 = new Web3();

      const privateKey = await WalletHelper.getPrivateKey();
      if (!privateKey) {
        return false;
      }
      const gasPriceRes = await this.getGasPrice(slug, to, from, 0);

      const nonce = gasPriceRes.nonce;
      const gaslimit = gasPriceRes.estimate || 30000;
      const balance = gasPriceRes.balance;
      const gasInEth =
        (gasPriceRes.price * Math.pow(10, 9) * gaslimit) / Math.pow(10, 18);
      const totalAmount = +gasInEth + +amount;

      if (totalAmount > balance) {
        return false;
      }

      const transaction = {
        nonce,
        gasPrice: web3.utils.toHex(gasPriceRes.price * Math.pow(10, 9)),
        gasLimit: web3.utils.toHex(gaslimit * 2),
        to: to,
        value: web3.utils.toHex(
          Math.round(+amount * 10 ** 18).toLocaleString("fullwide", {
            useGrouping: false,
          })
        ),
        from: from,
        data: "",
        chainId,
      };

      const signedTransaction = await web3.eth.accounts.signTransaction(
        transaction,
        privateKey
      );

      return signedTransaction.rawTransaction.split("0x")[1];
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  static generateRawTransactionForTokenAndBroadcast = async (
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
    tokenAddress,
    decimals,
    tokenType,
    orderId,
    type
  ) => {
    try {
      // console.log(
      //   "transaction payload in AdaHelper",
      //   to,
      //   from,
      //   amount,
      //   coinId,
      //   fiatPrice,
      //   networkFeeInFiat,
      //   fiatType,
      //   contact,
      //   slug,
      //   chainId,
      //   tokenAddress,
      //   decimals,
      //   tokenType,
      //   orderId
      // );

      const { account } = store.getState();

      const web3 = new Web3();
      const contract = new web3.eth.Contract(ABI);

      const privateKey = await WalletHelper.getPrivateKey();
      if (!privateKey) {
        return false;
      }

      const gasPriceRes = await this.getGasPrice(
        slug,
        to,
        from,
        1,
        tokenAddress,
        amount,
        tokenType
      );

      const gasPrice = gasPriceRes.price * Math.pow(10, 9);
      const nonce = gasPriceRes.nonce;
      const gaslimit = gasPriceRes.estimate;
      // console.log(
      //   "amount and decimal in we3 helper ",
      //   new BigNumber(amount).multipliedBy(new BigNumber(decimals)).toFixed(0)
      // );
      const transaction = {
        nonce,
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: web3.utils.toHex(gaslimit),
        to: tokenAddress,
        value: "0x0",
        from: from,
        data: contract.methods
          .transfer(
            to,
            new BigNumber(amount)
              .multipliedBy(new BigNumber(decimals))
              .toFixed(0)
          )
          .encodeABI(),
        chainId,
      };

      const signedTransaction = await web3.eth.accounts.signTransaction(
        transaction,
        privateKey
      );

      const myResponse = await server.post(
        `${slug}/send`,
        {
          address_book_name: contact || "",
          amount: parseFloat(amount),
          coin_id: coinId,
          fiat_price: fiatPrice.toString(),
          fiat_type: fiatType,
          from_address: from,
          gas_estimate: gasPriceRes.estimate,
          gas_price: gasPriceRes.price,
          source_type: "ANDROID",
          to_address: to,
          trnx_raw: signedTransaction.rawTransaction.split("0x")[1],
          trnx_type: type || "withdraw",
          order_id: orderId || undefined,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      return myResponse.data.tx_hash;
    } catch (error) {
      console.log(
        "web3 helper error generateRawTransaction For TokenAndBroadcast ",
        error
      );
      return false;
    }
  };

  static generateRawTransactionForTokenAndBroadcastExternal = async (
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
    tokenAddress,
    decimals,
    tokenType,
    data,
    gasLimit,
    coinFamily,
    value
  ) => {
    try {
      // console.log("PPPPPPPPPPPPPGGGGGGGGGG", {
      //   to,
      //   from,
      //   amount,
      //   coinId,
      //   fiatPrice,
      //   networkFeeInFiat,
      //   fiatType,
      //   contact,
      //   slug,
      //   chainId,
      //   tokenAddress,
      //   decimals,
      //   tokenType,
      //   data,
      //   gasLimit,
      //   coinFamily,
      // });
      const { account } = store.getState();
      console.log(
        "🚀 ~ file: web3.helper.js:271 ~ Web3Helper ~ account:",
        account
      );

      const web3 = new Web3();

      const privateKey = await WalletHelper.getPrivateKey();
      console.log(
        "🚀 ~ file: web3.helper.js:276 ~ Web3Helper ~ privateKey:",
        privateKey
      );
      if (!privateKey) {
        return false;
      }

      const gasPriceRes = await this.getGasPrice(slug, to, from, 1);
      console.log(
        "🚀 ~ file: web3.helper.js:290 ~ Web3Helper ~ gasPriceRes:",
        gasPriceRes
      );

      const gasPrice = gasPriceRes.price * Math.pow(10, 9);
      const nonce = gasPriceRes.nonce;
      const gaslimit = (gasLimit * 2).toFixed(0);

      const transaction = {
        nonce,
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: web3.utils.toHex(gaslimit),
        to: tokenAddress,
        value: value,
        from: from,
        data: data,
        chainId,
      };
      console.log(
        "🚀 ~ file: web3.helper.js:333 ~ Web3Helper ~ transaction:",
        transaction
      );

      const signedTransaction = await web3.eth.accounts.signTransaction(
        transaction,
        privateKey
      );
      console.log(
        "🚀 ~ file: web3.helper.js:339 ~ Web3Helper ~ signedTransaction:",
        signedTransaction
      );

      const myResponse = await server.post(
        `${slug}/send`,
        {
          address_book_name: "",
          amount: parseFloat(amount / Math.pow(10, 18)),
          coin_id: coinFamily,
          fiat_price: fiatPrice.toString(),
          fiat_type: fiatType,
          from_address: from,
          gas_estimate: gasLimit,
          gas_price: gasPriceRes.price,
          source_type: "ANDROID",
          to_address: to,
          trnx_raw: signedTransaction.rawTransaction.split("0x")[1],
          trnx_type: "smart_contract",
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      return myResponse.data.tx_hash;
    } catch (error) {
      return false;
    }
  };

  static generateRawTransactionForNFTAndBroadcast = async (
    to,
    from,
    amount,
    coinId,
    fiatPrice,
    fiatType,
    contact,
    slug,
    chainId,
    tokenAddress,
    tokenType,
    orderId,
    type,
    tokenId
  ) => {
    try {
      const { account } = store.getState();

      const web3 = new Web3();
      const contract = new web3.eth.Contract(ERC_721_ABI);

      const privateKey = await WalletHelper.getPrivateKey();
      console.log(
        "🚀 ~ file: web3.helper.js:528 ~ Web3Helper ~ privateKey:",
        privateKey
      );
      if (!privateKey) {
        return false;
      }

      const gasPriceRes = await this.getGasPrice(
        slug,
        to,
        from,
        1,
        tokenAddress,
        tokenId,
        tokenType
      );

      // console.log(from, to, tokenId);

      const gasPrice = gasPriceRes.price * Math.pow(10, 9);
      const nonce = gasPriceRes.nonce;
      const gaslimit = gasPriceRes.estimate;

      const transaction = {
        nonce,
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: web3.utils.toHex(gaslimit),
        to: tokenAddress,
        value: "0x0",
        from: from,
        data: contract.methods.transferFrom(from, to, tokenId).encodeABI(),
        chainId,
      };

      console.log(
        "🚀 ~ file: web3.helper.js:557 ~ Web3Helper ~ transaction:",
        transaction
      );

      const signedTransaction = await web3.eth.accounts.signTransaction(
        transaction,
        privateKey
      );
      console.log(
        "🚀 ~ file: web3.helper.js:573 ~ Web3Helper ~ signedTransaction:",
        signedTransaction
      );

      const myResponse = await server.post(
        `${slug}/send`,
        {
          address_book_name: contact || "",
          amount: parseFloat(amount),
          coin_id: coinId,
          fiat_price: fiatPrice.toString(),
          fiat_type: fiatType,
          from_address: from,
          gas_estimate: gasPriceRes.estimate,
          gas_price: gasPriceRes.price,
          source_type: "ANDROID",
          to_address: to,
          trnx_raw: signedTransaction.rawTransaction.split("0x")[1],
          trnx_type: type || "withdraw",
          order_id: orderId || undefined,
          token_id: tokenId,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      return myResponse.data.tx_hash;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  static generateRawTransactionFor1155AndBroadcast = async (
    to,
    from,
    amount,
    coinId,
    fiatPrice,
    fiatType,
    contact,
    slug,
    chainId,
    tokenAddress,
    tokenType,
    orderId,
    type,
    tokenId
  ) => {
    try {
      const { account } = store.getState();

      const web3 = new Web3();
      const contract = new web3.eth.Contract(ERC_1155);

      const privateKey = await WalletHelper.getPrivateKey();
      if (!privateKey) {
        return false;
      }

      const gasPriceRes = await this.getGasPrice(
        slug,
        to,
        from,
        1,
        tokenAddress,
        tokenId,
        tokenType,
        amount
      );

      const gasPrice = gasPriceRes.price * Math.pow(10, 9);
      const nonce = gasPriceRes.nonce;
      const gaslimit = gasPriceRes.estimate;

      const data = contract.methods
        .safeTransferFrom(from, to, tokenId, amount, [])
        .encodeABI();

      const transaction = {
        nonce,
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: web3.utils.toHex(gaslimit),
        to: tokenAddress,
        value: "0x0",
        from: from,
        data,
        chainId,
      };

      const signedTransaction = await web3.eth.accounts.signTransaction(
        transaction,
        privateKey
      );

      const myResponse = await server.post(
        `${slug}/send`,
        {
          address_book_name: contact || "",
          amount: parseFloat(amount),
          coin_id: coinId,
          fiat_price: fiatPrice.toString(),
          fiat_type: fiatType,
          from_address: from,
          gas_estimate: gasPriceRes.estimate,
          gas_price: gasPriceRes.price,
          source_type: "ANDROID",
          to_address: to,
          trnx_raw: signedTransaction.rawTransaction.split("0x")[1],
          trnx_type: type || "withdraw",
          order_id: orderId || undefined,
          token_id: tokenId,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      return myResponse.data.tx_hash;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  static generateRawTransactionForSpritzAndBroadcast = async (
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
    tokenAddress,
    decimals,
    tokenType,
    orderId,
    type,
    data,
    paymentRequest,
    isToken
  ) => {
    try {
      const { account } = store.getState();

      const web3 = new Web3();

      const privateKey = await WalletHelper.getPrivateKey();
      if (!privateKey) {
        return false;
      }

      const gasPriceRes = await this.getGasPrice(slug, from, from, 0);

      const gasPrice = gasPriceRes.price * Math.pow(10, 9);
      const nonce = gasPriceRes.nonce;
      const gaslimit = paymentRequest.gasLimit;

      const transaction = {
        nonce,
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: web3.utils.toHex(gaslimit * 2),
        to: to,
        value: !isToken ? web3.utils.toHex(paymentRequest.amount) : "0x0",
        from: from,
        data,
        chainId,
      };

      const signedTransaction = await web3.eth.accounts.signTransaction(
        transaction,
        privateKey
      );

      const myResponse = await server.post(
        `${slug}/send`,
        {
          address_book_name: contact || "",
          amount: amount.toNumber(),
          coin_id: coinId,
          fiat_price: fiatPrice.toString(),
          fiat_type: fiatType,
          from_address: from,
          gas_estimate: gasPriceRes.estimate,
          gas_price: gasPriceRes.price,
          source_type: "ANDROID",
          to_address: to,
          trnx_raw: signedTransaction.rawTransaction.split("0x")[1],
          trnx_type: type || "withdraw",
          order_id: orderId || undefined,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      return myResponse.data.tx_hash;

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };
}
