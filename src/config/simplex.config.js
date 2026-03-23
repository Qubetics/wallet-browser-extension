export const IS_PRODUCTION = process.env.REACT_APP_IS_PRODUCTION;

export const FETCH_SIMPLEX_PRICE = !IS_PRODUCTION
  ? "https://REDACTED/stage/api/v1/on_off_ramp/alchemy_price"
  : "https://REDACTED/dev/api/v1/on_off_ramp/simplex_price";

// export const FETCH_SIMPLEX_COINS = !IS_PRODUCTION
//   ? "https://REDACTED/stage/api/v1/extension/get_alchemy_supported_coins"
//   : "https://REDACTED/dev/api/v1/extension/get_simplex_supported_coins";
