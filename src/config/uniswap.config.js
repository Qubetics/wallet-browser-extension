export const UNI_MAINNET_ROUTER = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
export const UNI_TESTNET_ROUTER = "0x470d5ce9468337D509b688b86Ad9cD7a8C80D753";

export const UNI_ROUTER_ABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  { anonymous: false, inputs: [], name: "FeeCollectorSet", type: "event" },
  { anonymous: false, inputs: [], name: "FeesSet", type: "event" },
  { anonymous: false, inputs: [], name: "Initialized", type: "event" },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint8", name: "version", type: "uint8" },
    ],
    name: "Initialized",
    type: "event",
  },
  { anonymous: false, inputs: [], name: "OwnerSet", type: "event" },
  { anonymous: false, inputs: [], name: "RouterFactorySet", type: "event" },
  {
    inputs: [],
    name: "factory",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeCollector",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "fees",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
    ],
    name: "getAmountsIn",
    outputs: [
      { internalType: "uint256[3]", name: "amounts", type: "uint256[3]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
    ],
    name: "getAmountsOut",
    outputs: [
      { internalType: "uint256[3]", name: "amounts", type: "uint256[3]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_routerAddress", type: "address" },
      { internalType: "address", name: "_factory", type: "address" },
      { internalType: "address", name: "weth", type: "address" },
      { internalType: "address", name: "dai", type: "address" },
      { internalType: "address", name: "usdt", type: "address" },
      { internalType: "address", name: "usdc", type: "address" },
      { internalType: "address", name: "_owner", type: "address" },
      { internalType: "address", name: "_feeCollector", type: "address" },
      { internalType: "uint256", name: "_fees", type: "uint256" },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_newFees", type: "uint256" }],
    name: "setFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_newFeeCollector", type: "address" },
    ],
    name: "setFeesCollector",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_newOwner", type: "address" }],
    name: "setOwner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_newRouter", type: "address" },
      { internalType: "address", name: "_newFactory", type: "address" },
    ],
    name: "setRouterFactory",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "stableCoins",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapETHForExactTokens",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactETHForTokens",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactETHForTokensSupportingFeeOnTransferTokens",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactTokensForETH",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactTokensForETHSupportingFeeOnTransferTokens",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactTokensForTokens",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactTokensForTokensSupportingFeeOnTransferTokens",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint256", name: "amountInMax", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapTokensForExactETH",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint256", name: "amountInMax", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapTokensForExactTokens",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "uniswapV2",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

export const WETH_ABI = [
  // Wrap ETH
  "function deposit() payable",
  // Unwrap ETH
  "function withdraw(uint wad) public",
];

export const MAX_FEE_PER_GAS = 100000000000;
export const MAX_PRIORITY_FEE_PER_GAS = 100000000000;
export const TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER = 2000000000000000000;

export const UNISWAP_NATIVE_WRAPPED_TOKEN_ADDRESSES = {
  1: {
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    name: "WETH",
    decimals: 18,
  },
  3: {
    address: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
    name: "WETH",
    decimals: 18,
  },
  4: {
    address: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
    name: "WETH",
    decimals: 18,
  },
  5: {
    address: "0x7536b04C48334d610fA9Adc3936Bc4632Df6037C",
    name: "WETH",
    decimals: 18,
  },
  42: {
    address: "0xd0A1E359811322d97991E03f863a0C30C2cF029C",
    name: "WETH",
    decimals: 18,
  },
  10: {
    address: "0x4200000000000000000000000000000000000006",
    name: "WETH",
    decimals: 18,
  },
  69: {
    address: "0x4200000000000000000000000000000000000006",
    name: "WETH",
    decimals: 18,
  },
  42161: {
    address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    name: "WETH",
    decimals: 18,
  },
  421611: {
    address: "0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681",
    name: "WETH",
    decimals: 18,
  },
  137: {
    address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    name: "WMATIC",
    decimals: 18,
  },
  8001: {
    address: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
    name: "WMATIC",
    decimals: 18,
  },
};
