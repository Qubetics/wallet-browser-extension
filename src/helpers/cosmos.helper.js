/*global chrome*/
/* global BigInt */
import { Bip39, EnglishMnemonic, Slip10, Slip10Curve } from '@cosmjss/crypto';
import BigNumber from "bignumber.js";
const {
  SigningStargateClient,
  GasPrice,
  calculateFee,
} = require('@cosmjss/stargate');
const { MsgSend } = require('cosmjs-types/cosmos/bank/v1beta1/tx');
const { stringToPath } = require('@cosmjss/crypto');
const { DirectSecp256k1HdWallet } = require('@cosmjss/proto-signing');

const QUBETICS_RPC = 'https://tendermint-internal.qubetics.com';
const PREFIX = 'qubetics';
const HD_PATH = stringToPath("m/44'/60'/0'/0/0");
const denom = 'tics';

const generateCosmosWalletAddress = async (mnemonic) => {
  try {
    if (!mnemonic || typeof mnemonic !== 'string') {
      throw new Error('Invalid or missing mnemonic');
    }

    const prefix = 'qubetics';
    const hdPath = stringToPath("m/44'/60'/0'/0/0");

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix,
      hdPaths: [hdPath],
    });

    const [account] = await wallet.getAccounts();

    return {
      address: account.address,
    };
  } catch (error) {
    // console.error('createCosmosAddress error:', error);
    throw error;
  }
};

const getCosmosAddress = async () => {
  let address = '';
  try {
    const { accounts } = await chrome.storage.local.get('accounts');
    const defaultAccount = accounts.find((el) => el.default);
    // console.log(
    //   '🚀 ~ WalletHelper ~ staticunlockWal ~ defaultAccount:',
    //   defaultAccount
    // );
    address = defaultAccount?.coinFamilyAndAddress['cosmos'];
    return address;
  } catch (error) {
    return false;
  }
};

const createAddressFromMnemonic = async (mnemonic, prefix = PREFIX) => {
  const hdPath = HD_PATH;

  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix,
    hdPaths: [hdPath],
  });

  const [account] = await wallet.getAccounts();
  const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic));
  const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
  const privateKeyHex = Buffer.from(privkey).toString('hex');
  return { wallet, address: account.address, privateKey: privateKeyHex };
};

const createSigner = async (mnemonic, prefix = PREFIX) => {
  const hdPath = HD_PATH;
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix,
    hdPaths: [hdPath],
  });
  // console.log('✅ signer:', wallet);
  return { wallet };
};

const createSigning = async (mnemonic) => {
  const { wallet } = await createSigner(mnemonic);
  const client = await SigningStargateClient.connectWithSigner(
    QUBETICS_RPC,
    wallet
    // clientOptions
  );
  // console.log('✅ signingClient created', client);
  return { client };
};

const getBalance = async (mnemonic) => {
  const { client } = await createSigning(mnemonic);
  const [account] = await client.getAccounts();
  let address = account.address;
  const balance = await client.getBalance(address, denom);
  if (!balance.amount || parseFloat(balance.amount) <= 0) {
    throw new Error('Account has no funds. Send tokens to the account first.');
  }
  return balance;
};

export const exponentialToDecimal = (exponential) => {
  let decimal = exponential?.toString().toLowerCase();
  if (decimal.includes('e+')) {
    const exponentialSplitted = decimal.split('e+');
    let postfix = '';
    for (let i = 0; i < +exponentialSplitted[1] - (exponentialSplitted[0].includes('.') ? exponentialSplitted[0].split('.')[1].length : 0); i++) {
      postfix += '0';
    }
    const addCommas = text => {
      let j = 3;
      let textLength = text.length;
      while (j < textLength) {
        text = `${text.slice(0, textLength - j)}${text.slice(textLength - j, textLength)}`;
        textLength++;
        j += 3 + 1;
      }
      return text;
    };
    decimal = addCommas(exponentialSplitted[0].replace('.', '') + postfix);
  }
  if (decimal.toLowerCase().includes('e-')) {
    const exponentialSplitted = decimal.split('e-');
    let prefix = '0.';
    for (let i = 0; i < +exponentialSplitted[1] - 1; i++) {
      prefix += '0';
    }
    decimal = prefix + exponentialSplitted[0].replace('.', '');
  }
  return decimal;
}

export function toFixedExp(num, fixed = 2, value) {
  if (num === undefined || num === null || num === '') return '0.00';

  // convert exponential to normal decimal string
  num = exponentialToDecimal(num);

  // create regex to capture digits up to 'fixed' decimal places
  const re = new RegExp(`^-?\\d+(?:\\.\\d{0,${fixed}})?`);

  const match = num.toString().match(re);
  if (match && match[0] !== undefined) {
    return match[0];
  }
  return '0.00';
}

