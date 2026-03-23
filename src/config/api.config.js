export const IS_PRODUCTION = process.env.REACT_APP_IS_PRODUCTION;

// export const FETCH_CHARTS = !IS_PRODUCTION
//   ? "https://REDACTED/stage/api/v1/extension/coin_graph_data"
//   : "https://REDACTED/dev/api/v1/extension/coin_graph_data";

export const FETCH_IMAGES = !IS_PRODUCTION
  ? "https://REDACTED/"
  : "https://REDACTED/";

// export const FETCH_MORE_IMAGES = !IS_PRODUCTION
//   ? "https://REDACTED/stage/api/v1/extension/coin_graph_data"
//   : "https://REDACTED/dev/api/v1/extension/get_token_image";
