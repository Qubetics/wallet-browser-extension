/*global chrome*/
import "./CrossChain.scss";
import { Drawer, message, Select } from "antd";
import InputFieldSimple, {
  InputField,
} from "../../Components/InputField/InputFieldSimple";
import DownArrowSuffix from "../../Assets/DownArrowSuffix.svg";
import SwapVerticalIcon from "../../Assets/SwapVerticalIcon.svg";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Web3Helper } from "../../helpers/web3.helper";
import darkclose from "../../Assets/darkclose.svg";
import { useSelector } from "react-redux";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { useRef } from "react";
import { CrossChainHelper } from "../../helpers/crosschain.helper";
import ModalCloseIcon from "../../Assets/ModalCloseIcon.svg";
import Search from "../../Assets/SearchIcon.svg";
import { BTCHelper } from "../../helpers/btc.helper";
import { getRpcUrl } from "../../helpers/rpcService";
import { DURATION } from "../../config/message.config";
import {
  exponential_to_decimal,
  newBalanceToFiatConversion,
  toFixed,
} from "../../helpers/conversion.helper";
import { server } from "../../server";
import { swapDetailAc } from "../../actions/swap";
import useCurrentHeight from "../../CustomHooks/useCurrentHeight";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import ConfirmAbstractModal from "./chainabstractionconfirmmodal";
import { WalletHelper } from "../../helpers/wallet.helper";
import ModalCustom from "../../Components/ModalCustom/ModalCustom";
import BigNumber from "bignumber.js";
import AbstractProcessingModal from "../../Components/CustomModelAbstraction/Model";
import MpcModel from "../../Components/MPCModel/MpcModel";
import {
  getStoredMpcAddresses,
  getMpcWallets,
  checkLiquidityAvailability,
} from "../../helpers/mpc.helper";
import { MpcChainAbstractionHelper } from "../../helpers/chain_abstraction.helperMPC";
import PasteIcon from "../../Assets/paste-svgrepo-com.svg";
import Abstract from "../../Assets/swapI.png";
import axios from "axios";

const CHAIN_ABSTRACTION_PRICE_URL = `${process.env.REACT_APP_CHAIN_ABSTRACTION_MIN_API_URL}/api/v1/cryptos/prices?symbols=BTC,TICS`;
const SATOSHI_600_IN_BTC = 0.000006; // 600 sats
const CHAIN_ABSTRACTION_SWAP_SOURCE = "chain_abstraction";

const INITIAL_MIN_MAX_SWAP_AMOUNT = {
  7: {
    min: 25,
    max: 1000,
  },
  3: {
    min: 0.000006, // 600 sats
    max: 0.001,
  }
};

