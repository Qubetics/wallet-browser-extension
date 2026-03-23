/*global chrome*/

import { Route, Routes, Navigate, useNavigate, useLocation } from "react-router-dom";
import "./App.scss";
import FixWidthLayout from "./Layout/FixWidthLayout";
import OnlyContent from "./Layout/OnlyContent";
import WelcomeLayout from "./Layout/WelcomeLayout";
import Defi from "./Pages/Defi/Defi";
import History from "./Pages/History/History";
import Send from "./Pages/Send/Send";
import SendCoins from "./Pages/Send/SendCoins/SendCoins";
import Setting from "./Pages/Setting/Setting";
import Wallet from "./Pages/Wallet/Wallet";
import SetPasswordScreen from "./Pages/WelcomeScreens/SetPasswordScreen";
import WelcomeScreen from "./Pages/WelcomeScreens/WelcomeScreen";
import ImportPhrase from "./Pages/SecretPhrase/ImportPhrase";
import AddresBook from "./Pages/AddresBook/AddresBook";
import Manage from "./Pages/Manage/Manage";
import Swap from "./Pages/Swap/Swap";
import SwapDetails from "./Pages/Swap/SwapDetails/SwapDetails";
import CurrencyDetails from "./Pages/Wallet/CurrencyDetails/CurrencyDetails";
import CustomToken from "./Pages/CustomTocken/CustomTocken";
import WatchWallet from "./Pages/WelcomeScreens/WatchWallet";
import WatchAddress from "./Pages/WelcomeScreens/WatchAddress";
import SecretPhrasePaste from "./Pages/WelcomeScreens/SecretPhrasePaste";
import CreateNewWallet from "./Pages/WelcomeScreens/CreateNewWallet";
import EditWallet from "./Pages/EditWallet/EditWallet";
import ShowSecretPhrase from "./Pages/showSecretPhrase/ShowSecretPhrase";
import CurrencyPrefrence from "./Pages/CurrencyPrefrence/CurrencyPrefrence";

