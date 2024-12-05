/*global chrome*/

import {
  Route,
  Routes,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import './App.scss';
import FixWidthLayout from './Layout/FixWidthLayout';
import OnlyContent from './Layout/OnlyContent';
import WelcomeLayout from './Layout/WelcomeLayout';
// import Buy from "./Pages/Buy/Buy";
import Defi from './Pages/Defi/Defi';
import History from './Pages/History/History';
import Send from './Pages/Send/Send';
import SendCoins from './Pages/Send/SendCoins/SendCoins';
import Setting from './Pages/Setting/Setting';
import Wallet from './Pages/Wallet/Wallet';
import SetPasswordScreen from './Pages/WelcomeScreens/SetPasswordScreen';
import WelcomeScreen from './Pages/WelcomeScreens/WelcomeScreen';
import ImportPhrase from './Pages/SecretPhrase/ImportPhrase';
import AddresBook from './Pages/AddresBook/AddresBook';
import Manage from './Pages/Manage/Manage';
import Swap from './Pages/Swap/Swap';
import SwapDetails from './Pages/Swap/SwapDetails/SwapDetails';
import CurrencyDetails from './Pages/Wallet/CurrencyDetails/CurrencyDetails';
import CustomTocken from './Pages/CustomTocken/CustomTocken';
import WalletName from './Pages/WelcomeScreens/WalletName';
import WatchWallet from './Pages/WelcomeScreens/WatchWallet';
import WatchAddress from './Pages/WelcomeScreens/WatchAddress';
import SecretPhrasePaste from './Pages/WelcomeScreens/SecretPhrasePaste';
import CreateNewWallet from './Pages/WelcomeScreens/CreateNewWallet';
import EditWallet from './Pages/EditWallet/EditWallet';
import ShowSecretPhrase from './Pages/showSecretPhrase/ShowSecretPhrase';
import CurrencyPrefrence from './Pages/CurrencyPrefrence/CurrencyPrefrence';

import ClipLoader from 'react-spinners/ClipLoader';
import { useEffect, useState } from 'react';
import VerifyPassword from './Pages/Password/Password';
import { store } from '.';
import { setAccount } from './actions/accounts';
import { setChain } from './actions/chains';
import ForgotPassword from './Pages/WelcomeScreens/ForgotPassword';
import { setCurrency } from './actions/currency';
import AddContact from './Pages/AddContact/CustomTocken';
import NetworkPreference from './Pages/NetworkPreference/NetworkPreference';
import AddNetwork from './Pages/AddNetwork/AddNetwork';
import { Loader } from './Components/Loader/Loader';
import { useSelector } from 'react-redux';
import { setTransactions } from './actions/transactions';
import { WalletHelper } from './helpers/wallet.helper';
import EditNetwork from './Pages/EditNetwork/EditNetwork';
import { setAuth } from './actions/auth';
import PancakeSwap from './Pages/PancakeSwap/PancakeSwap';
import PancakeSwapDetails from './Pages/PancakeSwap/SwapDetails/PancakeSwapDetails';
import { setPrices } from './actions/prices';
import CrossChainDetails from './Pages/CrossChain/SwapDetails/CrossChainDetials';
import AccountPreference from './Pages/AccountPrefrence/NetworkPreference';
import MultiShowSecretPhrase from './Pages/multiShowSecretPhrase/MultiShowSecretPhrase';
import ConfirmMultiShowSecretPhrase from './Pages/confirmMultiShowSecretPhrase copy/ConfirmMultiShowSecretPhrase';
import AddPriceAlert from './Pages/AddPriceAlert/AddPriceAlert';
import PriceAlerts from './Pages/PriceAlert/PriceAlert';
import NewName from './Pages/NewName/NewName';
import { setAlerts } from './actions/alerts';
import EnterPrice from './Pages/Buy/EnterPrice/EnterPrice';
import WatchPassword from './Pages/WelcomeScreens/WatchPassword';
import NewAddress from './Pages/NewAddress/NewAddress';
import OnlyCrossChain from './Pages/OnlyCrossChain/PancakeSwap';
import { ExternalConnection } from './Pages/ExternalConnections/ExternalConnections';
import WatchOnlyList from './Pages/WatchOnlyList/NetworkPreference';
import NewAddressWatchOnly from './Pages/NewAddressWatchOnly/NewAddress';
import { message } from 'antd';
import TransactionFilter from './Pages/TransactionFilter/TransactionFilter';
import ReceiveTokens from './Pages/ReceiveCoins/Receive';
import Alerts from './Pages/Alerts/Alerts';
import Notification from './Pages/PushNotification/Notification';
import WalletListing from './Pages/WalletListing/WalletListing';
import BuyCoins from './Pages/BuyCoins/BuyCoins';
import HistryList from './Components/HistryList/HistryList';
import FilterHistory from './Pages/History/FilterHistory';
import TransactionHistory from './Pages/History/TransactionHistory/TransactionHistory';
import { setTheme } from './actions/theme';
import { setBalanceOfOut, setBalancesIn } from './actions/balance-off-out';
import ChangePin from './Pages/ChangePin/ChangePin';
import { setCreate } from './actions/create';
import useCurrentHeight from './CustomHooks/useCurrentHeight';
import { useIdleTimer } from 'react-idle-timer';
import NftDetail from './Pages/Nft/NftDetail';
import NftLayout from './Layout/NftLayout';
import NftAddress from './Pages/Nft/NftAddress';
import ConfirmNft from './Pages/Nft/ConfirmNft';
import Lock from './Pages/Lock/Lock';
import EmailAddress from './Pages/EmailAddress/EmailAddress';
import ApiKey from './Pages/ApiKey/ApiKey';
import Kyc from './Pages/Kyc/Kyc';
import BankAccount from './Pages/BankAccount/BankAccount';
import Withdraw from './Pages/Withdraw/Withdraw';
import { spritzHelper } from './helpers/spritz.helper';
import { spritzAccounts, spritzKyc, spritzLogin } from './actions/spritz';
import SpritzTokens from './Pages/SpritzCoins/SpritzCoins';
import EnterPriceSpritz from './Pages/SpritzCoins/EnterPriceSpritz/EnterPriceSpritz';
import SendConfirmSpritz from './Pages/SpritzCoins/SendConfirmSpritz/SendConfirmSpritz';
import SendConfirm from './Pages/Send/SendConfirm/SendConfirm';
import EditBankAccount from './Pages/EditbankAccount/EditBankAccount';
import HistorySpritz from './Pages/SpritzHistory/History';
import TransactionHistorySpritz from './Pages/SpritzHistory/TransactionHistory/TransactionHistory';
import FilterHistorySpritz from './Pages/SpritzHistory/FilterHistory';
import ConnectedApp from './Pages/ConnectedApp/ConnectedApp';
import ExchangePancake from './Pages/ConnectedApp/ExchangePancake';
import BankAccountListing from './Pages/BankAccount/BankAccountListing';
import BillBankAccount from './Pages/BillPay/BillBankAccount';
import MyBills from './Pages/BillPay/MyBills';
import CreditCard from './Pages/BillPay/CreditCard';
import CreditBillPay from './Pages/BillPay/CreditBillPay';
import BillAddToken from './Pages/BillPay/BillAddToken';
import BillPayHistorySpritz from './Pages/BillPay/BillPayHistory/BillPayHistory';
import BillPayFilterHistorySpritz from './Pages/BillPay/BillPayHistory/BillPayFilterHistory';
import BillPayTransactionHistory from './Pages/BillPay/BillPayHistory/TransactionHistory/BillPayTransactionHistory';
import Legal from './Pages/Legal/Legal';
import EditBill from './Pages/EditBill/EditBill';

function App() {
  const [state, setState] = useState('Active');
  const [count, setCount] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const navigate = useNavigate();

  const onIdle = async () => {
    const { password } = await chrome?.storage?.session.get('password');
    const { registered } = await chrome?.storage?.local.get('registered');

    if (password && registered) {
      navigate('/verify', {
        state: {
          lock: true,
        },
      });
      await chrome?.storage?.session.remove(['accounts', 'password']);
      store.dispatch(setAuth(false));
    }
    return setState('Idle');
  };

  const onActive = () => {
    setState('Active');
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
    chrome.runtime.connect({ name: 'popup' });
    const interval = setInterval(() => {
      setRemaining(Math.ceil(getRemainingTime() / 1000));
    }, 500);

    setInterval(async () => {
      const { password } = await chrome.storage.session.get('password');
      const { registered } = await chrome.storage.local.get('registered');
      if (!password && registered) {
        navigate('/verify', {
          state: {
            lock: true,
          },
        });
        await chrome.storage.session.remove(['accounts', 'password']);
        store.dispatch(setAuth(false));
      }
    }, 700);

    return () => {
      clearInterval(interval);
    };
  }, []);
  // console.log("helooooooooooooooo");

  const port = chrome?.runtime?.connect({
    name: 'Connection established.',
  });
  // console.log("helooooooooooooooo33");

  port?.postMessage('Hi BackGround');
  port?.onMessage?.addListener(async (msg) => {
    if (msg === 'ALERTS_UPDATED') {
      const { alerts } = await chrome?.storage?.local.get('alerts');
      store.dispatch(setAlerts(alerts));
    }
  });
  const { loading, updateSpritz } = useSelector((state) => state);

  const [registered, setRegistered] = useState(null);
  const [expired, setExpired] = useState(true);
  const [defaultHomePage, setDefaultHomePage] = useState(false);
  const [goTo, setGoTo] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const init = async () => {
    const result = await chrome?.storage?.local.get('registered');
    if (!result.registered) return setRegistered(false);
    const { password } = await chrome?.storage?.session.get('password');

    if (password) {
      await WalletHelper.generateAndSetWalletToRefreshToken();
    }

    const { accounts } = await chrome?.storage?.session.get('accounts');
    const { chains } = await chrome?.storage?.local.get('chains');
    const { currency } = await chrome?.storage?.local.get('currency');
    const { alerts } = await chrome?.storage?.local.get('alerts');
    const { appTheme } = await chrome?.storage?.local.get('appTheme');
    const { balanceOut } = await chrome?.storage?.local.get('balanceOut');
    const { spritzApiKey } = await chrome?.storage?.session.get('spritzApiKey');
    const isSidePanelOpen = await chrome.storage.local.get('openSidePanel');
    console.log('🚀 ~ init ~ isSidePanelOpen:', isSidePanelOpen);

    const { defaultHomePage } = await chrome?.storage?.local.get(
      'defaultHomePage'
    );

    if (!isSidePanelOpen.openSidePanel) {
      chrome?.tabs.query(
        { currentWindow: true, active: true },
        function (tabs) {
          const goTo = tabs[0].url.split('#')[1];
          if (goTo === 'add-wallet') {
            store.dispatch(setCreate(true));
            chrome?.tabs.update({ url: `${tabs[0].url.split('#')[0]}#` });
            setGoTo(true);
          }
        }
      );
    }

    store.dispatch(setBalanceOfOut(balanceOut === false ? false : true));

    if (appTheme) {
      if (appTheme === 'darkTheme') {
        document.body.classList.remove('lightTheme');
        document.body.classList.add('darkTheme');
      } else {
        document.body.classList.remove('darkTheme');
        document.body.classList.add('lightTheme');
      }
    }

    store.dispatch(setTheme(appTheme || 'lightTheme'));
    setDefaultHomePage(defaultHomePage || false);

    if (!password) {
      setExpired(true);
    } else {
      if (accounts) {
        const defaultAccount = accounts.find((el) => el.default);
        store.dispatch(
          setBalancesIn(
            defaultAccount?.balanceIn !== null ||
              defaultAccount?.balanceIn !== undefined
              ? defaultAccount?.balanceIn === false
                ? false
                : true
              : true
          )
        );

        const defaultChain = chains.find((el) => el.default);
        if (!defaultChain) {
          await WalletHelper.setNetworkPreference(chains[0].chainId);
        }

        if (defaultHomePage) {
          await WalletHelper.setWalletPreference(defaultHomePage);
          const { accounts } = await chrome?.storage?.session.get('accounts');
          store.dispatch(setAccount(accounts.find((el) => el.default)));
        } else {
          store.dispatch(setAccount(accounts.find((el) => el.default)));
        }

        store.dispatch(setAlerts(alerts));
        store.dispatch(setChain(defaultChain || chains[0]));
        store.dispatch(
          setCurrency({
            name: currency.name,
            symbol: currency.symbol,
          })
        );
        if (spritzApiKey) {
          await spritzHelper.setApiKey(spritzApiKey);
          const user = await spritzHelper.getUser();
          if (user) {
            store.dispatch(spritzLogin(user));
            const verificationData = await spritzHelper.getVerification();
            const bankAccounts = await spritzHelper.getBankAccounts();
            if (verificationData) {
              store.dispatch(spritzKyc(verificationData.identity));
            }
            if (bankAccounts) {
              store.dispatch(spritzAccounts(bankAccounts));
            }
          }
        }
        store.dispatch(setAuth());
        setExpired(false);
      } else {
        setExpired(true);
      }
    }

    return setRegistered(true);
  };

  useEffect(() => {
    init();
  }, [updateSpritz]);

  //

  const getSidePanelStatus = async () => {
    const isSidePanelOpen = await chrome.storage.local.get('openSidePanel');
    setIsSidePanelOpen(isSidePanelOpen.openSidePanel);
  };

  useEffect(() => {
    getSidePanelStatus();
  }, [isSidePanelOpen]);

  if (registered === null) {
    return (
      <div
        className='App'
        style={
          !isSidePanelOpen
            ? {
                minWidth: '439px',
              }
            : {}
        }
      >
        <div className='loader-main'>
          <img
            src={require('./Assets/Logo.png')}
            style={{
              width: '100px',
            }}
            alt=''
          />
          <ClipLoader size={30} color='#00adee' />
        </div>
      </div>
    );
  }

  return (
    <div
      className='App'
      style={
        !isSidePanelOpen
          ? {
              minWidth: '439px',
            }
          : {}
      }
    >
      {loading ? <Loader /> : null}
      <Routes>
        <Route path='' element={<WelcomeLayout />}>
          <Route path='/add-wallet' element={<WelcomeScreen />} />
          <Route
            index
            path='/'
            element={
              registered ? (
                expired ? (
                  <Navigate to={'/verify'} />
                ) : (
                  <Navigate
                    to={
                      goTo
                        ? '/add-wallet'
                        : defaultHomePage
                        ? '/wallet'
                        : '/walletListing'
                    }
                  />
                )
              ) : (
                <WelcomeScreen />
              )
            }
          />
          <Route path='/verify' element={<VerifyPassword />} />
          <Route path='/setPassword' element={<SetPasswordScreen />} />
          {/* <Route path="/wallet-name" element={<WalletName />} /> */}
          <Route path='/watch-list' element={<WatchWallet />} />
          <Route path='/address' element={<WatchAddress />} />
          <Route path='/watch-password' element={<WatchPassword />} />
          <Route path='/add-secret-phrase' element={<SecretPhrasePaste />} />
          <Route path='/createNewWallet' element={<CreateNewWallet />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
        </Route>

        <Route path='' element={<FixWidthLayout />}>
          <Route index path='/wallet' element={<Wallet />} />
          <Route path='/walletListing' element={<WalletListing />} />
          <Route path='/defi' element={<Defi />} />
          <Route path='/history' element={<History />} />
          <Route path='/changePin' element={<ChangePin />} />
          <Route path='/setting' element={<Setting />} />
          <Route path='/alerts' element={<Alerts />} />
          <Route path='/emailAddress' element={<EmailAddress />} />
          <Route path='/apiKey' element={<ApiKey />} />
          <Route path='/kyc' element={<Kyc />} />
          <Route path='/bankAccount' element={<BankAccount />} />
          <Route index path='/billbankaccount' element={<BillBankAccount />} />
          <Route path='/editBankAccount' element={<EditBankAccount />} />
          <Route index path='/editBill' element={<EditBill />} />
          <Route path='/withdraw' element={<Withdraw />} />
          <Route path='/bankAccountListing' element={<BankAccountListing />} />
          <Route path='/history-spritz' element={<HistorySpritz />} />
          <Route
            path='/billPay-history-spritz'
            element={<BillPayHistorySpritz />}
          />
          <Route path='/detail-spritz' element={<TransactionHistorySpritz />} />
          <Route
            path='/detail-billPay-spritz'
            element={<BillPayTransactionHistory />}
          />
          <Route path='/filter-spritz' element={<FilterHistorySpritz />} />
          <Route
            path='/billpay-filter-spritz'
            element={<BillPayFilterHistorySpritz />}
          />
          <Route index path='/conectswapedApp' element={<ConnectedApp />} />
        </Route>

        <Route path='/' element={<NftLayout />}>
          <Route index path='/nftDetail' element={<NftDetail />} />
          <Route index path='/nftAddress' element={<NftAddress />} />
          <Route index path='/nftConfirm' element={<ConfirmNft />} />
        </Route>
        <Route path='/' element={<OnlyContent />}>
          <Route index path='/send' element={<Send />} />
          <Route path='/receive-tokens' element={<ReceiveTokens />} />
          <Route path='/spritz-tokens' element={<SpritzTokens />} />
          <Route path='/buy-coins' element={<BuyCoins />} />

          <Route index path='/sendCurrency' element={<SendCoins />} />
          <Route path='/import-phrase' element={<ImportPhrase />} />
          <Route path='/address-book' element={<AddresBook />} />
          <Route index path='/legal' element={<Legal />} />
          <Route path='/networks' element={<NetworkPreference />} />
          <Route index path='/confirmCurrency' element={<SendConfirm />} />
          <Route
            index
            path='/confirmCurrencySpritz'
            element={<SendConfirmSpritz />}
          />
          <Route index path='/manage' element={<Manage />} />
          {/* <Route index path="/buy" element={<Buy />} /> */}
          <Route index path='/new-name' element={<NewName />} />
          <Route index path='/swap' element={<Swap />} />
          <Route index path='/swapDetails' element={<SwapDetails />} />
          <Route index path='/pancake-swap' element={<PancakeSwap />} />
          <Route index path='/exchangePancake' element={<ExchangePancake />} />
          <Route
            index
            path='/pancake-swapDetails'
            element={<PancakeSwapDetails />}
          />
          <Route
            index
            path='/crosschain-swapDetails'
            element={<CrossChainDetails />}
          />
          <Route index path='/currencyDetails' element={<CurrencyDetails />} />
          <Route index path='/add-token' element={<CustomTocken />} />
          <Route index path='/add-contact' element={<AddContact />} />
          <Route index path='/price-alerts' element={<PriceAlerts />} />
          <Route index path='/add-pa' element={<AddPriceAlert />} />
          <Route index path='/add-network' element={<AddNetwork />} />
          <Route index path='/edit-network' element={<EditNetwork />} />
          <Route index path='/editWalletName' element={<EditWallet />} />
          <Route index path='/push-notification' element={<Notification />} />
          <Route index path='/add-alert' element={<AddPriceAlert />} />
          <Route index path='/enter-price' element={<EnterPrice />} />
          <Route
            index
            path='/enter-price-spritz'
            element={<EnterPriceSpritz />}
          />
          <Route index path='/new-watch-address' element={<NewAddress />} />
          <Route index path='/onlyCrossChain' element={<OnlyCrossChain />} />
          <Route index path='/watch-only-list' element={<WatchOnlyList />} />
          <Route
            index
            path='/transaction-filter'
            element={<TransactionFilter />}
          />
          <Route index path='/filter-history' element={<FilterHistory />} />
          <Route index path='/mybills' element={<MyBills />} />
          <Route index path='/creditcard' element={<CreditCard />} />
          <Route index path='/creditBillPay' element={<CreditBillPay />} />
          <Route index path='/billAddToken' element={<BillAddToken />} />
          <Route index path='/detail' element={<TransactionHistory />} />
          <Route
            index
            path='/new-address-watch-only'
            element={<NewAddressWatchOnly />}
          />
          <Route
            index
            path='/showSecretPhrase'
            element={<ShowSecretPhrase />}
          />
          <Route
            index
            path='/multiShowSecretPhrase'
            element={<MultiShowSecretPhrase />}
          />
          <Route
            index
            path='/confirmMultiShowSecretPhrase'
            element={<ConfirmMultiShowSecretPhrase />}
          />
          <Route
            index
            path='/currencyPreference'
            element={<CurrencyPrefrence />}
          />
          <Route index path='/lock' element={<Lock />} />
          <Route
            index
            path='/account-preference'
            element={<AccountPreference />}
          />
        </Route>
      </Routes>

      <ExternalConnection />
    </div>
  );
}

export default App;
