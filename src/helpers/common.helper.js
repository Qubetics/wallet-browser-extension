import Web3 from 'web3';
import TOKEN_ABI from '../Assets/JsonFiles/tokenContract.ABI.json';
import base58 from 'bs58';
import BigNumber from 'bignumber.js';

export function modifyString(str) {
  var first = str?.substring(0, 7);
  var last = str?.substring(str.length - 7);
  var modifiedStr = first + '...' + last;

  return modifiedStr;
}

export function generateString(length) {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = ' ';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result.toUpperCase().trim();
}

export const toFixed = (num, fixed) => {
  num = num.toString(); //If it's not already a String
  if (num.includes('.')) {
    num = num.slice(0, num.indexOf('.') + (fixed + 1));
  }
  return Number(num);
};

export const COIN_FAMILY = {
  1: 'ETH',
  2: 'BTC',
  3: 'BSC',
  4: 'SOL',
  5: 'ADA',
  6: 'POL',
  7: 'AVAX',
  8: 'CRO',
  9: 'PLS',
};
export const BLOCHCHAIN_URL = {
  maticRPCUrl: 'https://rpc-mainnet.maticvigil.com',
  arbRPCUrl: 'https://arb1.arbitrum.io/rpc',
  baseRPCUrl: 'https://mainnet.base.org',
  avaxRPCUrl: 'https://avalanche-c-chain-rpc.publicnode.com',
  solRPCUrl: 'https://api.mainnet-beta.solana.com',
  bnbRPCUrl: 'https://bsc-dataseed1.binance.org:443',
};
export const getWeb3Object = (RPC_URL) => {
  ////console.log("chk:::::::blockChain", blockChain);
  // ////console.log("RPC_URL::>>>>>>>", RPC_URL[blockChain][network]["rpc"]);

  return new Web3(RPC_URL);
};

export const getCoinBalance = async (blockChain, userAddress) => {
  ////console.log("blockChain::::::", blockChain);
  ////console.log("userAddress::::::", userAddress);
  let ethBal = await getWeb3Object(blockChain).eth.getBalance(userAddress);
  ////console.log("ethBal:::::", ethBal);
  return ethBal;
};
// *************************** interaction with contact  ********************************

export const getContractObject = async (tokenAddress, blockChain, abi) => {
  ////console.log("tokenAddress:::::>>>>>", tokenAddress);
  ////console.log("blockChain:::::>>>>>", blockChain);
  try {
    let web3Object = getWeb3Object(blockChain);
    let tokenContractObject = new web3Object.eth.Contract(abi, tokenAddress);
    return tokenContractObject;
  } catch (e) {
    console.error('error ===>>', e);
  }
};
// ***************************  get user token balance ********************************

export const getTokenBalance = async (tokenAddress, address, blockChain) => {
  // console.log("chk tokenAddresss::::::", tokenAddress, address, blockChain);
  try {
    const contract = await getContractObject(
      tokenAddress,
      blockChain,
      TOKEN_ABI
    );
    let result = await contract.methods.balanceOf(address).call();
    // console.log("chk result::::::", result);
    return result;
  } catch (error) {
    // console.log('Error XXXXXX==>> :', error);
    return error;
  }
};

export const formatNumberFiat = (value) => {
  const decimalPlaces = (value.toString().split('.')[1] || '').length;
  const parsedValue = parseFloat(value);

  if (decimalPlaces > 8) {
    // Truncate the number to 8 decimal places without rounding
    const truncatedValue = Math.floor(parsedValue * 10 ** 8) / 10 ** 8;
    return truncatedValue?.toString();
  } else {
    return parsedValue?.toString();
  }
};

export function getSignature(transaction) {
  const signature =
    'signature' in transaction
      ? transaction.signature
      : transaction.signatures[0];
  if (!signature) {
    throw new Error(
      'Missing transaction signature, the transaction was not signed by the fee payer'
    );
  }
  return base58.encode(signature);
}

Number.prototype.noExponents = function () {
  try {
    var data = String(this).split(/[eE]/);
    if (data.length === 1) return data[0];
    var z = '',
      sign = this < 0 ? '-' : '',
      str = data[0].replace('.', ''),
      mag = Number(data[1]) + 1;
    if (mag < 0) {
      z = sign + '0.';
      while (mag++) z += '0';
      return z + str.replace(/^\-/, '');
    }
    mag -= str.length;
    while (mag--) z += '0';
    return str + z;
  } catch (error) {}
};

export const noExponential = (num) => {
  return Number(num).noExponents();
};

export const noExponentialBond = (num) => {
  return Number(num).toLocaleString('fullwide', { useGrouping: false });
};

export function toPrecisionMultiply(num) {
  let number = num;
  const result = new BigNumber(number).multipliedBy(
    new BigNumber(10).exponentiatedBy(18)
  );
  const respectedRes = result.multipliedBy(1).toFixed();
  return respectedRes;
}

export function capitalizeWords(input) {
  // console.log('input', input);
  if (typeof input !== 'string') return '';

  // console.log('input 2', input);

  // Trim and check if there's at least one word (non-space character)
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Capitalize each word
  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatNumberInput(value, maxDecimals = 18) {
  // Handle empty, null, undefined
  if (value === '' || value === null || value === undefined) {
    return '';
  }

  // Convert to string to handle all input types
  let numStr = String(value);

  // Remove any existing commas
  numStr = numStr.replace(/,/g, '');

  // Handle exponential notation - convert to fixed decimal
  if (numStr.includes('e') || numStr.includes('E')) {
    const num = parseFloat(numStr);
    if (isNaN(num)) return '';

    // Convert exponential to fixed notation with enough precision
    numStr = num.toFixed(maxDecimals);
  }

  // Parse the number
  const num = parseFloat(numStr);
  if (isNaN(num)) return '';

  // Split into integer and decimal parts
  const parts = numStr.split('.');
  let integerPart = parts[0];
  let decimalPart = parts[1] || '';

  // Remove trailing zeros from decimal part
  decimalPart = decimalPart.replace(/0+$/, '');

  // Limit decimal places to maxDecimals
  if (decimalPart.length > maxDecimals) {
    decimalPart = decimalPart.substring(0, maxDecimals);
    // Remove trailing zeros again after truncation
    decimalPart = decimalPart.replace(/0+$/, '');
  }

  // Add commas to integer part
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Combine parts
  if (decimalPart) {
    return `${integerPart}.${decimalPart}`;
  }

  return integerPart;
}
