import Web3 from "web3";
import TOKEN_ABI from "../Assets/JsonFiles/tokenContract.ABI.json";
import base58 from "bs58";
export function numberWithSpaces(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function modifyString(str) {
  var first = str?.substring(0, 7);
  var last = str?.substring(str.length - 7);
  var modifiedStr = first + "..." + last;

  return modifiedStr;
}

export function generateString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = " ";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result.toUpperCase().trim();
}

export const toFixed = (num, fixed) => {
  num = num.toString(); //If it's not already a String
  if (num.includes(".")) {
    num = num.slice(0, num.indexOf(".") + (fixed + 1));
  }
  return Number(num);
};

export const COIN_FAMILY = {
  1: "ETH",
  2: "BTC",
  3: "BSC",
  4: "SOL",
  5: "ADA",
  6: "POL",
  7: "AVAX",
  8: "CRO",
  9: "PLS",
};
export const BLOCHCHAIN_URL = {
  maticRPCUrl: "https://rpc-mainnet.maticvigil.com",
  arbRPCUrl: "https://arb1.arbitrum.io/rpc",
  baseRPCUrl: "https://mainnet.base.org",
  avaxRPCUrl: "https://avalanche-c-chain-rpc.publicnode.com",
  solRPCUrl: "https://api.mainnet-beta.solana.com",
  bnbRPCUrl: "https://bsc-dataseed1.binance.org:443",
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
    console.error("error ===>>", e);
  }
};
// ***************************  get user token balance ********************************

export const getTokenBalance = async (tokenAddress, address, blockChain) => {
  console.log("chk tokenAddresss::::::", tokenAddress, address, blockChain);
  try {
    const contract = await getContractObject(
      tokenAddress,
      blockChain,
      TOKEN_ABI
    );
    let result = await contract.methods.balanceOf(address).call();
    console.log("chk result::::::", result);
    return result;
  } catch (error) {
    console.log("Error XXXXXX==>> :", error);
    return error;
  }
};

export const formatNumberUSD = (value) => {
  // const decimalPlaces = (value.toString().split(".")[1] || "").length;
  // return parseFloat(value).toFixed(decimalPlaces > 8 ? 8 : decimalPlaces);
  const numberValue = parseFloat(+value || 0);
  if (isNaN(numberValue)) {
    return value;
  }

  const decimalPlaces = (value.toString().split(".")[1] || "").length;

  const formattedNumber = numberValue.toLocaleString(undefined, {
    maximumFractionDigits: decimalPlaces > 2 ? 2 : decimalPlaces,
  });

  return formattedNumber;
};
export const formatNumberFiat = (value) => {
  const decimalPlaces = (value.toString().split(".")[1] || "").length;
  const parsedValue = parseFloat(value);

  if (decimalPlaces > 8) {
    // Truncate the number to 8 decimal places without rounding
    const truncatedValue = Math.floor(parsedValue * 10 ** 8) / 10 ** 8;
    return truncatedValue.toString();
  } else {
    return parsedValue.toString();
  }
};

export function getSignature(transaction) {

  const signature = "signature" in transaction ? transaction.signature : transaction.signatures[0];
  if (!signature) {
    throw new Error(
      "Missing transaction signature, the transaction was not signed by the fee payer"
    );
  }
  return base58.encode(signature);
}