function getFlooredFixed(v, d) {
  return (Math.floor(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
}

// Remove trailing zeros from decimal numbers (only after decimal point)
function removeTrailingZeros(value) {
  if (value === null || value === undefined || value === '') return '';
  const str = String(value);
  // Only remove trailing zeros after the decimal point, preserve integer part
  if (str.includes('.')) {
    return str.replace(/\.?0+$/, '');
  }
  return str;
}

function addCommasToNumber(number) {
  var parts = number.toString().split(".");
  var integerPart = parts[0];
  var decimalPart = parts[1] || "";
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (decimalPart !== "") {
    return integerPart + "." + decimalPart;
  } else {
    return integerPart;
  }
}

// Validate swap amount based on coin family (limits can be dynamic from state)
function validateSwapAmount(amount, coinFamily, limitsMap = null) {
  const limits = (limitsMap || INITIAL_MIN_MAX_SWAP_AMOUNT)[coinFamily];
  if (!limits) {
    return { valid: true, message: "" };
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) {
    return { valid: false, message: "Please enter a valid amount" };
  }

  if (numAmount < limits.min) {
    return {
      valid: false,
      message: `Minimum amount is ${limits.min} ${coinFamily === 7 ? "TICS" : "BTC"}`,
    };
  }

  if (numAmount > limits.max) {
    return {
      valid: false,
      message: `Maximum amount is ${limits.max} ${coinFamily === 7 ? "TICS" : "BTC"}`,
    };
  }

  return { valid: true, message: "" };
}

// Get limits text for display (limits can be dynamic from state)
function getLimitsText(coinFamily, limitsMap = null) {
  const limits = (limitsMap || INITIAL_MIN_MAX_SWAP_AMOUNT)[coinFamily];
  if (!limits) return "";

  const symbol = coinFamily === 7 ? "TICS" : "BTC";
  return `Min: ${limits.min} ${symbol}, Max: ${limits.max} ${symbol}`;
}

export function bigNumberSafeMath(a, operation, b) {
  try {
    const numA = new BigNumber(a || 0);
    const numB = new BigNumber(b || 0);

    switch (operation) {
      case "+":
        return numA.plus(numB);
      case "-":
        return numA.minus(numB);
      case "*":
        return numA.times(numB);
      case "/":
        return numB.isZero() ? new BigNumber(0) : numA.dividedBy(numB);
      case "%":
        return numB.isZero() ? new BigNumber(0) : numA.modulo(numB);
      default:
        return numA;
    }
  } catch (error) {
    // console.error("bigNumberSafeMath error:", error);
    return new BigNumber(0);
  }
}

function ChainAbstraction({ state }) {
  const parentRef = useRef(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectDrawer, setTokenDrawer] = useState(false);
  const { chain, account, currency } = useSelector((state) => state);
  const chainAbstractionTokenKeys = {
    from: `chainAbstractionToken1_${account?.address || "unknown"}`,
    to: `chainAbstractionToken2_${account?.address || "unknown"}`,
  };
  let timeOutId = useRef();
  const crossChainHelper = useRef(new CrossChainHelper());
  const [availableTokens, setAvailableTokens] = useState([]);
  const [loading, setCompentLoading] = useState(false);
  const [token1, setToken1] = useState(null);
  const [token2, setToken2] = useState(null);
  const [balance, setBalance] = useState(0);
  const [receivedBalance, setReceivedBalance] = useState(0);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
    maxCount: 1,
  });
  const [toAddress, setToAddress] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [amount, setWithdrawAmount] = useState("");
  const [route, setRoute] = useState(null);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [selected, setSelected] = useState(null);
  const height = useCurrentHeight();
  const [allToken, setAllTokens] = useState([]);
  const [keyword, setKeyword] = useState(null);
  const [show, setShow] = useState(true);
  const updateRef = useRef(true);
  const [percent, setPercent] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionPassword, setSessionPassword] = useState(null);
  const [isPasswordModalOpen, setPasswordModal] = useState(false);
  const [showsuccess, setShowSuccess] = useState(false);
  const { theme, swapDetail } = useSelector((state) => state);
  const debounceTimeout = useRef(null);
  // const ChainAbstractionInstance = useRef(
  //   new ChainAbstractionHelper(chain.chainId)
  // );
  const mpcHelper = new MpcChainAbstractionHelper(chain.chainId);
  const [isProcessModalOpen, setIsProcessModal] = useState(false);
  const [isWaitingForIntentDetails, setIsWaitingForIntentDetails] = useState(false);
  const [transactionresult, setTransactionResult] = useState({
    hash: "",
    fee: "",
    link: "",
    status: "",
    symbol: "",
    solver: "",
    source_address: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMpcModel, setShowMpcModel] = useState(false);
  const [mpcAddresses, setMpcAddresses] = useState(null);
  const [mpcFromAddress, setMpcFromAddress] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [platformFee, setPlatformFee] = useState(1.5); // Default to 1.5% from API
  const [solverFee, setSolverFee] = useState(1.5); // Default to 1.5% from API
  const [networkFee, setNetworkFee] = useState(0); // Store calculated network fee
  const networkFeeRef = useRef(0); // Use ref to persist network fee across renders
  const [minMaxSwapAmount, setMinMaxSwapAmount] = useState(INITIAL_MIN_MAX_SWAP_AMOUNT);
  const [mpcWalletsData, setMpcWalletsData] = useState(null); // Cache MPC wallets data
  const [chainAbstractionFiatPrices, setChainAbstractionFiatPrices] = useState({
    BTC: 0,
    TICS: 0,
  });
  const baseInfoCacheRef = useRef(new Map()); // Cache for getBaseInfo responses by token pair
  const chainAbstractionSwapDetail =
    swapDetail?.source === CHAIN_ABSTRACTION_SWAP_SOURCE ? swapDetail : null;

  const getFiatValueForCoin = async () => {
    try {
      const response = await fetch(CHAIN_ABSTRACTION_PRICE_URL);
      const data = await response.json();
      const prices = data?.data;
      if (prices?.BTC != null && prices?.TICS != null && Number(prices.TICS) > 0) {
        const btcPrice = Number(prices.BTC);
        const ticsPrice = Number(prices.TICS);
        setChainAbstractionFiatPrices({
          BTC: btcPrice,
          TICS: ticsPrice,
        });
        const ticsEquivalentTo600Satoshi = (SATOSHI_600_IN_BTC * btcPrice) / ticsPrice;
        const minTics = Math.ceil(Number(Number(ticsEquivalentTo600Satoshi).toFixed(8)) || 25);
        setMinMaxSwapAmount((prev) => ({
          ...prev,
          7: { ...prev[7], min: Math.max(minTics, 1) },
        }));
      }
    } catch (e) {
      // keep initial TICS min on error
    }
  };

  useEffect(() => {
    getFiatValueForCoin();
  }, []);

  const onChangeFromValue = (val) => {
    setWithdrawAmount(val);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // If value is empty or null, clear received amount immediately
    if (!val || val === "" || val === "0") {
      setReceivedAmount("");
      return;
    }
    
    debounceTimeout.current = setTimeout(() => {
      // For same-coin transfers (same chain), received amount equals entered amount (no slippage)
      if (token1?.id === token2?.id) {
        const toAmt = parseFloat(val || 0);
        setReceivedAmount(getFlooredFixed(toAmt, 8));
      } else {
        // For chain abstraction (different coins), calculate based on fiat prices
        const fromFiatValue = token1?.price;
        const toFiatValue = token2?.price;

        const toValue = new BigNumber(val || 0)
          .times(new BigNumber(fromFiatValue || 0))
          .dividedBy(new BigNumber(toFiatValue || 0));

        const toAmt = exponential_to_decimal(toValue, 8);
        setReceivedAmount(getFlooredFixed(toAmt, 8));
      }
    }, 800);
  };

  const getTokenMeta = (coinFamily) => {
    switch (coinFamily) {
      case 7:
        return {
          coinFamilyName: "TICS",
          tokenType: "ERC20",
          rpc: getRpcUrl('REACT_APP_QUBETIC_RPC'),
        };
      case 3:
        return {
          coinFamilyName: "BTC",
          tokenType: null,
          rpc: getRpcUrl('REACT_APP_BTC_RPC'),
        };
      default:
        return { coinFamilyName: "ETH", tokenType: "ERC20", rpc: "" };
    }
  };

  const buildTokenObject = (token, chains, account, mpcAddresses) => {
    const { coinFamilyName, tokenType, rpc } = getTokenMeta(token?.coin_family);
    const fallbackFiatPrice =
      token?.coin_family === 3
        ? chainAbstractionFiatPrices.BTC
        : token?.coin_family === 7
        ? chainAbstractionFiatPrices.TICS
        : 0;

    // Determine which address to use based on coin family
    let addressToUse;
    if (token?.coin_family === 3) {
      // Bitcoin - use MPC BTC address
      // Check both numeric and string keys
      addressToUse =
        mpcAddresses?.btc || 
        account?.coinFamilyAndAddress?.[token?.coin_family] || 
        account?.coinFamilyAndAddress?.["3"];
    } else if (token?.coin_family === 2 || token?.coin_family === 7) {
      // EVM chains - use MPC ETH address
      // Check both numeric and string keys
      const coinFamilyKey = token?.coin_family;
      addressToUse =
        mpcAddresses?.eth || 
        account?.coinFamilyAndAddress?.[coinFamilyKey] || 
        account?.coinFamilyAndAddress?.[String(coinFamilyKey)];
    } else {
      // Fallback to original address - check both numeric and string keys
      const coinFamilyKey = token?.coin_family;
      addressToUse = 
        account?.coinFamilyAndAddress?.[coinFamilyKey] || 
        account?.coinFamilyAndAddress?.[String(coinFamilyKey)];
    }

    return {
      id: token?.coin_id,
      symbol: token?.coin_symbol,
      showName: token?.coin_name,
      coinSymbol: token?.coin_symbol,
      active: true,
      iHave: !!token?.wallet_data,
      name: token?.coin_name,
      tokenAddress: token?.token_address || null,
      image: token?.coin_image,
      address: addressToUse, // Use MPC address
      isToken: !!token?.token_address,
      coinFamilyName,
      coinFamily: token?.coin_family,
      balance: token?.wallet_data?.balance || 0,
      price: token?.fiat_price_data?.value || fallbackFiatPrice || 0,
      type: token?.token_address ? tokenType : null,
      chain: chains.find((chain) => chain?.coinFamily == token?.coin_family),
      native: token?.fiat_price_data,
      decimals: parseInt(token?.coinDecimal ?? 10),
      rpc,
    };
  };

  // Fetch MPC balance for a token (uses cached mpcWalletsData)
  const fetchMpcBalance = (token, mpcAddresses) => {
    try {
      if (!token || !account) {
        return 0;
      }

      const coinFamily = token?.coinFamily || token?.coin_family;
      
      // Use cached MPC wallets data instead of calling API
      if (!mpcWalletsData) {
        // If cache is not available, return 0 (will be updated when cache is ready)
        return 0;
      }

      // Handle both array and single object responses
      let mpcWalletData;
      if (Array.isArray(mpcWalletsData)) {
        // Filter all wallets matching the coin family and get the last one
        const matchingWallets = mpcWalletsData.filter(
          (wallet) => wallet?.coin_family === coinFamily
        );
        // Get the last entry (most recent) for this coin family
        mpcWalletData = matchingWallets.length > 0 
          ? matchingWallets[matchingWallets.length - 1] 
          : null;
      } else {
        // Single object response
        if (mpcWalletsData?.coin_family === coinFamily) {
          mpcWalletData = mpcWalletsData;
        }
      }
      
      if (!mpcWalletData) {
        return 0;
      }

      // Extract balance from cached data
      const balance = mpcWalletData?.balance || 0;
      
      return parseFloat(balance) || 0;

    } catch (error) {
      console.error("Error fetching MPC balance from cache:", error);
      return 0;
    }
  };

  // Fetch fees from API
  const fetchFees = async () => {
    try {
      const response = await axios.get(process.env.REACT_APP_CHAIN_ABSTRACTION_FEE);
      if (response?.data?.error === false && response?.data?.data) {
        setPlatformFee(response.data.data.platform || 1.5);
        setSolverFee(response.data.data.solver || 1.5);
        // console.log("Fees fetched:", {
        //   platform: response.data.data.platform,
        //   solver: response.data.data.solver
        // });
      }
    } catch (error) {
      // console.error("Error fetching fees:", error);
      // Keep default values (1.5%)
    }
  };

  // Cached version of getQuoteAndRoute to avoid multiple getBaseInfo calls
  const getCachedQuoteAndRoute = async (fromCoinId, toCoinId, amount) => {
    const cacheKey = `${fromCoinId}_${toCoinId}`;
    
    // Check cache first
    if (baseInfoCacheRef.current.has(cacheKey)) {
      const cachedData = baseInfoCacheRef.current.get(cacheKey);
      const exchangeRate = cachedData;
      
      if (exchangeRate?.instantRate == 0) {
        return false;
      }
      
      let instantRate = exchangeRate?.instantRate;
      let receiveCoinFee = exchangeRate?.receiveCoinFee;
      let convertedAmount = amount * instantRate;
      convertedAmount = (convertedAmount * 99.7) / 100;
      convertedAmount = convertedAmount - receiveCoinFee;
      convertedAmount = convertedAmount <= 0 ? 0 : convertedAmount;
      
      return {
        pair: [fromCoinId, toCoinId],
        outAmount: convertedAmount,
        exchangeData: exchangeRate,
      };
    }
    
    // If not in cache, call the API and cache the result
    try {
      const { account } = store.getState();
      const response = await server.post(
        '/swftc/getBaseInfo',
        {
          depositCoinCode: fromCoinId,
          receiveCoinCode: toCoinId,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      
      const exchangeRate = response?.data?.data?.data;
      
      // Cache the response
      if (exchangeRate) {
        baseInfoCacheRef.current.set(cacheKey, exchangeRate);
      }
      
      if (exchangeRate?.instantRate == 0) {
        return false;
      }
      
      let instantRate = exchangeRate?.instantRate;
      let receiveCoinFee = exchangeRate?.receiveCoinFee;
      let convertedAmount = amount * instantRate;
      convertedAmount = (convertedAmount * 99.7) / 100;
      convertedAmount = convertedAmount - receiveCoinFee;
      convertedAmount = convertedAmount <= 0 ? 0 : convertedAmount;
      
      return {
        pair: [fromCoinId, toCoinId],
        outAmount: convertedAmount,
        exchangeData: exchangeRate,
      };
    } catch (error) {
      return false;
    }
  };

  const init = async () => {
    try {
      // Check if account exists
      if (!account) {
        setCompentLoading(false);
        setIsInitialLoading(false);
        return;
      }

      await fetchFees();
      
      const storedMpc = await getStoredMpcAddresses();
      setMpcAddresses(storedMpc);

      // Fetch MPC wallets data once on page load and cache it
      if (account?.address && account?.jwtToken) {
        try {
          const walletData = await getMpcWallets(account.address, 1);
          setMpcWalletsData(walletData);
        } catch (error) {
          console.log("Error fetching MPC wallets data:", error);
          // Continue even if this fails
        }
      }

      const addressList = [];

      if (account?.coinFamilyAndAddress && typeof account.coinFamilyAndAddress === 'object') {
        Object.values(account.coinFamilyAndAddress)
          .filter(Boolean)
          .forEach((addr) => {
            addressList.push(addr);
          });
      }

      // Always add MPC addresses if they exist
      if (storedMpc?.eth) {
        addressList.push(storedMpc.eth);
      }
      if (storedMpc?.btc) {
        addressList.push(storedMpc.btc);
      }

      // Fallback: Ensure BTC address is included even if MPC BTC address is missing
      // This ensures the API returns BTC tokens
      // Check both numeric and string keys for BTC address (coinFamily 3)
      if (!storedMpc?.btc) {
        const btcAddress = account?.coinFamilyAndAddress?.[3] || account?.coinFamilyAndAddress?.["3"];
        if (btcAddress && !addressList.includes(btcAddress)) {
          addressList.push(btcAddress);
          console.log("[ChainAbstraction] Added fallback BTC address from account:", btcAddress);
        }
      }

      // Debug: Log addresses being sent to API
      console.log("[ChainAbstraction] Address list for API:", addressList);
      console.log("[ChainAbstraction] Stored MPC addresses:", storedMpc);
      console.log("[ChainAbstraction] Account coinFamilyAndAddress:", account?.coinFamilyAndAddress);

      if (addressList.length === 0) {
        setCompentLoading(false);
        setIsInitialLoading(false);
        return;
      }

      if (!account?.jwtToken) {
        setCompentLoading(false);
        setIsInitialLoading(false);
        return;
      }

      const data = await server.post(
        "/chainAbstraction/getCoinList",
        {
          coinFamilies: [3, 7],
          addrsList: addressList,
        },
        {
          headers: { Authorization: account.jwtToken },
        }
      );

      setTotal(data?.data?.data?.length || 0);

      const { chains } = await chrome.storage.local.get("chains");

      if (!data?.data?.data || !Array.isArray(data.data.data)) {
        setCompentLoading(false);
        setIsInitialLoading(false);
        return;
      }

      let tokens = data.data.data.map((token) =>
        buildTokenObject(token, chains || [], account, storedMpc)
      );

      // Debug: Log tokens returned from API
      console.log("[ChainAbstraction] Tokens returned from API:", tokens);
      console.log("[ChainAbstraction] BTC tokens:", tokens.filter(t => t.coinFamily === 3));
      console.log("[ChainAbstraction] TICS tokens:", tokens.filter(t => t.coinFamily === 7));
      console.log("[ChainAbstraction] Total tokens count:", tokens.length);

      if (tokens.length === 0) {
        setCompentLoading(false);
        setIsInitialLoading(false);
        return;
      }

      const activeTokens = tokens;
      let modifiedList = await uniqueList(allToken, tokens);

      // Ensure BTC token is present if we have a BTC address
      const hasBtcToken = modifiedList.some(t => t.coinFamily === 3);
      const hasBtcAddress = storedMpc?.btc || account?.coinFamilyAndAddress?.[3];
      
      if (!hasBtcToken && hasBtcAddress && chains) {
        console.warn("[ChainAbstraction] BTC token missing from API response, but BTC address exists. API may not have returned BTC token.");
        // Try to find BTC chain info
        const btcChain = chains.find((chain) => chain?.coinFamily == 3);
        if (btcChain) {
          // Create a minimal BTC token object if API didn't return it
          const btcToken = {
            id: 'BTC',
            symbol: 'BTC',
            showName: 'Bitcoin',
            coinSymbol: 'BTC',
            active: true,
            iHave: false, // Will be updated when balance is fetched
            name: 'Bitcoin',
            tokenAddress: null,
            image: btcChain?.image || null,
            address: storedMpc?.btc || account?.coinFamilyAndAddress?.[3],
            isToken: false,
            coinFamilyName: 'BTC',
            coinFamily: 3,
            balance: 0,
            price: chainAbstractionFiatPrices.BTC || 0,
            type: null,
            chain: btcChain,
            native: null,
            decimals: 8,
            rpc: getRpcUrl('REACT_APP_BTC_RPC'),
          };
          modifiedList.push(btcToken);
          console.log("[ChainAbstraction] Added fallback BTC token:", btcToken);
        }
      }

      setAllTokens(modifiedList);
      setFilteredTokens(modifiedList);
      
      // Debug: Log the modified list that will be set to availableTokens
      console.log("[ChainAbstraction] Modified list (availableTokens):", modifiedList);
      console.log("[ChainAbstraction] BTC in modifiedList:", modifiedList.filter(t => t.coinFamily === 3));

      let { [chainAbstractionTokenKeys.from]: crossToken1 } =
        await chrome.storage.local.get(chainAbstractionTokenKeys.from);
      let { [chainAbstractionTokenKeys.to]: crossToken2 } =
        await chrome.storage.local.get(chainAbstractionTokenKeys.to);

      if (!crossToken1 && !crossToken2) {
        let myToken1 =
          modifiedList.find(
            (token) => !token.tokenAddress && token.coinFamily == 7
          ) ||
          modifiedList.find((token) => !token.tokenAddress) ||
          modifiedList[0];

        const myToken2 =
          modifiedList.find(
            (token) => !token.tokenAddress && token.coinFamily == 3
          ) ||
          modifiedList.find((token) => token.id !== myToken1?.id) ||
          modifiedList[1] ||
          myToken1;

        // Fetch MPC balance for token1 (using cached data)
        const mpcBal = fetchMpcBalance(myToken1, storedMpc);
        myToken1.balance = mpcBal;
        setBalance(mpcBal);

        setReceivedBalance(0);
        console.log("[ChainAbstraction] Setting availableTokens with:", modifiedList);
        console.log("[ChainAbstraction] BTC in availableTokens:", modifiedList.filter(t => t.coinFamily === 3));
        setAvailableTokens(modifiedList);
        setToken1(myToken1);
        setToken2(myToken2);
        setCompentLoading(true);

        let route;
        if (myToken1?.id === myToken2?.id) {
          route = {
            pair: [myToken1?.symbol, myToken2?.symbol],
            outAmount: 1, // Same amount, no slippage
            exchangeData: {
              instantRate: 1,
              receiveCoinFee: 0, // No fee for same-coin transfers
            },
          };
          setRoute(route);
          } else {
            try {
              route = await getCachedQuoteAndRoute(
                myToken1?.symbol,
                myToken2?.symbol,
                1
              );

            if (
              route?.status &&
              route?.message &&
              (route?.status !== "" || route?.message !== "")
            ) {
              setCompentLoading(false);
              setIsInitialLoading(false);
              return messageApi.error(route?.message);
            }

            setRoute(route);
          } catch (error) {
            console.log("Error fetching route:", error);
            // Set a default route to prevent UI errors
            setRoute({
              pair: [myToken1?.symbol, myToken2?.symbol],
              outAmount: 1,
              exchangeData: {
                instantRate: 1,
                receiveCoinFee: 0,
              },
            });
          }
        }
        setCompentLoading(false);
        setTimeout(() => {
          setIsInitialLoading(false);
        }, 1000);
      } else {
        const myToken1 =
          activeTokens.find((el) => el.id == crossToken1.id) || null;
        
        let myToken2 = modifiedList.find((el) => el.id == crossToken2.id);
        if (!myToken2) {
          myToken2 = modifiedList.find((token) => token.id !== myToken1?.id) || modifiedList[1] || myToken1;
        }

        const updatedToken = modifiedList.find((el) => el.id == crossToken1.id);

        setCompentLoading(true);
        setToken1(myToken1);
        setToken2(myToken2);

        // Fetch MPC balance (using cached data)
        if (myToken1 && storedMpc) {
          const mpcBal = fetchMpcBalance(myToken1, storedMpc);
          setBalance(mpcBal);
        } else {
          setBalance(updatedToken?.balance || 0);
        }

        setAvailableTokens(modifiedList);

        if (myToken1) {
          let route;
          if (myToken1?.id === myToken2?.id) {
            route = {
              pair: [myToken1?.symbol, myToken2?.symbol],
              outAmount: 1, // Same amount, no slippage
              exchangeData: {
                instantRate: 1,
                receiveCoinFee: 0, // No fee for same-coin transfers
              },
            };
            setRoute(route);
          } else {
            try {
              route = await getCachedQuoteAndRoute(
                myToken1?.symbol,
                myToken2?.symbol,
                1
              );

              if (
                route?.status &&
                route?.message &&
                (route?.status !== "" || route?.message !== "")
              ) {
                setCompentLoading(false);
                setIsInitialLoading(false);
                return messageApi.error(route?.message);
              }

              setRoute(route);
            } catch (error) {
              console.log("Error fetching route:", error);
              setRoute({
                pair: [myToken1?.symbol, myToken2?.symbol],
                outAmount: 1,
                exchangeData: {
                  instantRate: 1,
                  receiveCoinFee: 0,
                },
              });
            }
          }
        }

        setCompentLoading(false);
        setTimeout(() => {
          setIsInitialLoading(false);
        }, 1000);
      }

      // console.log("state && state.coinId", state, state?.coinId);

      if (state?.coinId) {
        const tokenExists = activeTokens.find(
          (token) => token?.id === state?.coinId
        );
        if (tokenExists) {
          const tokenFromSearch = buildTokenObject(
            tokenExists,
            chains,
            account,
            storedMpc
          );

          if (!tokenFromSearch) {
            return messageApi.error("Token not available for swap.");
          }

          crossToken1 = tokenFromSearch;
          await chrome.storage.local.set({
            [chainAbstractionTokenKeys.from]: tokenFromSearch,
          });
          setToken1(crossToken1);
        }
      }
    } catch (error) {
      console.log("error in the init function:", error);
      setCompentLoading(false);
      setTimeout(() => {
        setIsInitialLoading(false);
      }, 1000);

      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return;
      }
      
      const isNetworkError = 
        error?.response?.status >= 500 || 
        error?.code === 'NETWORK_ERROR' ||
        error?.message?.includes('Network Error') ||
        error?.message?.includes('timeout');
      
      const isDataError = 
        error?.message?.includes('undefined') ||
        error?.message?.includes('Cannot read') ||
        error?.message?.includes('null');
      
      if (isNetworkError && !isDataError) {
        messageApi.error(
          error?.response?.data?.message || 
          "Unable to perform swap currently. Please try again later."
        );
      }
    }
  };

  useEffect(() => {
    // Ensure MPC addresses (ETH/BTC) exist in storage
    (async () => {
      try {
        const currentEthAddress =
          account?.coinFamilyAndAddress?.[2] ||
          account?.coinFamilyAndAddress?.["2"] ||
          null;
        if (currentEthAddress) {
          // console.log(
          //   "[MPC:UI] ETH address detected in account:",
          //   currentEthAddress
          // );

          // Try to get stored MPC addresses
          const stored = await getStoredMpcAddresses();

          // For testing - remove these hardcoded values in production
          // const stored = {
          //   eth: "0x75965181713d44192d40166a14faf7363392e01b",
          //   btc: "n4qqJ3zZRgUdsa6cKgw8McUckE8DPTmgjU"
          // };

          if (stored?.eth && stored?.btc) {
            // console.log("[MPC:UI] Both addresses present, hiding modal");
            setMpcAddresses(stored);
            setShowMpcModel(false);
          } else {
            // console.log("[MPC:UI] MPC addresses missing, showing modal");
            setShowMpcModel(true);
          }
        } else {
          // console.warn("[MPC:UI] No ETH address in account; showing modal");
          setShowMpcModel(true);
        }
      } catch (e) {
        // console.error(
        //   "[MPC:UI] Error ensuring MPC addresses:",
        //   e?.message || e
        // );
        setShowMpcModel(true);
      }
    })();

    if (chainAbstractionSwapDetail) {
      if (chainAbstractionSwapDetail?.tab == 1) {
        setToken1(chainAbstractionSwapDetail?.token1);
        setToken2(chainAbstractionSwapDetail?.token2);
        setWithdrawAmount(+chainAbstractionSwapDetail?.amount);
        setReceivedAmount(+chainAbstractionSwapDetail?.receivedAmount);
        setTimeout(() => {
          initialSwapDetail(
            +chainAbstractionSwapDetail?.amount,
            chainAbstractionSwapDetail?.receivedAmount,
            chainAbstractionSwapDetail?.token1,
            chainAbstractionSwapDetail?.token2
          );
        }, 2000);
      }
    }
  }, []);

  // Determine which MPC address to use based on selected token
  useEffect(() => {
    const pickMpcAddress = (token, addresses) => {
      if (!token || !addresses) {
        // console.log("Missing token or addresses in pickMpcAddress");
        return null;
      }
      
      // console.log("Picking MPC address for token:", token.symbol, "coinFamily:", token.coinFamily);
      
      if (token?.coinFamily === 3 || token?.chain?.currencyName === "BTC") {
        // console.log("Selected BTC address:", addresses?.btc);
        return addresses?.btc || null;
      }
      // default to EVM (coinFamily 2 or 7)
      // console.log("Selected ETH address:", addresses?.eth);
      return addresses?.eth || null;
    };
  
    const nextFrom = pickMpcAddress(token1, mpcAddresses);
    // console.log("Setting mpcFromAddress to:", nextFrom);
    setMpcFromAddress(nextFrom);
  }, [token1, mpcAddresses]);

  // Set default MPC address for the "To Address" field based on token2
  useEffect(() => {
    if (token1?.id === token2?.id) {
      // console.log("Same token selected for both source and destination, clearing to address");
      setToAddress("");
      return;
    }

    const getDefaultToAddress = (token, addresses) => {
      if (!token || !addresses) {
        return "";
      }
      
      // console.log("Setting default to address for token:", token.symbol, "coinFamily:", token.coinFamily);
      
      if (token?.coinFamily === 3 || token?.chain?.currencyName === "BTC") {
        // console.log("Using BTC MPC address as default:", addresses?.btc);
        return addresses?.btc || "";
      }
      // default to EVM (coinFamily 2 or 7)
      // console.log("Using ETH MPC address as default:", addresses?.eth);
      return addresses?.eth || "";
    };

    if (token2 && mpcAddresses) {
      const defaultAddress = getDefaultToAddress(token2, mpcAddresses);
      if (defaultAddress) {
        // console.log("Setting default to address:", defaultAddress);
        setToAddress(defaultAddress);
      }
    }
  }, [token1, token2, mpcAddresses]);

  useEffect(() => {
    if (token1 && mpcAddresses && mpcWalletsData) {
      // Use cached MPC wallets data to get balance
      const balance = fetchMpcBalance(token1, mpcAddresses);
      setBalance(balance);
    }
  }, [token1, mpcAddresses, mpcWalletsData]);

  const initialSwapDetail = async (
    amount,
    receivedAmount,
    tokenOne,
    tokenTwo
  ) => {
    try {
      if (updateRef?.current || chainAbstractionSwapDetail?.tab) {
        if (amount > 0 && amount && tokenTwo) {
          setCompentLoading(true);

          // For same-coin transfers (same chain), received amount equals entered amount (no slippage)
          let route;
          if (tokenOne?.id === tokenTwo?.id) {
            route = {
              pair: [tokenOne?.symbol, tokenTwo?.symbol],
              outAmount: amount, // Same amount, no slippage
              exchangeData: {
                instantRate: 1,
                receiveCoinFee: 0, // No fee for same-coin transfers
              },
            };
          } else {
            route = await getCachedQuoteAndRoute(
              tokenOne?.symbol,
              tokenTwo?.symbol,
              amount
            );

            if (
              route?.status &&
              route?.message &&
              (route?.status !== "" || route?.message !== "")
            ) {
              setCompentLoading(false);
              return messageApi.error(route?.message);
            }
          }

          const outAmount = parseFloat(route?.outAmount || 0);
          const flooredOutAmount = getFlooredFixed(outAmount, 6);
          const formattedOutAmount = toFixed(flooredOutAmount);

          setRoute(route);
          setReceivedAmount(formattedOutAmount);
          setCompentLoading(false);
        }
      }

      updateRef.current = true;
    } catch (error) {
      // console.log("ERR ", error);
      setCompentLoading(false);
      return messageApi.error("Pair not available for swap.");
    }
  };

  const uniqueList = (arr1, arr2) => {
    const list = [...arr1, ...arr2];

    const uniqueNames = new Set();
    const result = list.filter((obj) => {
      if (!uniqueNames.has(obj?.name)) {
        uniqueNames.add(obj?.name);
        return true;
      }
      return false;
    });
    return result;
  };

  const handleTokensSwapChangePosition = async () => {
    if (token1 && token2) {
      await handlePositionChange(token1);
      await handleToken2Change(token2);
    }
  };

  useEffect(() => {
    handleTokensSwapChangePosition();
  }, [token1, token2]);

  const handlePositionChange = async (updatedToken1) => {
    await chrome.storage.local.set({
      [chainAbstractionTokenKeys.from]: updatedToken1,
    });
  
    // console.log("=== Token Position Changed ===");
    // console.log("New token:", updatedToken1.symbol);
    // console.log("CoinFamily:", updatedToken1.coinFamily);
  
    // Fetch MPC balance using cached data
    if (mpcAddresses && mpcWalletsData) {
      const mpcBal = fetchMpcBalance(updatedToken1, mpcAddresses);
      setBalance(mpcBal);
    } else {
      setBalance(updatedToken1?.balance || 0);
    }
  
    if (updatedToken1.id != token1?.id) {
      setReceivedAmount(null);
      setWithdrawAmount(null);
      setPercent(null);
      networkFeeRef.current = 0;
      setNetworkFee(0); // Reset network fee when token changes
      updateRef.current = false;
    }
  
    // For same-coin transfers (same chain), received amount equals entered amount (no slippage)
    if (updatedToken1?.id === token2?.id) {
      const sameCoinRoute = {
        pair: [updatedToken1?.symbol, token2?.symbol],
        outAmount: 1, // Same amount, no slippage
        exchangeData: {
          instantRate: 1,
          receiveCoinFee: 0, // No fee for same-coin transfers
        },
      };
      setRoute(sameCoinRoute);
    } else {
      const route = await getCachedQuoteAndRoute(
        updatedToken1?.symbol,
        token2?.symbol,
        1
      );
      if (route?.status && route?.message) {
        if (route?.status != "" || route?.message != "") {
          return messageApi.error(route?.message);
        }
      }
      setRoute(route);
    }
  };


  const handleToken2Change = async (updatedToken2) => {
    await chrome.storage.local.set({
      [chainAbstractionTokenKeys.to]: updatedToken2,
    });

    setReceivedBalance(updatedToken2.balance);

    if (updatedToken2.id != token2?.id) {
      setReceivedAmount(null);
      setWithdrawAmount(null);
      setPercent(null);
      networkFeeRef.current = 0;
      setNetworkFee(0); // Reset network fee when token changes
      updateRef.current = false;
    }

    // For same-coin transfers (same chain), received amount equals entered amount (no slippage)
    if (token1?.id === updatedToken2?.id) {
      const sameCoinRoute = {
        pair: [token1?.symbol, updatedToken2?.symbol],
        outAmount: 1, // Same amount, no slippage
        exchangeData: {
          instantRate: 1,
          receiveCoinFee: 0, // No fee for same-coin transfers
        },
      };
      setRoute(sameCoinRoute);
    } else {
      const route = await getCachedQuoteAndRoute(
        token1?.symbol,
        updatedToken2?.symbol,
        1
      );

      if (route?.status && route?.message) {
        if (route?.status != "" || route?.message != "") {
          return messageApi.error(route?.message);
        }
      }
      setRoute(route);
    }
  };

  function handleSwapInput(withdrawAmount) {
    onChangeFromValue(withdrawAmount);
  }

  useEffect(() => {
    setReceivedAmount("");
    init();
    return () => {
      setWithdrawAmount("");
      setReceivedAmount("");
    };
  }, [page]);

  const normalizedToAddress = (toAddress || "").trim();
  const normalizedMpcFromAddress = (mpcFromAddress || "").trim();
  const isSameRecipientAddress =
    token1?.id === token2?.id &&
    normalizedToAddress &&
    normalizedMpcFromAddress &&
    normalizedToAddress.toLowerCase() === normalizedMpcFromAddress.toLowerCase();
  const recipientAddressForSubmit =
    token2?.chain?.isEVM === true
      ? normalizedToAddress.toLowerCase()
      : normalizedToAddress;

  const calculateBtcNetworkFee = async () => {
    const gasPriceResponse = await BTCHelper.getBTCGasPrice();

    let gasPrice = 1;
    if (gasPriceResponse) {
      if (typeof gasPriceResponse === "object" && gasPriceResponse !== null) {
        gasPrice = Math.max(
          Number(gasPriceResponse.priority || gasPriceResponse.regular || 1),
          1
        );
      } else {
        gasPrice = Math.max(Number(gasPriceResponse) || 1, 1);
      }
    }

    const estimatedInputCount = 1;
    const estimatedOutputCount = 2;
    const estimatedSize =
      estimatedInputCount * 146 + estimatedOutputCount * 34 + 10;
    const feeInSatoshis = Math.ceil(estimatedSize * gasPrice);
    return parseFloat((feeInSatoshis / 1e8).toFixed(8));
  };

  const handleChainAbstraction = async () => {
    setIsProcessing(true);
    try {
      if (!mpcFromAddress) {
        setIsProcessing(false);
        setSessionPassword(null); // Clear password on error
        setShowMpcModel(true);
        return messageApi.error(
          "MPC wallet not set up. Please complete MPC setup."
        );
      }

      // Validate to address is different from from address when tokens are the same
      if (token1?.id === token2?.id) {
        if (isSameRecipientAddress) {
          setIsProcessing(false);
          setSessionPassword(null); // Clear password on error
          return messageApi.error(
            "Cannot send to the same address. Please enter a different recipient address."
          );
        }
      }

      // Get MPC balance from cache
      const mpcBalance = fetchMpcBalance(token1, mpcAddresses);
      const parsedAmount = parseFloat(amount);
      const parsedReceivedAmount = parseFloat(receivedAmount);

      const throwError = (msg) => {
        messageApi.error(msg);
        setIsProcessing(false);
        setSessionPassword(null); // Clear password on error
      };

      if (isNaN(parsedAmount) || isNaN(parsedReceivedAmount)) {
        return throwError("Please enter a valid amount to proceed.");
      }

      // Validate amount against min/max limits (dynamic from API)
      if (token1?.coinFamily) {
        const validation = validateSwapAmount(amount, token1.coinFamily, minMaxSwapAmount);
        if (!validation.valid) {
          return throwError(validation.message);
        }
      }

      // Validate to address
      if (token2?.coinFamily === 3) {
        const isValidBTCAddress = BTCHelper.validateBTCAddress(
          recipientAddressForSubmit
        );
        if (!isValidBTCAddress) {
          return throwError("Please enter a valid Bitcoin address.");
        }
      } else if (token2?.chain?.isEVM == true) {
        const isValidEVMAddress = Web3Helper.validateETHAddress(
          recipientAddressForSubmit
        );
        if (!isValidEVMAddress) {
          return throwError("Please enter a valid address.");
        }
      }

      const buildSwapDetails = (
        networkFee,
        parentCoinValue = token1?.native
      ) => ({
        route,
        token1,
        token2,
        amount,
        amount2: receivedAmount,
        tokenChain: token1.chain,
        networkFee,
        walletAddress: mpcFromAddress,
        token1Price: newBalanceToFiatConversion(token1?.price, amount),
        parentCoin: { value: parentCoinValue },
        tab: 1,
        source: CHAIN_ABSTRACTION_SWAP_SOURCE,
        rpc: token1.rpc,
        coinSymbol: token1.coinSymbol,
      });

      const finalizeSwap = (details) => {
        store.dispatch(swapDetailAc(details));
        store.dispatch(setLoading(false));
        setSessionPassword(null); // Clear password when opening modal
        setPasswordModal(true);
      };

      if (token1?.chain?.isEVM) {
        const gasPrice = await Web3Helper.getGasPrice(
          token1?.chain.slug,
          mpcFromAddress,
          mpcFromAddress,
          token1?.isToken,
          token1?.tokenAddress,
          token1?.coinSymbol
        );

        if (!gasPrice) {
          store.dispatch(setLoading(false));
          setSessionPassword(null); // Clear password on error
          return throwError("Unable to fetch gas price at the moment.");
        }

        let gasEstimate = gasPrice?.estimate || 23000;
        const mediumGasPrice = gasPrice?.fast || 0.000000007;
        
        // For TICS (qubetics), gas_price is in a small unit (similar to gwei)
        // Convert: (gas_price * gas_estimate * buffer) / 10^9 = fee in TICS
        const isTicsChain = token1?.chain?.slug === 'tics' || token1?.chain?.slug === 'qubetics';
        let gasInEth;
        
        if (isTicsChain) {
          // For TICS: gas_price is in a small unit (like gwei), convert to TICS
          // Formula: (gas_price * gas_estimate * 2) / 10^9
          // Example: (5.355 * 20000 * 2) / 10^9 = 214200 / 10^9 = 0.0002142 TICS
          const totalGasUnits = mediumGasPrice * gasEstimate * 2;
          gasInEth = parseFloat((totalGasUnits / Math.pow(10, 9)).toFixed(8));
        } else {

          gasInEth = parseFloat(((mediumGasPrice * gasEstimate * 2) / Math.pow(10, 9)).toFixed(8));
        }
        
        networkFeeRef.current = gasInEth;
        setNetworkFee(gasInEth);

        const nativeCoinBalanceRaw = await Web3Helper.getCoinBalance(
          mpcFromAddress,
          token1?.rpc
        );

        // console.log("MPC nativeCoinBalance (raw):", nativeCoinBalanceRaw);

        let nativeCoinBalance = 0;
        if (nativeCoinBalanceRaw && nativeCoinBalanceRaw !== false) {
          nativeCoinBalance =
            typeof nativeCoinBalanceRaw === "object" &&
            nativeCoinBalanceRaw.toNumber
              ? nativeCoinBalanceRaw.toNumber()
              : parseFloat(nativeCoinBalanceRaw.toString());
        }

        // console.log("MPC nativeCoinBalance (converted):", nativeCoinBalance);

        const gasFee = parseFloat(gasInEth) || 0;
        
        const balanceNum = parseFloat(mpcBalance) || 0;
        const amountNum = parseFloat(parsedAmount) || 0;
        const feeNum = parseFloat(gasFee) || 0;
        
        console.log("=== EVM BALANCE CHECK ===");
        console.log("balanceNum:", balanceNum);
        console.log("amountNum:", amountNum);
        console.log("feeNum (gasFee):", feeNum);
        console.log("nativeCoinBalance:", nativeCoinBalance);
        console.log("token1.isToken:", token1?.isToken);
        console.log("Total required (amount + fee):", amountNum + feeNum);
        console.log("Balance check:", balanceNum, ">=", amountNum + feeNum, "?", balanceNum >= (amountNum + feeNum));
        
        // For native coins (not tokens), check if balance covers amount + gas fee
        // For tokens, check if token balance covers amount AND native balance covers gas fee
        let hasEnoughBalance = false;
        
        if (token1?.isToken) {
          // Token transaction: need token balance for amount AND native balance for gas
          const hasEnoughToken = balanceNum >= amountNum;
          const hasEnoughNativeForGas = nativeCoinBalance >= feeNum;
          hasEnoughBalance = hasEnoughToken && hasEnoughNativeForGas;
          console.log("Token check - hasEnoughToken:", hasEnoughToken, "hasEnoughNativeForGas:", hasEnoughNativeForGas);
        } else {
          // Native coin transaction: need balance to cover amount + gas fee
          hasEnoughBalance = balanceNum >= (amountNum + feeNum);
          console.log("Native coin check - hasEnoughBalance:", hasEnoughBalance);
        }

        if (!hasEnoughBalance) {
          const errorMsg = token1?.isToken
            ? `Insufficient balance. Required: ${amountNum.toFixed(6)} ${token1?.symbol} + ${feeNum.toFixed(6)} native gas, Available: ${balanceNum.toFixed(6)} ${token1?.symbol}, Native: ${nativeCoinBalance.toFixed(6)}`
            : `Insufficient balance. Required: ${(amountNum + feeNum).toFixed(8)} ${token1?.symbol} (Amount: ${amountNum.toFixed(8)} + Fee: ${feeNum.toFixed(8)}), Available: ${balanceNum.toFixed(8)} ${token1?.symbol}`;
          console.error("Balance check failed:", errorMsg);
          return throwError(errorMsg);
        }

        // Additional check for tokens (redundant but kept for safety)
        if (token1?.isToken) {
          if (balanceNum < amountNum) {
            console.error("Token balance insufficient:", balanceNum, "<", amountNum);
            return throwError(`Insufficient Balance`);
          }
        }
        console.log("hasEnoughBalance:", hasEnoughBalance);
        const { data: parentCoinData } = await server.post(
          "/wallet/nativeCoinFiatPrice",
          {
            coin_family: token1.coinFamily,
            fiat_currency: currency.name,
          },
          {
            headers: { Authorization: account.jwtToken },
          }
        );
        console.log("data of parentCoinData:", parentCoinData);
        const swapDetails = buildSwapDetails(
          gasFee,
          parentCoinData?.fiatCoinPrice?.value
        );
        finalizeSwap(swapDetails);
      } else if (token1?.chain?.currencyName === "BTC") {
        const calculatedNetworkFee = await calculateBtcNetworkFee();
        networkFeeRef.current = calculatedNetworkFee;
        setNetworkFee(calculatedNetworkFee);
        // console.log("Network fee stored in ref:", networkFeeRef.current);

        if (mpcBalance < parsedAmount + calculatedNetworkFee) {
          const totalRequired = parsedAmount + calculatedNetworkFee;
          return throwError(
            `Insufficient balance. Required: ${totalRequired.toFixed(8)} BTC (Amount: ${parsedAmount.toFixed(8)} + Fee: ${calculatedNetworkFee.toFixed(8)}), Available: ${(parseFloat(mpcBalance) || 0).toFixed(8)} BTC`
          );
        }

        const swapDetails = buildSwapDetails(calculatedNetworkFee);
        finalizeSwap(swapDetails);
      } else {
        // console.warn("Unknown chain type for token1:", token1);
        setNetworkFee(0);
        return throwError("Unsupported chain type for transaction.");
      }
    } catch (error) {
      // console.error("Error in handleChainAbstraction:", error);
      messageApi.error(error.message || "An error occurred during processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAbstraction = async () => {
    setIsProcessing(true);

    try {
      if (!mpcFromAddress) {
        setIsProcessing(false);
        setSessionPassword(null); // Clear password on error
        setShowMpcModel(true);
        return messageApi.error(
          "MPC wallet not set up. Please complete MPC setup."
        );
      }

      // Validate to address is different from from address when tokens are the same
      if (token1?.id === token2?.id) {
        if (isSameRecipientAddress) {
          setIsProcessing(false);
          setSessionPassword(null); // Clear password on error
          return messageApi.error(
            "Cannot send to the same address. Please enter a different recipient address."
          );
        }
      }

      // Import the new MPC helper

      let networkFee = 0;

      // Calculate network fee based on chain type
      if (token1?.chain?.isEVM) {
        const gasPrice = await Web3Helper.getGasPrice(
          token1?.chain.slug,
          mpcFromAddress,
          mpcFromAddress,
          token1?.isToken,
          token1?.tokenAddress,
          token1?.coinSymbol
        );

        if (!gasPrice) {
          setIsProcessing(false);
          setSessionPassword(null); // Clear password on error
          return messageApi.error("Unable to fetch gas price at the moment.");
        }

        networkFee =
          (gasPrice.fast * Math.pow(10, 9) * gasPrice.estimate) /
          Math.pow(10, 18);

        setTransactionResult((prev) => ({
          ...prev,
          symbol: token1?.coinSymbol.toUpperCase(),
        }));
      } else if (token1?.chain?.currencyName === "BTC") {
        networkFee = await calculateBtcNetworkFee();

        setTransactionResult((prev) => ({
          ...prev,
          symbol: "BTC",
        }));
      }

      // console.log("Network fee calculated:", networkFee);
      // Check liquidity availability before proceeding
      // Always check destination token (token2) liquidity
      const liquidityCheck = await checkLiquidityAvailability(
        token1,
        token2, // Pass destination token - always check token2 liquidity
        token1?.rpc || null,
        receivedAmount // Use received amount (what user will get)
      );

      // console.log("Liquidity check result:", liquidityCheck);

      if (!liquidityCheck.available) {
        setIsProcessing(false);
        setSessionPassword(null); // Clear password on error
        return messageApi.error(liquidityCheck.message || "No liquidity available at the moment. Please try again later.");
      }

      // Validate MPC balance before proceeding
      const balanceValidation = await mpcHelper.validateMpcBalance(
        token1,
        mpcFromAddress,
        amount,
        networkFee
      );

      // console.log("Balance validation:", balanceValidation);

      if (!balanceValidation.valid) {
        setIsProcessing(false);
        setSessionPassword(null); // Clear password on error
        return messageApi.error(balanceValidation.message);
      }

      // console.log("Sending MPC transaction...");

      // Use the new MPC transaction flow
      let data;
      try {
        data = await mpcHelper.SendMpcTransaction(
          token1,
          token2,
          amount,
          receivedAmount,
          mpcFromAddress,
          token1?.chain,
          networkFee,
          newBalanceToFiatConversion(token1?.price, amount),
          token1?.native,
          token1?.rpc,
          token1?.coinSymbol,
          sessionPassword,
          recipientAddressForSubmit
        );

        // console.log("MPC Transaction result:", data);

        if (!data || !data.hash) {
          setIsProcessing(false);
          setSessionPassword(null); // Clear password on failure
          return messageApi.error(
            "Unable to process your transaction at the moment. Please try again later."
          );
        }

        setIsOpen(false);
        chrome.storage.local.set({ walletBalanceRefreshAt: Date.now() + 120_000 });
        setTransactionResult((prev) => ({
          ...prev,
          hash: data?.hash,
          fee: networkFee,
          status: data?.status ?? "pending",
          solver: data?.solver || "N/A",
          source_address: data?.source_address || "N/A",
        }));
        setIsProcessModal(true);
      } catch (error) {
        // console.error("Transaction failed:", error);
        setIsProcessing(false);
        setSessionPassword(null); // Clear password on error
        
        // Check if error is from intent API (500 error)
        const errorMessage = "Transaction failed. Please try again.";
        
        // Show failure modal with error status
        setIsOpen(false);
        setTransactionResult((prev) => ({
          ...prev,
          hash: "N/A", // No hash if transaction failed
          fee: networkFee,
          status: 0, // Status 0 = Failed
          solver: "N/A",
          source_address: mpcFromAddress || "N/A",
        }));
        setIsProcessModal(false); // Close processing modal
        setShowSuccess(true); // Show final result modal with failure status

        // Also show error message
        messageApi.error(errorMessage);
        return;
      }

      // Refresh MPC balance after transaction by re-fetching wallets data
      if (token1 && account?.address && account?.jwtToken) {
        setTimeout(async () => {
          try {
            const walletData = await getMpcWallets(account.address, 1);
            setMpcWalletsData(walletData);
            // Balance will update automatically via useEffect when mpcWalletsData changes
          } catch (error) {
            console.log("Error refreshing MPC wallets data:", error);
          }
        }, 3000);
      }
    } catch (error) {
      // console.error("Error in handleAbstraction:", error);
      messageApi.error(
        error?.message || "Transaction failed. Please try again."
      );
    } finally {
      setIsProcessing(false);
      // Clear password after transaction completes or fails
      setSessionPassword(null);
    }
  };

  // Skeleton loader component - based on SelectCoin pattern
  const SkeletonLoader = () => (
    <div className="swapSkeletonCard">
      {/* First token section */}
      <div className="skeletonSection">
        <div className="skeletonInputArea">
          <div className="skeletonText skeletonInput"></div>
          <div className="skeletonText skeletonFiatValue"></div>
        </div>
        <div className="skeletonTokenArea">
          <div className="skeletonCircle"></div>
          <div className="skeletonText skeletonTokenName"></div>
        </div>
      </div>
      
      {/* Address field */}
      <div className="skeletonAddressField">
        <div className="skeletonText skeletonLabel"></div>
        <div className="skeletonText skeletonAddress"></div>
      </div>
      
      {/* Swap icon */}
      <div className="skeletonSwapIcon">
        <div className="skeletonCircle"></div>
      </div>
      
      {/* Second token section */}
      <div className="skeletonSection">
        <div className="skeletonInputArea">
          <div className="skeletonText skeletonInput"></div>
          <div className="skeletonText skeletonFiatValue"></div>
        </div>
        <div className="skeletonTokenArea">
          <div className="skeletonCircle"></div>
          <div className="skeletonText skeletonTokenName"></div>
        </div>
      </div>
      
      {/* Second address field */}
      <div className="skeletonAddressField">
        <div className="skeletonText skeletonLabel"></div>
        <div className="skeletonText skeletonAddress"></div>
      </div>
      
      {/* Button */}
      <div className="skeletonButtonArea">
        <div className="skeletonButton"></div>
      </div>
    </div>
  );

  return (
    <>
      <MenuRestofHeaders 
        backTo={"/wallet"} 
        title={"Chain Abstraction"} 
        chainAbstractionIcon={Abstract}
        isProcessing={isProcessing}
      />
      <div className="flexedContent">
        <div
          className={`${"fixedContent height-571"} ${
            height <= 600 ? "fixedContentOuterExt" : ""
          }`}
        >
          <div style={{ width: "100%", marginBottom: "20px" }}>
            {contextHolder}
            {isInitialLoading ? (
              <div
                style={{ width: "90%", marginRight: "auto", marginLeft: "auto" }}
                className="swap"
              >
                <SkeletonLoader />
              </div>
            ) : (
              <div
                style={{ width: "90%", marginRight: "auto", marginLeft: "auto" }}
                className="swap "
              >
              <div className="swap_onChain ">
                <div className="swap_onChain_balance">
                  <div>
                    <input
                      type="number"
                      className="myInput"
                      placeholder="0.000"
                      onWheel={(e) => e.currentTarget.blur()}
                      inputMode="decimal"
                      disabled={isProcessing}
                      onKeyDown={(e) => {
                        if (isProcessing) {
                          e.preventDefault();
                          return;
                        }
                        const allowedKeys = [
                          "Backspace",
                          "Tab",
                          "ArrowLeft",
                          "ArrowRight",
                          "Delete",
                          "Home",
                          "End",
                        ];

                        if (allowedKeys.includes(e.key)) return;
                        if (!/^[0-9.]$/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={({ target: { value: _amount } }) => {
                        if (isProcessing) return;
                        if (percent != null) {
                          setPercent(null);
                        }

                        // Remove leading zero if followed by a digit (e.g., "02" -> "2", but keep "0.2")
                        let sanitizedAmount = _amount;
                        if (_amount.startsWith("0") && _amount.length > 1 && _amount[1] !== ".") {
                          sanitizedAmount = _amount.substring(1);
                        }

                        const [beforeDecimal = "", afterDecimal = ""] =
                          sanitizedAmount.split(".");
                        const maxCharactersBeforeDecimal = 15;
                        const maxDecimals = token1?.decimals || 8;

                        if (beforeDecimal.length > maxCharactersBeforeDecimal)
                          return;
                        if (afterDecimal.length > maxDecimals) return;

                        handleSwapInput(sanitizedAmount);
                      }}
                      value={amount || ""}
                    />
                    <p style={{ marginBottom: "8px" }}>
                      {amount && amount !== "" && parseFloat(amount) > 0
                        ? `${currency?.symbol}${addCommasToNumber(
                            getFlooredFixed(
                              parseFloat(amount) *
                                parseFloat(token1 ? token1.price : 0),
                              2
                            )
                          )}`
                        : ""}
                    </p>
                    {token1?.coinFamily && (
                      <p style={{ 
                        fontSize: "12px", 
                        color: "#666", 
                        marginTop: "4px",
                        marginBottom: "8px"
                      }}>
                        {getLimitsText(token1.coinFamily, minMaxSwapAmount)}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Select
                      suffixIcon={<img src={DownArrowSuffix} alt="" />}
                      style={{
                        width: 100,
                      }}
                      disabled={!token1 || !token2 || isProcessing}
                      onClick={() => {
                        if (!token1 || !token2 || isProcessing) return;
                        console.log("[ChainAbstraction] Opening token1 drawer, availableTokens:", availableTokens);
                        console.log("[ChainAbstraction] BTC in availableTokens:", availableTokens.filter(t => t.coinFamily === 3));
                        setSelected(1);
                        setTokenDrawer(true);
                      }}
                      open={false}
                      value={[
                        {
                          value: token1?.id,
                          label: (
                            <span className="flexedItemSelect">
                              {!token1?.image ? (
                                <div
                                  style={{
                                    alignItems: "center",
                                    backgroundColor: "rgba(98,126,234,.2)",
                                    borderRadius: "49%",
                                    display: "flex",
                                    height: "29px",
                                    justifyContent: "center",
                                    width: "29px",
                                    marginRight: "15px",
                                  }}
                                >
                                  {token1?.name?.split("")[0]}
                                </div>
                              ) : (
                                <img
                                  style={{
                                    height: "30px",
                                    width: "30px",
                                    objectFit: "contain",
                                    position: "relative",
                                    borderRadius: "15px",
                                  }}
                                  alt=""
                                  src={token1?.image}
                                />
                              )}
                              {token1?.symbol?.toUpperCase()}
                            </span>
                          ),
                        },
                      ]}
                      onSelect={(value) => {
                        // (null);
                        const selectedToken = availableTokens.find(
                          (el) => el.id == value
                        );
                        setToken1(selectedToken);
                        handlePositionChange(selectedToken);
                      }}
                      options={availableTokens
                        .filter((token) => token && token.active !== false) // Ensure only active tokens are shown
                        .map((token) => {
                          return {
                            value: token?.id,
                            label: (
                              <span className="flexedItemSelect">
                                <img
                                  style={{
                                    height: "20px",
                                    width: "20px",
                                    objectFit: "contain",
                                    marginLeft: "20px",
                                    marginRight: "20px",
                                  }}
                                  src={token?.image}
                                  alt=""
                                />
                                {token?.symbol?.toUpperCase()}
                              </span>
                            ),
                          };
                        })}
                    />
                    <div className="swap_onChain_pay">
                      <p style={{ textAlign: "right" }}>
                        MPC Balance{" "}
                        <span>
                          {addCommasToNumber(
                            parseFloat(getFlooredFixed(balance || 0, 6))
                          )}{" "}
                          {token1?.symbol?.toUpperCase()}{" "}
                          {`~ ${currency?.symbol}${addCommasToNumber(
                            getFlooredFixed(
                              parseFloat(balance || 0) *
                                parseFloat(token1?.price || 0),
                              2
                            )
                          )}`}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "10px", width: "100%" }}>
                <InputField
                  placeholder={"MPC Wallet Address"}
                  type={"text"}
                  label="From Address (MPC)"
                  value={mpcFromAddress || ""}
                  readOnly
                  disabled={true}
                />
              </div>

              <div 
                className="swap__icon"
                style={{
                  cursor: (isProcessing || token1?.id === token2?.id) ? "not-allowed" : "pointer"
                }}
              >
                {availableTokens?.length !== 0 && (
                  <img
                    src={SwapVerticalIcon}
                    width={44}
                    alt=""
                    height={44}
                    style={
                        (isProcessing || token1?.id === token2?.id)
                          ? { 
                              pointerEvents: "none", 
                              opacity: 0.5 
                            }
                        : { 
                            pointerEvents: "auto"
                          }
                    }
                    onClick={() => {
                      if (isProcessing || token1?.id === token2?.id) return;
                      if (token2?.iHave) {
                        setToken1(token2);
                        setToken2(token1);
                        setReceivedAmount(0);
                        setWithdrawAmount(0);
                        setPercent(0);
                        setToAddress(""); // Reset to address so it updates with new default
                      } else {
                        return messageApi.error(
                          `Please enable ${token2?.name} in your wallet.`
                        );
                      }
                    }}
                  />
                )}
              </div>

              <div className="swap_onChain">
                <div className="swap_onChain_balance">
                  <div>
                    <div
                      className="myInput chainAbstractionToAmount"
                      style={{ cursor: "default" }}
                      title={
                        receivedAmount && receivedAmount !== ""
                          ? removeTrailingZeros(receivedAmount)
                          : "0.000"
                      }
                    >
                      {receivedAmount && receivedAmount !== ""
                        ? removeTrailingZeros(receivedAmount)
                        : "0.000"}
                    </div>
                    <p style={{ marginBottom: "8px" }}>
                      {receivedAmount && receivedAmount !== "" && parseFloat(receivedAmount) > 0
                        ? `${currency.symbol}${addCommasToNumber(
                            getFlooredFixed(
                              parseFloat(receivedAmount) *
                                parseFloat(token2 ? token2.price : 0),
                              2
                            )
                          )}`
                        : ""}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Select
                      suffixIcon={<img src={DownArrowSuffix} alt="" />}
                      style={{
                        width: 100,
                      }}
                      disabled={!token1 || !token2 || isProcessing}
                      onClick={() => {
                        if (!token1 || !token2 || isProcessing) return;
                        console.log("[ChainAbstraction] Opening token2 drawer, availableTokens:", availableTokens);
                        console.log("[ChainAbstraction] BTC in availableTokens:", availableTokens.filter(t => t.coinFamily === 3));
                        console.log("[ChainAbstraction] allToken:", allToken);
                        console.log("[ChainAbstraction] BTC in allToken:", allToken.filter(t => t.coinFamily === 3));
                        // Ensure filteredTokens is set to allToken when opening drawer
                        if (allToken.length > 0) {
                          setFilteredTokens(allToken);
                        }
                        setSelected(2);
                        setTokenDrawer(true);
                      }}
                      open={false}
                      value={[
                        {
                          value: token2?.id,
                          label: (
                            <span className="flexedItemSelect">
                              {!token2?.image ? (
                                <div
                                  style={{
                                    alignItems: "center",
                                    backgroundColor: "rgba(98,126,234,.2)",
                                    borderRadius: "49%",
                                    display: "flex",
                                    height: "29px",
                                    justifyContent: "center",
                                    width: "29px",
                                    marginRight: "15px",
                                  }}
                                >
                                  {token2?.name?.split("")[0]}
                                </div>
                              ) : (
                                <img
                                  style={{
                                    height: "30px",
                                    width: "30px",
                                    objectFit: "contain",
                                    position: "relative",
                                    borderRadius: "15px",
                                  }}
                                  alt=""
                                  src={token2?.image}
                                />
                              )}
                              {token2?.symbol?.toUpperCase()}
                            </span>
                          ),
                        },
                      ]}
                      onSelect={(value) => {
                        const selectedToken = availableTokens.find(
                          (el) => el.id == value
                        );
                        setToken2(selectedToken);
                        handleToken2Change(selectedToken);
                      }}
                      options={availableTokens
                        .map((token) => {
                          return {
                            value: token?.id,
                            label: (
                              <span className="flexedItemSelect">
                                <img
                                  style={{
                                    height: "20px",
                                    width: "20px",
                                    objectFit: "contain",
                                    marginLeft: "20px",
                                    marginRight: "20px",
                                  }}
                                  src={token?.image}
                                  alt=""
                                />
                                {token?.symbol?.toUpperCase()}
                              </span>
                            ),
                          };
                        })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "10px", width: "100%" }}>
                <InputField
                  placeholder={"Recipient Address"}
                  type={"text"}
                  label="To Address"
                  value={toAddress}
                  disabled={isProcessing}
                  addonAfter={
                    <img
                      src={PasteIcon}
                      alt="Paste"
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        opacity: isProcessing ? 0.5 : 0.7
                      }}
                      onClick={async () => {
                        if (isProcessing) return;
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text) {
                            setToAddress(text);
                            messageApi.success('Address pasted from clipboard');
                          }
                        } catch (error) {
                          messageApi.error('Failed to paste from clipboard');
                        }
                      }}
                    />
                  }
                  getData={(address) => {
                    if (isProcessing) return;
                    setToAddress(address);
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: "10px",
                }}
              >
                <ButtonComp
                  onClick={handleChainAbstraction}
                  text={
                    isProcessing
                      ? "Processing..."
                      : amount === null || amount === 0
                      ? "Enter Amount"
                      : normalizedToAddress === ""
                      ? "Enter Recipient Address"
                      : !mpcFromAddress
                      ? "MPC Wallet Not Set"
                      : isSameRecipientAddress
                      ? "Enter Different Recipient Address"
                      : "Abstract"
                  }
                  maxWidth={"100%"}
                  disabled={
                    !token1 ||
                    !token2 ||
                    !amount ||
                    !receivedAmount ||
                    amount <= 0 ||
                    receivedAmount <= 0 ||
                    !normalizedToAddress ||
                    !mpcFromAddress ||
                    loading ||
                    isProcessing ||
                    isSameRecipientAddress
                  }
                />
              </div>
            </div>
            )}

          <Drawer
            title="Select Token"
            placement="bottom"
            onClose={() => {
              setTokenDrawer(false);
              setKeyword(null);
              setFilteredTokens(allToken);
            }}
            open={selectDrawer}
            onOpen={() => {
              console.log("[ChainAbstraction] Drawer opened, filteredTokens:", filteredTokens);
              console.log("[ChainAbstraction] allToken:", allToken);
              console.log("[ChainAbstraction] BTC in filteredTokens:", filteredTokens.filter(t => t.coinFamily === 3));
              console.log("[ChainAbstraction] BTC in allToken:", allToken.filter(t => t.coinFamily === 3));
            }}
            closeIcon={
              theme == "darkTheme" ? (
                <img src={darkclose} alt="" />
              ) : (
                <img src={ModalCloseIcon} alt="" />
              )
            }
            height={500}
          >
            <div
              className="contain"
              style={{
                height: "100%",
                width: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {show ? (
                <div className="search" style={{ marginBottom: "30px" }}>
                  <InputField
                    placeholder={"Search Token"}
                    coloredBg={"#eef3f9"}
                    value={keyword}
                    checkForSymbols={true}
                    getData={(value) => {
                      setKeyword(value);
                      if (value.trim().length === 0) {
                        setFilteredTokens(allToken);
                      } else {
                        const matches = allToken.filter(
                          (el) =>
                            el.symbol
                              .toLowerCase()
                              .indexOf(value.trim().toLowerCase()) > -1 ||
                            el.name
                              .toLowerCase()
                              .indexOf(value.trim().toLowerCase()) > -1 ||
                            (el.tokenAddress &&
                              el.tokenAddress
                                .toLowerCase()
                                .indexOf(value.trim().toLowerCase()) > -1)
                        );

                        setFilteredTokens(matches);
                      }
                    }}
                    addonBefore={
                      <span>
                        <img
                          src={Search}
                          style={{
                            width: "17px",
                          }}
                          alt=""
                        />
                      </span>
                    }
                  />
                </div>
              ) : null}

              <div
                ref={parentRef}
                className="right"
                style={{
                  flex: 1,
                  overflow: "scroll",
                }}
              >
                {filteredTokens.filter((el) => {
                  if (selected == 1) {
                    if (el.active) {
                      return el;
                    }
                  } else {
                    return el;
                  }
                }).length > 0 ? (
                  filteredTokens
                    .filter((el) => {
                      if (selected == 1) {
                        if (el.active) {
                          return el;
                        }
                      } else {
                        return el;
                      }
                    })
                    .map((token, index) => (
                      <div
                        key={`token-${token.id}-${index}`}
                        className="design"
                        style={{
                          width: "100%",
                        }}
                      >
                        <div
                          className="token"
                          style={{
                            display: "flex",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            marginBottom: "20px",
                            padding: "8px",
                            borderRadius: "30px",
                            marginLeft: "7px",
                            fontSize: "11px",
                            cursor: "pointer",
                            width: "100%",
                            backgroundColor:
                              token1?.id == token?.id || token2?.id == token?.id
                                ? "transparent"
                                : "transparent",
                            color:
                              token1?.id == token?.id || token2?.id == token?.id
                                ? "#000"
                                : "#000",
                          }}
                          onClick={() => {
                            // Allow selecting the same token for both positions
                            // Only prevent if selecting the same token in the same position
                            if (selected == 1 && token1?.id == token.id) {
                              setTokenDrawer(false);
                              return;
                            }
                            if (selected == 2 && token2?.id == token.id) {
                              setTokenDrawer(false);
                              return;
                            }

                            if (selected == 1) {
                              setToken1(token);
                              handlePositionChange(token);
                            } else {
                              setToken2(token);
                              handleToken2Change(token);
                            }
                            setFilteredTokens(allToken);
                            setKeyword(null);
                            setTokenDrawer(false);
                          }}
                        >
                          {!token.image ? (
                            <div
                              style={{
                                alignItems: "center",
                                backgroundColor: "rgba(98,126,234,.2)",
                                borderRadius: "49%",
                                display: "flex",
                                height: "29px",
                                justifyContent: "center",
                                width: "29px",
                                marginRight: "15px",
                              }}
                            >
                              {token.name?.split("")[0]}
                            </div>
                          ) : (
                            <img
                              style={{
                                width: "29px",
                                marginRight: "15px",
                              }}
                              src={token.image}
                              alt=""
                            />
                          )}

                          <p>
                            <span
                              style={{ fontSize: "17px" }}
                              className="noAddress"
                            >
                              {token.name}{" "}
                            </span>
                            <span
                              className="noAddress"
                              style={{
                                fontSize: "11px",
                                marginLeft: "5px",
                              }}
                            >
                              {token.type ? ` /${token.type}` : null}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                    }}
                  >
                    <p
                      className="noAddress"
                      style={{
                        marginTop: "4%",
                        marginBottom: "15px",
                        fontWeight: "bold",
                        fontSize: "15px",
                      }}
                    >
                      No assets found
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Drawer>
          </div>
        </div>
      </div>

      <ConfirmAbstractModal
        availableTokens={availableTokens}
        token1={token1}
        token2={token2}
        receivedAmount={receivedAmount}
        amount={amount}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        balance={balance}
        fromAddress={mpcFromAddress}
        toAddress={toAddress}
        handleAbstract={handleAbstraction}
        isProcessing={isProcessing}
        platformFee={platformFee}
        solverFee={solverFee}
        networkFee={networkFee || networkFeeRef.current}
      />

      <ModalCustom
        title={"Verify Password"}
        handleCancel={() => {
          setPasswordModal(!isPasswordModalOpen);
          // Clear password when modal is closed/cancelled
          setSessionPassword(null);
          // Reset network fee when cancelling
          networkFeeRef.current = 0;
          setNetworkFee(0);
        }}
        isModalOpen={isPasswordModalOpen}
        customClass="customClassModal"
        closable={!isProcessing}
      >
        <div className="viewphrases">
          <div
            style={{
              marginBottom: "36px",
              width: "100%",
            }}
          >
            <InputFieldSimple
              placeholder="Password"
              getData={setSessionPassword}
              value={sessionPassword}
              type="password"
              customFunction={async () => {
                const isCorrectPassword = await WalletHelper.verifyPassword(
                  sessionPassword
                );
                if (!isCorrectPassword) {
                  return messageApi.error("Incorrect password provided.");
                }
                setPasswordModal(false);
                setIsOpen(true);
              }}
            />
          </div>

          <ButtonComp
            text={"Proceed"}
            maxWidth={"100%"}
            disabled={isProcessing || !sessionPassword}
            onClick={async () => {
              const isCorrectPassword = await WalletHelper.verifyPassword(
                sessionPassword
              );
              if (!isCorrectPassword) {
                return messageApi.error("Incorrect password provided.");
              }
              setPasswordModal(false);
              setIsOpen(true);
            }}
          />
        </div>
      </ModalCustom>

      <AbstractProcessingModal
        showProcessing={isProcessModalOpen}
        setShowProcess={setIsProcessModal}
        showSuccess={showsuccess}
        setSuccessModal={setShowSuccess}
        transactionResult={transactionresult}
        loader={true}
        // onClose={() => {
        //   console.log("Modal was closed!");

        //   // Reset transaction result to initial state (not null)
        //   setTransactionResult({
        //     hash: "",
        //     fee: "",
        //     link: "",
        //     status: "",
        //     symbol: "",
        //     solver: "",
        //     source_address: "",
        //   });

        //   // Reset modal states
        //   setIsProcessModal(false);
        //   setShowSuccess(false);

        //   // Reset input fields
        //   setWithdrawAmount("");
        //   setReceivedAmount("");
        //   setPercent(null);
          
        //   // Reset network fee
        //   networkFeeRef.current = 0;
        //   setNetworkFee(0);
          
        //   // Reset To Address to default MPC address for token2 (only if different from token1)
        //   if (token2 && mpcAddresses) {
        //     // If same token, leave empty
        //     if (token1?.id === token2?.id) {
        //       setToAddress("");
        //     } else {
        //       const getDefaultToAddress = (token, addresses) => {
        //         if (!token || !addresses) {
        //           return "";
        //         }
                
        //         if (token?.coinFamily === 3 || token?.chain?.currencyName === "BTC") {
        //           return addresses?.btc || "";
        //         }
        //         // default to EVM (coinFamily 2 or 7)
        //         return addresses?.eth || "";
        //       };
              
        //       const defaultAddress = getDefaultToAddress(token2, mpcAddresses);
        //       if (defaultAddress) {
        //         setToAddress(defaultAddress);
        //       }
        //     }
        //   }

        //   // Reset processing state
        //   setIsProcessing(false);
          
        //   // Clear password after modal closes
        //   setSessionPassword(null);

        //   // Optionally refresh the balance
        //   if (token1 && mpcFromAddress) {
        //     fetchMpcBalance(token1, mpcFromAddress).then((balance) => {
        //       console.log("Refreshed balance after modal close:", balance);
        //       setBalance(balance);
        //     });
        //   }
        // }}
      />

      {showMpcModel && (
        <MpcModel
          showModal={showMpcModel}
          onClose={(generated) => {
            setShowMpcModel(false);
            if (!generated) {
              navigate("/wallet");
              return;
            }
            // Refresh MPC addresses after successful generation
            getStoredMpcAddresses().then((stored) => {
              if (stored?.eth && stored?.btc) {
                setMpcAddresses(stored);
                init();
              }
            });
          }}
          currentEthAddress={
            account?.coinFamilyAndAddress?.[2] ||
            account?.coinFamilyAndAddress?.["2"]
          }
        />
      )}
    </>
  );
}

export default ChainAbstraction;
