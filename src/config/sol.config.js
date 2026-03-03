export const IS_PRODUCTION = process.env.REACT_APP_IS_PRODUCTION;

// export const FETCH_SOL_BALANCE = !IS_PRODUCTION
//   ? "https://REDACTED/stage/api/v1/extension/unspent_btc"
//   : "https://REDACTED/dev/api/v1/extension/get_sol_balance";

// export const FETCH_SOL_TOKEN_BALANCE = !IS_PRODUCTION
//   ? "https://REDACTED/stage/api/v1/extension/unspent_btc"
//   : "https://REDACTED/dev/api/v1/extension/get_sol_token_balance";

export const SOlToken = [
  {
    id: "fa35bf49-928d-4060-a846-bedf74e10624",
    name: "Star Atlas DAO",
    symbol: "POLIS",
    balance: 0,
    decimals: 8,
    tokenAddress: ("poLisWXnNRwC6oBu1vHiuKQzFjGL4XDSu4g9qjz9qVk"),
    image: "https://s2.coinmarketcap.com/static/img/coins/64x64/11213.png",
    status: false,
  },
];
