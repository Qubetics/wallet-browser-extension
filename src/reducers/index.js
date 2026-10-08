import { combineReducers } from "redux";
import accountReducer from "./account";
import alertsReducer from "./alerts";
import authReducer from "./auth";
import balanceReducer from "./balance";
import BalanceShowOutReducer from "./balance-show";
import BalanceShowInReducer from "./balance-show-in";
import chainReducer from "./chains";
import createReducer from "./create";
import currencyReducer from "./currency";
import filterReducer from "./filter";
import imageReducer from "./image";
import loadingReducer from "./loading";
import nftBackDataReducer from "./nftData";
import nftsReducer from "./nfts";
import pricesReducer from "./prices";
import spritzReducer from "./spritz";
import spritzBankReducer from "./spritzAccounts";
import spritzFilterReducer from "./spritzFilter";
import spritzKycReducer from "./spritzKYC";
import themeReducer from "./theme";
import tokensReducer from "./tokens";
import transactionsReducer from "./transactions";
import updateSpritzReducer from "./updateSptitzAccount";
import billListReducer from "./billList";
import billPaySpritzFilterReducer from "./billPaySpritzFilter";
import spritzTabReducer from "./spritzTab";
import swapDetailReducer from "./swap";

export default combineReducers({
  account: accountReducer,
  chain: chainReducer,
  currency: currencyReducer,
  loading: loadingReducer,
  transactions: transactionsReducer,
  auth: authReducer,
  prices: pricesReducer,
  alerts: alertsReducer,
  tokens: tokensReducer,
  balance: balanceReducer,
  create: createReducer,
  billList: billListReducer,
  filter: filterReducer,
  theme: themeReducer,
  balanceIn: BalanceShowInReducer,
  balanceOut: BalanceShowOutReducer,
  image: imageReducer,
  nftBackData: nftBackDataReducer,
  nfts: nftsReducer,
  spritz: spritzReducer,
  spritzKyc: spritzKycReducer,
  spritzBank: spritzBankReducer,
  spritzFilter: spritzFilterReducer,
  updateSpritz: updateSpritzReducer,
  billPayFilter: billPaySpritzFilterReducer,
  spritzTab: spritzTabReducer,
  swapDetail: swapDetailReducer,
});