import ClipLoader from "react-spinners/ClipLoader";
import { useEffect, useState } from "react";
import VerifyPassword from "./Pages/Password/Password";
import { store } from ".";
import { setAccount } from "./actions/accounts";
import { setChain } from "./actions/chains";
import ForgotPassword from "./Pages/WelcomeScreens/ForgotPassword";
import { setCurrency } from "./actions/currency";
import AddContact from "./Pages/AddContact/CustomTocken";
import NetworkPreference from "./Pages/NetworkPreference/NetworkPreference";
import AddNetwork from "./Pages/AddNetwork/AddNetwork";
import { Loader } from "./Components/Loader/Loader";
import { useSelector } from "react-redux";
import { WalletHelper } from "./helpers/wallet.helper";
import EditNetwork from "./Pages/EditNetwork/EditNetwork";
import { setAuth } from "./actions/auth";
import PancakeSwap from "./Pages/PancakeSwap/PancakeSwap";
import PancakeSwapDetails from "./Pages/PancakeSwap/SwapDetails/PancakeSwapDetails";
import CrossChainDetails from "./Pages/CrossChain/SwapDetails/CrossChainDetials";
import AccountPreference from "./Pages/AccountPrefrence/NetworkPreference";
import MultiShowSecretPhrase from "./Pages/multiShowSecretPhrase/MultiShowSecretPhrase";
import ConfirmMultiShowSecretPhrase from "./Pages/confirmMultiShowSecretPhrase copy/ConfirmMultiShowSecretPhrase";
import AddPriceAlert from "./Pages/AddPriceAlert/AddPriceAlert";
import PriceAlerts from "./Pages/PriceAlert/PriceAlert";
import NewName from "./Pages/NewName/NewName";
import EnterPrice from "./Pages/Buy/EnterPrice/EnterPrice";
import WatchPassword from "./Pages/WelcomeScreens/WatchPassword";
import NewAddress from "./Pages/NewAddress/NewAddress";
import OnlyCrossChain from "./Pages/OnlyCrossChain/PancakeSwap";
import { ExternalConnection } from "./Pages/ExternalConnections/ExternalConnections";
import WatchOnlyList from "./Pages/WatchOnlyList/NetworkPreference";
import NewAddressWatchOnly from "./Pages/NewAddressWatchOnly/NewAddress";
import TransactionFilter from "./Pages/TransactionFilter/TransactionFilter";
import ReceiveTokens from "./Pages/ReceiveCoins/Receive";
import Alerts from "./Pages/Alerts/Alerts";
import Notification from "./Pages/PushNotification/Notification";
import WalletListing from "./Pages/WalletListing/WalletListing";
import BuyCoins from "./Pages/BuyCoins/BuyCoins";
import FilterHistory from "./Pages/History/FilterHistory";
import TransactionHistory from "./Pages/History/TransactionHistory/TransactionHistory";
import { setTheme } from "./actions/theme";
import ChangePin from "./Pages/ChangePin/ChangePin";
import { setCreate } from "./actions/create";
import { useIdleTimer } from "react-idle-timer";
import NftDetail from "./Pages/Nft/NftDetail";
import Lock from "./Pages/Lock/Lock";
import SendConfirm from "./Pages/Send/SendConfirm/SendConfirm";
import ConnectedApp from "./Pages/ConnectedApp/ConnectedApp";
import ExchangePancake from "./Pages/ConnectedApp/ExchangePancake";
import MyBills from "./Pages/BillPay/MyBills";
import CreditCard from "./Pages/BillPay/CreditCard";
import CreditBillPay from "./Pages/BillPay/CreditBillPay";
import BillAddToken from "./Pages/BillPay/BillAddToken";
import ManageWallet from "./Pages/ManageWallet/ManageWallet";
import ShowPrivateKey from "./Pages/ShowPrivateKeyChainSettings/ShowPrivateKey";
import AddNewWallet from "./Pages/SettingsNewAccount/SettingsNewAccount";
import SettingImportWallet from "./Pages/SettingsImportAccountUsingPrivateKey/SettingImportWallet";
import SettingImportWalletPrivatekey from "./Pages/SettingsImportAccountUsingPrivateKey/SettingImportWalletPrivateKey";
import WatchList from "./Pages/Watchlist/WatchList";
import BuySell from "./Pages/BuySell/BuySell";
import AddWatchList from "./Pages/Watchlist/AddWatchList";
import { Portfolio } from "./Pages/Portfolio/Portfolio";
import TermsPolicy from "./Pages/WelcomeScreens/TermsPolicy";
import SecretPhrase from "./Pages/WelcomeScreens/SecretPhrase";
import ReceiveCurrency from "./Pages/ReceiveCoins/ReceiveCurrency";
import SecuritySetting from "./Pages/Setting/SecuritySetting";
import NftManageWallet from "./Pages/Nft/NftManageWallet";
import NftSend from "./Pages/Nft/NftSend";
import MyWallets from "./Components/BalanceDetails/MyWallets";
import ChainAbstraction from "./Pages/ChainAbstraction/chainabstraction";
import SelectCoin from "./Pages/SelectCoin/SelectCoin";
import ExternalReceive from "./Pages/SelectCoin/ExternalReceive";
import DVpn from "./Components/DVpn/DVpn";
import RecentSessions from "./Components/RecentSessions/RecentSessions";
import Servers from "./Components/Servers/Servers";
import DvpnSetting from "./Components/DvpnSetting/DvpnSetting";
import AccountDetails from "./Components/DvpnSetting/AccountDetails/AccountDetails";
import DNSDetails from "./Components/DvpnSetting/DNSDetails/DNSDetails";
import RPCDetails from "./Components/DvpnSetting/RPCDetails/RPCDetails";
import AddCustomDNS from "./Components/DvpnSetting/DNSDetails/AddCustomDNS";
import AccountTopUp from "./Components/DvpnSetting/AccountTopUp/AccountTopUp";
import ServersDetails from "./Components/Servers/ServersDetails";
import ServersNodes from "./Components/Servers/ServersNodes";
import ServiceProvider from "./Components/ServiceProvider/ServiceProvider";

