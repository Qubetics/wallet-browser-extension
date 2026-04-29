import { getRpcUrl } from './rpcService';

export const BL_CODE = {
  1: "BNB",
  2: "ETH",
  3: "BTC",
  4: "POL",
  5: "SOL",
  6: "TRX",
  7: "TICS"
}

export const supportedNetworks = [{ coin_family: 1, network: "BINANCESMARTCHAIN" }, { coin_family: 2, network: "ETHEREUM" }, { coin_family: 3, network: "BITCOIN" }, { coin_family: 4, network: "POLYGON" }, { coin_family: 5, network: "SOLANA" }, { coin_family: 6, network: "TRON" }];


export const token_type = (coin_family) => {
  return coin_family === 1 ? "BEP20" : coin_family === 2 ? "ERC20" : coin_family === 4 ? "POL ERC20" : coin_family === 5 ? "SPL" : coin_family === 6 ? "TRC20" : coin_family === 7 ? "TICS20" : ""
}

export const rpc_chain = (coin_family) => {
  return coin_family === 1 ? getRpcUrl('REACT_APP_BNB_RPC') :
    coin_family === 2 ? getRpcUrl('REACT_APP_ETH_RPC') :
      coin_family === 3 ? getRpcUrl('REACT_APP_BTC_RPC') :
        coin_family === 4 ? getRpcUrl('REACT_APP_MATIC_RPC') :
          coin_family === 5 ? getRpcUrl('REACT_APP_SOL_RPC') :
            coin_family === 6 ? getRpcUrl('REACT_APP_TRON_RPC') :
            getRpcUrl('REACT_APP_QUBETIC_RPC')
}

export const SWIFT_ERROR = {
  201: 'The equipment source does not exist',
  202: 'Decimal digits of deposit amount are too long',
  203: 'Failed to obtain the deposit address',
  204: 'The service charge method does not exist',
  205: 'The service charge method cannot be set repeatedly',
  207: 'Address type does not exist',
  209: 'The destination receiving address cannot be set repeatedly',
  210: 'The return to original currency address cannot be set repeatedly',
  212: 'The address type is set incorrectly',
  213: 'Illegal request',
  214: 'Currency does not exist',
  215: 'The address is illegal',
  216: 'Illegal amount and quantity',
  217: 'Insufficient account balance',
  218: 'This currency does not support exchange, please select again',
  266: 'Cannot exceed 2 digits after the decimal point',
  270: 'The amount of the coin cannot exceed 4 digits after the decimal point',
  271: 'The currency amount of the currency can only be an integer',
  279: 'The amount of the coin cannot exceed 3 digits after the decimal point',
  311: "You've reached the daily trade amount limit!",
  // 800: 'success',
  900: 'Server Error',
  901: 'Incomplete request parameters',
  902: 'System starting',
  903: 'Authentication failed',
  904: 'Message decryption failed',
  905: 'Message processing error',
  906: 'System processing exception',
  907: 'Required field is blank',
  908: 'Error in sending message',
  909: 'Message verification failed',
  910: 'Received successfully',
  911: 'System processing error',
  912: 'The system does not have this order data',
  913: 'The deposit currency does not exist',
  914: 'The receiving currency does not exist',
  915: 'Deposit currency and receipt currency cannot be the same',
  916: 'The destination address is illegal',
  917: 'Illegal refund address',
  918: 'Destination address and refund address cannot be the same',
  919: 'Illegal deposit amount',
  920: 'Illegal amount in received currency',
  921: 'Deposit amount is not within the range',
  114: 'Address or IP at risk',
  114: 'The destination address is not authorized',
  114: 'You have reached the daily upper limit for $Cube. The swap is temporarily unavailable.',
  115: 'Insufficient liquidity',
};


export const DENOM = process.env.REACT_APP_DENOM;
export const PREFIX = "qubetics";
export const FEE = process.env.REACT_APP_FEE_DEDUCTION;
export const nodeUrl = process.env.REACT_APP_NODE_URL;


export const BASE_URL = {
  EXPLORER_API_URL: process.env.REACT_APP_EXPLORER_API_URL,
  EXPLORER_NAVIGATION_URL: process.env.REACT_APP_EXPLORER_NAVIGATION_URL,
  VALIDATOR_API: process.env.REACT_APP_VALIDATOR_API,
};