const estimateGasLimit = async (
  mnemonic = '',
  toAddress,
  amount,
  fromAddress,
  gasPrice,
  gasLimitMultiplier = 1.5,
  _gasLimit
) => {
  let gasLimit = 0;
  let stdFee = 0;
  let gasEstimate; // <-- ✅ Declare outside try

  // console.log('estimateGasLimit---', mnemonic, toAddress, amount);
  const gasPriceLocal = GasPrice.fromString(gasPrice);
  // console.log('✅ gasPriceLocal:', gasPriceLocal);

  const { client } = await createSigning(mnemonic);
  // console.log('estimateGasLimit---client', client);

  let address = fromAddress;
  let amt = new BigNumber(amount).multipliedBy(new BigNumber(10).pow(18)).toFixed(0);
  const amount_1 = toFixedExp(amt, 0); //working
  // console.log('amount_1--', amount_1,'--amt',amt);

  const message = {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: MsgSend.fromPartial({
      fromAddress: fromAddress,
      toAddress: toAddress,
      amount: [{ denom: 'tics', amount: amount_1.toString() }],
    }),
  };

  // console.log('estimateGasLimit---message', message);

  try {
    gasEstimate = await client.simulate(address, [message], '');
    // console.log('Gas estimate:', gasEstimate);
  } catch (err) {
    // console.error('⚠️ simulate() failed:', err);
  }

  gasLimit = Math.round((gasEstimate ?? _gasLimit) * gasLimitMultiplier);
  stdFee = calculateFee(gasLimit, gasPriceLocal);
  // console.log('Fee:--gasLimit', gasLimit);
  // console.log('Fee:--stdFee', stdFee);
  return { gasLimit, gasEstimate, gasPriceLocal, stdFee };
};

const hasSufficientBalance = async (_mnemonic, amountToSendTics) => {
  const mnemonic = _mnemonic;
  const rpcEndpoint = QUBETICS_RPC;
  const prefix = PREFIX;
  const denom = denom;
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix,
  });
  const [account] = await wallet.getAccounts();
  const client = await SigningStargateClient.connectWithSigner(
    rpcEndpoint,
    wallet
  );

  const balances = await client.getAllBalances(account.address);
  const ticsBalance = balances.find((b) => b.denom === denom);
  const balance = ticsBalance ? BigInt(ticsBalance.amount) : BigInt(0);
  // console.log('🚀 ~ hasSufficientBalance ~ balance:', balance);

  const gasPrice = GasPrice.fromString('0.025tics');
  const gasLimit = 200_000;
  const feeAmount = gasPrice.amount.multiply(gasLimit).ceil().toString();
  // console.log('🚀 ~ hasSufficientBalance ~ feeAmount:', feeAmount);

  const totalRequired = BigInt(amountToSendTics) + BigInt(feeAmount);
  // console.log('🚀 ~ hasSufficientBalance ~ totalRequired:', totalRequired);

  return balance >= totalRequired;
};

const broadcastTx = async ({
  mnemonicsNew,
  fromAddress,
  toAddress,
  amount,
  fee,
}) => {
  try {
    // console.log(
    //   'broadcastTx---',
    //   mnemonicsNew,
    //   fromAddress,
    //   toAddress,
    //   amount,
    //   fee
    // );
    const { client } = await createSigning(mnemonicsNew);
    // const amount_1 = Math.round(amount * 10 ** 18);
    let amt = new BigNumber(amount).multipliedBy(new BigNumber(10).pow(18)).toFixed(0);
    const amount_1 = toFixedExp(amt, 0); //working
    // console.log('amount_1--', amount_1);

    const msg = {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: MsgSend.fromPartial({
        fromAddress,
        toAddress,
        amount: [{ denom: 'tics', amount: amount_1.toString() }],
      }),
    };

    const transactionSign = await client.signAndBroadcast(
      fromAddress,
      [msg],
      fee
    );

    // console.log('Transaction result:', transactionSign);

    if(transactionSign?.msgResponses?.length === 0){
      throw new Error('Transaction Failed');
    }

    return {
      hash: transactionSign.transactionHash,
      block: transactionSign?.height,
      transFee: transactionSign?.gasUsed?.toString(),
      transEstimate: transactionSign?.gasWanted?.toString(),
    };
  } catch (error) {
    // console.error('broadcastTx error:', error);
    return {
      success: false,
      message: error.message || 'Transaction failed',
      error,
    };
  }
};

export {
  generateCosmosWalletAddress,
  getCosmosAddress,
  broadcastTx,
  estimateGasLimit,
  createSigning,
  createAddressFromMnemonic,
  getBalance,
  hasSufficientBalance
};