function App() {
  const [state, setState] = useState("Active");
  const [count, setCount] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const onIdle = async () => {
    const { autoLock } = await chrome.storage.local.get("autoLock");
    if (!autoLock) return;

    const { accounts } = await chrome.storage.session.get("accounts");
    const { registered } = await chrome?.storage?.local.get("registered");

    if (accounts && registered) {
      navigate("/verify", {
        state: {
          lock: true,
        },
      });
      await chrome?.storage?.session.remove(["accounts", "password"]);
      store.dispatch(setAuth(false));
    }
    return setState("Idle");
  };

  const onActive = () => {
    setState("Active");
  };

  const onAction = () => {
    setCount(count + 1);
  };

  const { getRemainingTime } = useIdleTimer({
    onIdle,
    onActive,
    onAction,
    timeout: 300000,
    throttle: 500,
  });

  useEffect(() => {
    chrome.runtime.connect({ name: "popup" });
    const interval = setInterval(() => {
      setRemaining(Math.ceil(getRemainingTime() / 1000));
    }, 500);

    setInterval(async () => {
      const { autoLock } = await chrome.storage.local.get("autoLock");
      if (!autoLock) return;
      const { accounts } = await chrome.storage.session.get("accounts");
      const { registered } = await chrome.storage.local.get("registered");
      if (!accounts && registered) {
        navigate("/verify", {
          state: {
            lock: true,
          },
        });
        await chrome.storage.session.remove(["accounts", "password"]);
        store.dispatch(setAuth(false));
      }
    }, 700);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const port = chrome?.runtime?.connect({
    name: "Connection established.",
  });

  port?.postMessage("Hi BackGround");

  const { loading } = useSelector((state) => state);

  const [registered, setRegistered] = useState(null);
  const [expired, setExpired] = useState(true);
  const [defaultHomePage, setDefaultHomePage] = useState(false);
  const [goTo, setGoTo] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const init = async () => {
    const result = await chrome?.storage?.local.get("registered");
    if (!result.registered) return setRegistered(false);
    // const { password } = await chrome?.storage?.session.get("password");

    // if (password) {
    //   await WalletHelper.generateAndSetWalletToRefreshToken();
    // }

    const { accounts } = await chrome?.storage?.session.get("accounts");
    const { chains } = await chrome?.storage?.local.get("chains");
    const { currency } = await chrome?.storage?.local.get("currency");
    const { appTheme } = await chrome?.storage?.local.get("appTheme");
    const isSidePanelOpen = await chrome.storage.local.get("openSidePanel");

    const { defaultHomePage } = await chrome?.storage?.local.get(
      "defaultHomePage"
    );

    if (!isSidePanelOpen.openSidePanel) {
      chrome?.tabs.query(
        { currentWindow: true, active: true },
        function (tabs) {
          const goTo = tabs[0].url.split("#")[1];
          if (goTo === "add-wallet") {
            store.dispatch(setCreate(true));
            chrome?.tabs.update({ url: `${tabs[0].url.split("#")[0]}#` });
            setGoTo(true);
          }
        }
      );
    }

    if (appTheme) {
      if (appTheme === "darkTheme") {
        document.body.classList.remove("lightTheme");
        document.body.classList.add("darkTheme");
      } else {
        document.body.classList.remove("darkTheme");
        document.body.classList.add("lightTheme");
      }
    }

    store.dispatch(setTheme(appTheme || "lightTheme"));
    setDefaultHomePage(defaultHomePage || false);

    if (!accounts) {
      setExpired(true);
    } else {
      // if (accounts) {
        const defaultChain = chains.find((el) => el.default);
        if (!defaultChain) {
          await WalletHelper.setNetworkPreference(chains[0].chainId);
        }

        if (defaultHomePage) {
          await WalletHelper.setWalletPreference(defaultHomePage);
          const { accounts } = await chrome?.storage?.session.get("accounts");
          store.dispatch(setAccount(accounts.find((el) => el.default)));
        } else {
          store.dispatch(setAccount(accounts.find((el) => el.default)));
        }

        store.dispatch(setChain(defaultChain || chains[0]));
        store.dispatch(
          setCurrency({
            name: currency.name,
            symbol: currency.symbol,
          })
        );

        store.dispatch(setAuth());
        setExpired(false);
      // } else {
      //   setExpired(true);
      // }
    }

    return setRegistered(true);
  };

  useEffect(() => {
    init();
    // console.log('location',location?.pathname)
  }, [location]);

  const getSidePanelStatus = async () => {
    const isSidePanelOpen = await chrome.storage.local.get("openSidePanel");
    setIsSidePanelOpen(isSidePanelOpen.openSidePanel);
  };

  useEffect(() => {
    if (navigator.userAgentData) {
      const isMac = navigator.userAgentData.platform === "macOS";
      document.documentElement.classList.add(isMac ? "mac-os" : "non-mac-os");
    } else {
      // Fallback for older browsers
      const isMac = navigator.userAgent.toLowerCase().includes("mac");
      document.documentElement.classList.add(isMac ? "mac-os" : "non-mac-os");
    }

    getSidePanelStatus();
  }, [isSidePanelOpen]);

  if (registered === null) {
    return (
      <div
        className="App"
        style={
          !isSidePanelOpen
            ? {
                minWidth: "300px",
              }
            : {}
        }
      >
        <div className="loader-main">
          <img
            src={require("./Assets/main-logo.gif")}
            style={{
              width: "100px",
            }}
            alt=""
          />
          <ClipLoader size={30} color="#00adee" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="App"
      style={
        !isSidePanelOpen
          ? {
              minWidth: "400px",
            }
          : {}
      }
    >
      {loading ? <Loader /> : null}
      <Routes>
        <Route path="" element={<WelcomeLayout />}>
          <Route path="/add-wallet" element={<WelcomeScreen />} />
          <Route
            index
            path="/"
            element={
              registered ? (
                expired ? (
                  <Navigate to={"/verify"} />
                ) : (
                  <Navigate
                    to={
                      goTo
                        ? "/add-wallet"
                        : defaultHomePage
                        ? "/wallet"
                        : "/wallet"
                    }
                  />
                )
              ) : (
                <WelcomeScreen />
              )
            }
          />
          <Route path="/verify" element={<VerifyPassword />} />
          <Route path="/setPassword" element={<SetPasswordScreen />} />
          {/* <Route path="/wallet-name" element={<WalletName />} /> */}
          <Route path="/watch-list" element={<WatchWallet />} />
          <Route path="/address" element={<WatchAddress />} />
          <Route path="/watch-password" element={<WatchPassword />} />
          <Route path="/add-secret-phrase" element={<SecretPhrasePaste />} />
          <Route path="/createNewWallet" element={<CreateNewWallet />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/terms-policy" element={<TermsPolicy />} />
          <Route path="/secret-phrase" element={<SecretPhrase />} />
        </Route>

        <Route path="" element={<FixWidthLayout />}>
          <Route index path="/wallet" element={<Wallet />} />
          <Route path="/walletListing" element={<WalletListing />} />
          <Route path="/defi" element={<Defi />} />
          <Route path="/history" element={<History />} />
          <Route path="/securitySetting" element={<SecuritySetting />} />
          <Route path="/setting" element={<Setting />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route index path="/conectswapedApp" element={<ConnectedApp />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/dvpn" element={<DVpn />} />
          <Route path="/recentSessions" element={<RecentSessions />} />
          <Route path="/servers" element={<Servers />} />
          <Route path="/serversDetails" element={<ServersDetails />} />
          <Route path="/service-provider" element={<ServiceProvider />} />
          <Route path="/dvpnSetting" element={<DvpnSetting />} />
        </Route>

        {/* <Route path="/" element={<NftLayout />}>
          <Route index path="/nftDetail" element={<NftDetail />} />
          <Route index path="/nftAddress" element={<NftAddress />} />
          <Route index path="/nftConfirm" element={<ConfirmNft />} />
        </Route> */}
        <Route path="/" element={<OnlyContent />}>
          <Route path="/changePin" element={<ChangePin />} />
          <Route index path="/send" element={<Send />} />
          <Route path="/receive-tokens" element={<ReceiveTokens />} />
          <Route path="/receive-currency" element={<ReceiveCurrency />} />
          <Route path="/watch-list-tokens" element={<WatchList />} />
          <Route path="/add-watch-list" element={<AddWatchList />} />
          <Route path="/buy-coins" element={<BuyCoins />} />
          <Route path="/buy-sell" element={<BuySell />} />
          <Route index path="/sendCurrency" element={<SendCoins />} />
          <Route path="/import-phrase" element={<ImportPhrase />} />
          <Route path="/address-book" element={<AddresBook />} />
          <Route path="/networks" element={<NetworkPreference />} />
          <Route index path="/confirmCurrency" element={<SendConfirm />} />
          <Route index path="/manage" element={<Manage />} />
          <Route index path="/new-name" element={<NewName />} />
          <Route index path="/swap" element={<Swap />} />
          <Route index path="/swapDetails" element={<SwapDetails />} />
          <Route index path="/pancake-swap" element={<PancakeSwap />} />
          <Route index path="/exchangePancake" element={<ExchangePancake />} />
          <Route
            index
            path="/pancake-swapDetails"
            element={<PancakeSwapDetails />}
          />
          <Route
            index
            path="/crosschain-swapDetails"
            element={<CrossChainDetails />}
          />
          <Route index path="/currencyDetails" element={<CurrencyDetails />} />
          <Route index path="/add-token" element={<CustomToken />} />
          <Route index path="/add-contact" element={<AddContact />} />
          <Route index path="/price-alerts" element={<PriceAlerts />} />
          <Route index path="/add-pa" element={<AddPriceAlert />} />
          <Route index path="/add-network" element={<AddNetwork />} />
          <Route index path="/edit-network" element={<EditNetwork />} />
          <Route index path="/editWalletName" element={<EditWallet />} />
          <Route index path="/push-notification" element={<Notification />} />
          <Route index path="/add-alert" element={<AddPriceAlert />} />
          <Route index path="/enter-price" element={<EnterPrice />} />
          <Route index path="/new-watch-address" element={<NewAddress />} />
          <Route index path="/onlyCrossChain" element={<OnlyCrossChain />} />
          <Route index path="/watch-only-list" element={<WatchOnlyList />} />
          <Route
            index
            path="/transaction-filter"
            element={<TransactionFilter />}
          />
          <Route index path="/filter-history" element={<FilterHistory />} />
          <Route index path="/mybills" element={<MyBills />} />
          <Route index path="/creditcard" element={<CreditCard />} />
          <Route index path="/creditBillPay" element={<CreditBillPay />} />
          <Route index path="/billAddToken" element={<BillAddToken />} />
          <Route index path="/detail" element={<TransactionHistory />} />
          <Route index path="/nftDetail" element={<NftDetail />} />
          <Route index path="/nftManage" element={<NftManageWallet />} />
          <Route index path="/NftSend" element={<NftSend />} />
          <Route
            index
            path="/new-address-watch-only"
            element={<NewAddressWatchOnly />}
          />
          <Route
            index
            path="/showSecretPhrase"
            element={<ShowSecretPhrase />}
          />
          <Route
            index
            path="/multiShowSecretPhrase"
            element={<MultiShowSecretPhrase />}
          />
          <Route
            index
            path="/confirmMultiShowSecretPhrase"
            element={<ConfirmMultiShowSecretPhrase />}
          />
          <Route
            index
            path="/currencyPreference"
            element={<CurrencyPrefrence />}
          />
          <Route index path="/manage-wallet" element={<ManageWallet />} />
          {/*show-private-key */}
          <Route index path="/show-private-key" element={<ShowPrivateKey />} />
          <Route index path="/add-new-wallet" element={<AddNewWallet />} />
          <Route index path="/my-wallets" element={<MyWallets />} />
          <Route
            index
            path="/import-wallet-name"
            element={<SettingImportWallet />}
          />
          <Route
            index
            path="/import-wallet-private-key"
            element={<SettingImportWalletPrivatekey />}
          />
          <Route index path="/lock" element={<Lock />} />
          <Route
            index
            path="/account-preference"
            element={<AccountPreference />}
          />
          <Route
            index
            path="/select-coin"
            element={<SelectCoin />}
          />
          <Route
            index
            path="/chain-abstraction"
            element={<ChainAbstraction />}
          />
          {/* <Route
            index
            path="/chain-abstraction-detail"
            element={<ChainAbstractionDetail />}
          /> */}
          <Route
            index
            path="/external-receive"
            element={<ExternalReceive />}
          />
          <Route path="/accountDetails" element={<AccountDetails />} />
          <Route path="/dnsDetails" element={<DNSDetails />} />
          <Route path="/addCustomDNS" element={<AddCustomDNS />} />
          <Route path="/rpcDetails" element={<RPCDetails />} />
          <Route path="/accountTopUp" element={<AccountTopUp />} />
          <Route path="/serversNodes" element={<ServersNodes />} />
        </Route>
      </Routes>
      <ExternalConnection />
    </div>
  );
}

export default App;
