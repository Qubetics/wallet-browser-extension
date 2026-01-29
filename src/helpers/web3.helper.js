import { ABI, ERC_1155, ERC_721_ABI, WRAP_ABI } from '../config/abi';
import { WalletHelper } from './wallet.helper';
import { server } from '../server';
import { store } from '..';
import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { rpc_chain } from './constant';

export class Web3Helper {
  /**
   * Validates an Ethereum address
   * @param {string} address - The Ethereum address to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  static validateETHAddress = (address) => {
    try {
      if (!address || typeof address !== 'string') {
        return false;
      }
      return ethers.utils.isAddress(address);
    } catch (error) {
      // console.error('ETH address validation error:', error);
      return false;
    }
  };

  static gaspriceNft = async ({ slug, to, from, token_value, amount }) => {
    const { account } = store.getState();
    try {
      const { data } = await server.post(
        `/${slug}/${token_value}/gas_estimation`,
        {
          to,
          from,
          token_value,
          amount,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      return {
        estimate: data.gas_estimate,
        fast: data.resultList.fast_gas_price,
        propose: data.resultList.propose_gas_price,
        safe: data.resultList.safe_gas_price,
      };
    } catch (error) {
      return false;
    }
  };

  static getGasPriceNft = async (
    slug,
    toAddress,
    fromAddress,
    tokenAddress,
    token_value,
    token_type,
    amount
  ) => {
    const { account } = store.getState();
    try {
      slug = slug == 'tics' ? 'qubetics' : slug;
      const { data } = await server.post(
        `/${slug}/${tokenAddress}/gas_estimation`,
        {
          from: fromAddress,
          to: toAddress,
          amount,
          token_value,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      return {
        estimate: data.gas_estimate,
        fast: data.gas_price,
        propose: data.gas_price,
        safe: data.gas_price,
        // fast: data.resultList.fast_gas_price,
        // propose: data.resultList.propose_gas_price,
        // safe: data.resultList.safe_gas_price,
      };
    } catch (error) {
      return false;
    }
  };

  static getGasPrice = async (
    slug,
    toAddress,
    fromAddress,
    isToken,
    tokenAddress,
    symbol
  ) => {
    const { account } = store.getState();
    // console.log('slug', slug);
    // console.log('toAddress', toAddress);
    // console.log('fromAddress', fromAddress);
    // console.log('isToken', isToken);
    // console.log('tokenAddress', tokenAddress);
    // console.log('symbol', symbol);
    try {
      slug = slug == 'matic' ? 'polygon' : slug == 'tics' ? 'qubetics' : slug;
      if (slug == 'qubetics') {
        symbol = 'tics';
      }
      const { data } = await server.post(
        `/${slug}/${isToken ? tokenAddress : symbol}/gas_estimation`,
        {
          from: fromAddress,
          to: fromAddress,
          amount: '',
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      if (slug == 'qubetics') {
        return {
          estimate: data.gas_estimate,
          fast: data.gas_price,
          propose: data.gas_price,
          safe: data.gas_price,
        };
      } else {
        return {
          estimate: data.gas_estimate,
          fast: data.resultList.fast_gas_price,
          propose: data.resultList.propose_gas_price,
          safe: data.resultList.safe_gas_price,
        };
      }
    } catch (error) {
      return false;
    }
  };

  static getNonce = async (slug, isToken, tokenAddress, symbol, address) => {
    const { account } = store.getState();
    try {
      slug = slug == 'matic' ? 'polygon' : slug == 'tics' ? 'qubetics' : slug;
      const { data } = await server.post(
        `/${slug}/${isToken ? tokenAddress : symbol}/nonce`,
        {
          amount: '',
          wallet_address: address,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      return data.data.nonce;
    } catch (error) {
      return false;
    }
  };

  static checkApproval = async (tokenAddress, owner, spender, rpc) => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpc);
      const contract = new ethers.Contract(tokenAddress, ABI, provider);
      const approvedAmount = await contract.allowance(owner, spender);
      // console.log('approvedAmount', approvedAmount);
      return approvedAmount;
    } catch (error) {
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
    chainId,
    sessionPassword
  ) {
    try {
      const web3Provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const { account } = store.getState();
      const { privateKey } = await WalletHelper.getPrivateKeyEvm(
        sessionPassword
      );
      const contract = new ethers.Contract(tokenAddress, ABI, web3Provider);
      const unlimitedAllowance = ethers.constants.MaxUint256;
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
      approveTx.gasPrice = ethers.utils.parseUnits(
        Math.max(gasPrice.propose, 1).toString(),
        'gwei'
      );
      approveTx.from = walletAddress;
      approveTx.value = '0x0';
      approveTx.chainId = chainId;
      approveTx.nonce = gasPrice.nonce;

      const wallet = new ethers.Wallet(privateKey, this.web3Provider);
      const signedTransaction = await wallet.signTransaction(approveTx);

      const response = await server.post(
        `/${slug}/send`,
        {
          address_book_name: '',
          amount: 0,
          coin_id: coinId,
          fiat_price: 0,
          fiat_type: 'usd',
          from_address: walletAddress,
          gas_estimate: parseFloat(gasLimitRequired.toString()),
          gas_price: ethers.utils
            .parseUnits(Math.max(gasPrice?.propose || 1, 1).toString(), 'gwei')
            .toString(),
          source_type: 'ANDROID',
          to_address: tokenAddress,
          trnx_raw: signedTransaction.split('0x')[1],
          trnx_type: 'approval',
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      return response.data.tx_hash;
    } catch (error) {
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
        tokenAddress,
        WRAP_ABI,
        web3Provider
      );

      let gasLimitRequired;
      if (functionToCall === 'deposit') {
        gasLimitRequired = await contract.estimateGas[functionToCall]({
          from: walletAddress,
        });
      } else {
        gasLimitRequired = await contract.estimateGas[functionToCall](
          Web3.utils.toHex(amount.toNumber()),
          {
            from: walletAddress,
          }
        );
      }

      return gasLimitRequired.toNumber();
    } catch (error) {
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
      // console.log(
      //   '🚀 ~ Web3Helper ~ getTokenBalance= ~ inputAmount:',
      //   inputAmount
      // );

      return inputAmount;
    } catch (error) {
      return false;
    }
  };

  static getCoinBalance = async (owner, rpc) => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpc);
      const balance = await provider.getBalance(owner);
      const balanceInEth = ethers.utils.formatUnits(balance, 18);
      return new BigNumber(balanceInEth);
    } catch (error) {
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
    symbol,
    rpc,
    type,
    gasPriceType,
    orderId,
    sessionPassword
  ) => {
    // console.log('RAW TRANSACTION COIN CASE :', {
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
    //   symbol,
    //   rpc,
    //   type,
    //   gasPriceType,
    //   orderId,
    //   sessionPassword,
    // });

    try {
      const { account } = store.getState();
      const { privateKey } = await WalletHelper.getPrivateKeyWithPassword(
        account,
        sessionPassword
      );
      
      if (!privateKey) {
        // console.log('INVALID PRIVATE KEY :');
        return false;
      }

      const gasPriceRes = await this.getGasPrice(
        slug,
        to,
        from,
        false,
        null,
        symbol
      );
      const nonce = await this.getNonce(slug, false, null, symbol, from);
      // console.log('gasPriceRes.estimate', gasPriceRes.estimate);

      const gaslimit = Number(gasPriceRes.estimate) + 10000;

      const gsFee =
        gasPriceType == 1
          ? gasPriceRes.safe
          : gasPriceType == 2
          ? gasPriceRes.propose
          : gasPriceRes.fast;

      const gasInEth = (gsFee * Math.pow(10, 9) * gaslimit) / Math.pow(10, 18);
      // console.log('🚀 ~ Web3Helper ~ gasInEth:', gasInEth);
      const gasPrice =
        symbol == 'eth'
          ? Math.max(1.5 * gsFee * Math.pow(10, 9), 1e9)
          : Math.max(gsFee * Math.pow(10, 9), 1e9);

      const totalAmount = +gasInEth + +amount;
      console.log('🚀 ~ Web3Helper ~ totalAmount:', totalAmount);

      const balance = await this.getCoinBalance(from, rpc);
      console.log('🚀 ~ Web3Helper ~ balance:', balance);

      if (totalAmount > balance) {
        return false;
      }

      const ethersProvider = new ethers.providers.JsonRpcProvider(rpc);
      const wallet = new ethers.Wallet(privateKey, ethersProvider);

      const value = ethers.utils.parseUnits(amount.toString(), 18);

      const tx = {
        nonce: nonce,
        gasLimit: ethers.BigNumber.from(gaslimit),
        gasPrice: ethers.BigNumber.from(Math.floor(gasPrice)),
        to: to,
        value: value,
        data: '0x',
        chainId: Number(chainId),
      };

      // console.log('TRANSACTION OBJECT : ', tx);

      const signedTransaction = await wallet.signTransaction(tx);

      // console.log('signedTransaction', signedTransaction);

      const gasPriceInWei = Math.max(gsFee, 1) * 1e9;
      const stringWithout0x = signedTransaction.startsWith('0x')
        ? signedTransaction.slice(2)
        : signedTransaction;

      // console.log('gaslimit', gaslimit);

      let payload = {
        nonce: nonce,
        tx_raw: stringWithout0x,
        from: from,
        to: to,
        amount: amount,
        gas_estimate: gaslimit,
        gas_price: gasPriceInWei,
        tx_type: type || 'withdraw',
      };

      payload['order_id'] = orderId;
      slug = slug == 'matic' ? 'polygon' : slug == 'tics' ? 'qubetics' : slug;

      const response = await server.post(`${slug}/${symbol}/send`, payload, {
        headers: {
          Authorization: account.jwtToken,
        },
      });
      // console.log('🚀 ~ Web3Helper ~ response:', response);
      return response.data.tx_hash;
    } catch (error) {
      // console.log('error occure----> ', error);
      return false;
    }
  };

  static web3s = new Web3(process.env.REACT_APP_ETH_RPC);

  static getPriorityFee = async (web3) => {
    const feeHistory = await web3.eth.getFeeHistory(1, 'latest', [10]);

    const priorityFee = feeHistory.reward[0][0];

    return web3.utils.toHex(priorityFee);
  };

  static getGasEstimation = async ({ from, to, data, coinFamily }) => {
    const web3s = new Web3(
      coinFamily == 1
        ? process.env.REACT_APP_BNB_RPC
        : coinFamily == 2
        ? process.env.REACT_APP_ETH_RPC
        : coinFamily == 4
        ? process.env.REACT_APP_MATIC_RPC
        : process.env.REACT_APP_QUBETIC_RPC
    );

    const transaction = {
      from: from,
      to: to,
      value: web3s.utils.toWei('0', 'ether'),
      data: web3s.utils.toHex(data),
    };
    // console.log('transaction  gas estimation',transaction);
    return await web3s.eth
      .estimateGas(transaction)
      .then((gasEstimate) => {
        return gasEstimate * 3;
      })
      .catch((error) => {
        // console.error('Error estimating gas:', error);
        return 21000 * 3;
      });
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
    symbol,
    type,
    coinFamily,
    gasPriceType,
    orderId,
    sessionPassword
  ) => {
    // console.log('RAW TXN FOR TOKEN:', {
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
    //   symbol,
    //   type,
    //   coinFamily,
    //   gasPriceType,
    //   orderId,
    // });
    try {
      const { account } = store.getState();
      // console.log(' rpc_chain(coinFamily)', rpc_chain(coinFamily),coinFamily);
      
      const provider = new ethers.providers.JsonRpcProvider(
        rpc_chain(coinFamily)
      );
      // console.log('provider',provider);
      
      const contract = new ethers.Contract(tokenAddress, ABI, provider);
      const { privateKey } = await WalletHelper.getPrivateKeyEvm(sessionPassword);

      if (!privateKey) {
        // console.log('INVALID PRIVATE KEY');
        return false;
      }

      const gasPriceRes = await this.getGasPrice(
        slug,
        to,
        from,
        1,
        tokenAddress,
        symbol
      );

      // console.log('gasPriceRes',gasPriceRes);
      

      const nonce = await this.getNonce(slug, true, tokenAddress, symbol, from);

      // console.log('nonce',nonce);
      
      const data = contract.interface.encodeFunctionData('transfer', [
        to,
        new BigNumber(amount).multipliedBy(new BigNumber(decimals)).toFixed(0),
      ]);

      // console.log('data',data);
      

      const gsFee =
        gasPriceType == 1
          ? gasPriceRes.safe
          : gasPriceType == 2
          ? gasPriceRes.propose
          : gasPriceRes.fast;

      const gasPrice =
        '0xA07c5b74C9B40447a954e1466938b865b6BBea36' === tokenAddress
          ? Math.max(3 * gsFee * Math.pow(10, 9), 1e9)
          : Math.max(gsFee * 1.5 * Math.pow(10, 9), 1e9);

      const gaslimit = await this.getGasEstimation({
        from,
        to,
        data,
        coinFamily,
      });

      const transaction = {
        nonce: nonce,
        gasPrice: ethers.utils.hexlify(Math.floor(gasPrice)),
        gasLimit: ethers.utils.hexlify(
          '0xA07c5b74C9B40447a954e1466938b865b6BBea36' === tokenAddress
            ? Math.floor(gaslimit * 3)
            : Math.floor(gaslimit * 1.5)
        ),
        to: tokenAddress,
        value: '0x0',
        from: from,
        data: data,
        chainId: Number(chainId),
      };

      // console.log('transaction',transaction);
      

      const wallet = new ethers.Wallet(privateKey, provider);
      // console.log('wallet',wallet);
      
      const signedTransaction = await wallet.signTransaction(transaction);

      // console.log('signedTransaction',signedTransaction);
      
      const gasPriceInWei = ethers.utils.parseUnits(
        gasPriceRes.fast.toString(),
        'gwei'
      );
      const trx = signedTransaction;
      const stringWithout0x = trx.startsWith('0x') ? trx.slice(2) : trx;

      let payload = {
        nonce: nonce,
        tx_raw: stringWithout0x,
        from: from,
        to: to,
        amount: amount,
        gas_estimate: Math.floor(gaslimit),
        gas_price: Math.floor(gasPriceInWei),
        tx_type: type || 'withdraw',
      };

      if (orderId) {
        payload['order_id'] = orderId;
      }
      slug = slug == 'matic' ? 'polygon' : slug === 'tics' ? 'qubetics' : slug;
      const response = await server.post(
        `${slug}/${tokenAddress}/send`,
        payload,
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      return response.data.tx_hash;
    } catch (error) {
      // console.log(
      //   'ethers helper error generateRawTransaction For TokenAndBroadcast ',
      //   error
      // );
      return false;
    }
  };

  static generateRawTransactionForTokenAndBroadcastExternalCopy = async (
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
    value,
    symbol,
    sessionPassword
  ) => {
    try {
      slug = slug == 'matic' ? 'polygon' : slug;
      // console.log(
      //   'web3helper ~ SWAP PANCAKE ~ 1374 ~ row transaction for swap ',
      //   {
      //     to,
      //     from,
      //     amount,
      //     coinId,
      //     fiatPrice,
      //     networkFeeInFiat,
      //     fiatType,
      //     contact,
      //     slug,
      //     chainId,
      //     tokenAddress,
      //     decimals,
      //     tokenType,
      //     data,
      //     gasLimit,
      //     coinFamily,
      //     symbol,
      //     sessionPassword,
      //   }
      // );
      const { account } = store.getState();
      const rpc =
        coinFamily == 1
          ? process.env.REACT_APP_BNB_RPC
          : coinFamily == 2
          ? process.env.REACT_APP_ETH_DAPP_RPC
          : coinFamily == 4
          ? process.env.REACT_APP_MATIC_RPC
          : '';

      const provider = new ethers.providers.JsonRpcProvider(rpc);
      const { privateKey } = await WalletHelper.getPrivateKeyEvm(
        sessionPassword
      );

      if (!privateKey) {
        // console.log('INVALID PRIVATE KEY');
        return false;
      }

      const gasPriceRes = await this.getGasPrice(
        slug,
        to,
        from,
        0,
        tokenAddress,
        symbol
      );

      const gasPrice = Math.max(2 * gasPriceRes.fast * Math.pow(10, 9), 1e9);
      const nonce = await this.getNonce(slug, 0, tokenAddress, symbol, from);
      const gaslimit = (gasLimit * 2).toFixed(0);
      const transaction = {
        nonce,
        gasPrice: ethers.utils.hexlify(Math.floor(gasPrice)),
        gasLimit: ethers.utils.hexlify(Math.floor(gaslimit)),
        to: tokenAddress,
        value: value,
        from: from,
        data: data,
        chainId: Number(chainId),
      };

      const wallet = new ethers.Wallet(privateKey, provider);
      const signedTransaction = await wallet.signTransaction(transaction);
      const myResponse = await server.post(
        `${slug}/${symbol}/send`,
        {
          address_book_name: '',
          amount: parseFloat(amount / Math.pow(10, 18)),
          coin_id: coinFamily,
          fiat_price: fiatPrice.toString(),
          fiat_type: fiatType,
          from: from,
          gas_estimate: Math.floor(gasLimit),
          gas_price: Math.floor(gasPrice),
          source_type: 'ANDROID',
          to: to,
          tx_raw: signedTransaction.split('0x')[1],
          tx_type: 'dapp',
          nonce,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      return myResponse.data.tx_hash;
    } catch (error) {
      console.log('error in external swap pancake:', error);
      return false;
    }
  };

  static generateRawTransactionForNFTAndBroadcast = async (
    sessionPassword,
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
    tokenId,
    nftGasData
  ) => {
    // console.log({
    //   sessionPassword,
    //   to,
    //   from,
    //   amount,
    //   coinId,
    //   fiatPrice,
    //   fiatType,
    //   contact,
    //   slug,
    //   chainId,
    //   tokenAddress,
    //   tokenType,
    //   orderId,
    //   type,
    //   tokenId,
    //   nftGasData,
    // });

    try {
      const { account } = store.getState();

      slug = slug == 'tics' ? 'qubetics' : slug;

      const web3 = new Web3();
      const contract = new web3.eth.Contract(ERC_721_ABI);

      // const privateKey = await WalletHelper.getPrivateKey();
      const { privateKey } = await WalletHelper.getPrivateKeyEvm(
        sessionPassword
      );

      if (!privateKey) {
        return false;
      }

      const gasPriceRes = nftGasData;
      // console.log('🚀 ~ Web3Helper ~ gasPriceRes:', gasPriceRes);
      const gaslimits = gasPriceRes.estimate;
      // console.log('🚀 ~ Web3Helper ~ gaslimits:', gaslimits);
      const gasPrice = gasPriceRes.fast * Math.pow(10, 9);
      // console.log('🚀 ~ Web3Helper ~ gasPrice:', gasPrice);
      const nonce = await this.getNonce(slug, 1, tokenAddress, null, from);
      // console.log('🚀 ~ Web3Helper ~ nonce:', nonce);
      const gaslimit = (gaslimits * 2).toFixed(0);
      // console.log('🚀 ~ Web3Helper ~ gaslimit:', gaslimit);

      const transaction = {
        nonce,
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: web3.utils.toHex(gaslimit),
        to: tokenAddress,
        value: '0x0',
        from: from,
        data: contract.methods.transferFrom(from, to, tokenId).encodeABI(),
        chainId,
      };
      // console.log({ transaction });

      const signedTransaction = await web3.eth.accounts.signTransaction(
        transaction,
        privateKey
      );
      // console.log({ signedTransaction });

      const myResponse = await server.post(
        `${slug}/${tokenAddress}/send`,
        {
          address_book_name: contact || '',
          amount: parseFloat(amount),
          coin_id: coinId,
          fiat_price: fiatPrice.toString(),
          fiat_type: fiatType,
          from: from,
          gas_estimate: gasPriceRes.estimate,
          gas_price: gasPriceRes.price,
          source_type: 'ANDROID',
          to: to,
          tx_raw: signedTransaction.rawTransaction.split('0x')[1],
          tx_type: type || 'withdraw',
          order_id: orderId || undefined,
          token_id: tokenId,
          gas_price: gasPrice,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      //  console.log(myResponse, 'myResponsemyResponse');

      return myResponse.data.tx_hash;
    } catch (error) {
      // console.log(error);  
      return false;
    }
  };

  static generateRawTransactionFor1155AndBroadcast = async (
    sessionPassword,
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
    tokenId,
    nftGasData
  ) => {
    try {
      const { account } = store.getState();

      const web3 = new Web3();
      const contract = new web3.eth.Contract(ERC_1155);

      // const privateKey = await WalletHelper.getPrivateKey();
      const { privateKey } = await WalletHelper.getPrivateKeyEvm(
        sessionPassword
      );
      if (!privateKey) {
        return false;
      }
      const gasPriceRes = nftGasData;
      const gaslimits = gasPriceRes.estimate;

      const gasPrice = gasPriceRes.fast * Math.pow(10, 9);
      const nonce = await this.getNonce(slug, 1, tokenAddress, null, from);
      const gaslimit = (gaslimits * 2).toFixed(0);

      const data = contract.methods
        .safeTransferFrom(from, to, tokenId, amount, [])
        .encodeABI();

      const transaction = {
        nonce,
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: web3.utils.toHex(gaslimit),
        to: tokenAddress,
        value: '0x0',
        from: from,
        data,
        chainId,
      };

      const signedTransaction = await web3.eth.accounts.signTransaction(
        transaction,
        privateKey
      );

      const myResponse = await server.post(
        `${slug}/${tokenAddress}/send`,
        {
          address_book_name: contact || '',
          amount: parseFloat(amount),
          coin_id: coinId,
          fiat_price: fiatPrice.toString(),
          fiat_type: fiatType,
          from,
          gas_estimate: gasPriceRes.estimate,
          gas_price: gasPriceRes.price,
          source_type: 'ANDROID',
          to,
          tx_raw: signedTransaction.rawTransaction.split('0x')[1],
          tx_type: type || 'withdraw',
          order_id: orderId || undefined,
          token_id: tokenId,
          gas_price: gasPrice,
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
    isToken,
    sessionPassword,
    rpc
  ) => {
    try {
      const { account } = store.getState();
      const web3 = new ethers.providers.JsonRpcProvider(rpc);

      const { privateKey } = await WalletHelper.getPrivateKeyEvm(
        sessionPassword
      );
      if (!privateKey) {
        return false;
      }

      const gasPriceRes = await this.getGasPrice(slug, from, from, 0);

      console.log('GAS PRICE ~ 1735 ~ web3.helper.js ~ :', gasPriceRes);

      const gasPrice = ethers.utils.parseUnits(
        Math.max(gasPrice.price, 1).toString(),
        'gwei'
      );
      console.log('gasPrice', gasPrice);
      const nonce = gasPriceRes.nonce;
      const gaslimit = paymentRequest.gasLimit;

      const transaction = {
        nonce,
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: web3.utils.toHex(gaslimit * 2),
        to: to,
        value: !isToken ? web3.utils.toHex(paymentRequest.amount) : '0x0',
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
          address_book_name: contact || '',
          amount: amount.toNumber(),
          coin_id: coinId,
          fiat_price: fiatPrice.toString(),
          fiat_type: fiatType,
          from_address: from,
          gas_estimate: gasPriceRes.estimate,
          gas_price: gasPriceRes.price,
          source_type: 'ANDROID',
          to_address: to,
          trnx_raw: signedTransaction.rawTransaction.split('0x')[1],
          trnx_type: type || 'withdraw',
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
}
