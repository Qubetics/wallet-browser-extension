// the token list is always an array, even if the API returns something else
export const setTokens = (tokens) => ({
  type: "TOKENS",
  payload: Array.isArray(tokens) ? tokens : [],
});
