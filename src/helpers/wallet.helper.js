/*global chrome*/
import { SecurityHelper } from "./security.helper";
import * as ethers from "ethers";
import Web3 from "web3";
import { store } from "..";
import { setAccount } from "../actions/accounts";
import { setChain } from "../actions/chains";
import { v4 as uuidv4 } from "uuid";
import { setCurrency } from "../actions/currency";
import { Web3Helper } from "./web3.helper";
import { setTransactions } from "../actions/transactions";
import moment from "moment";
import { setAuth } from "../actions/auth";
import { setPrices } from "../actions/prices";
import { SolanaHelper } from "./solana.helper";
import nacl from "tweetnacl";
import * as bip39 from "@scure/bip39";
import { derivePath } from "ed25519-hd-key";
import { Account } from "@solana/web3.js";
import { BTCHelper } from "./btc.helper";
import { IS_PRODUCTION } from "../config/bitcoin.config";
import { AdaHelper } from "./ada.helper";
import { ETHTokenArray } from "../config/eth.config";
import { BNBTokens } from "../config/bnb.config";
import { AVAXTokens } from "../config/avax.config";
import { MaticTokens } from "../config/matic.config";
import { CROTokens } from "../config/cro.config";
import { SOlToken } from "../config/sol.config";
import { setAlerts } from "../actions/alerts";
import { cloneArrayOfObjects } from "./clone.helper";
import axios from "axios";
import { setBalancesIn } from "../actions/balance-off-out";
import { setNfts } from "../actions/nfts";
import { setTokens } from "../actions/tokens";
import { server } from "../server";
import { spritzHelper } from "./spritz.helper";
import { spritzAccounts, spritzKyc, spritzLogin } from "../actions/spritz";
import { setLoading } from "../actions/loading";
import { TronHelper } from "./tron.helper";
const BIP84 = require("bip84");
const privateKeyToAddress = require("ethereum-private-key-to-address");

export class WalletHelper {
  static accounts = null;

  static checkMnemonics = (mnemonics) => {
    try {
      ethers.Wallet.fromMnemonic(mnemonics);
      return true;
    } catch (error) {
      return false;
    }
  };

  static verifyPassword = async (password) => {
    const { accounts } = await chrome.storage.local.get("accounts");
    const decryptedAccounts = SecurityHelper.decrypt(accounts, password);
    if (!decryptedAccounts) {
      return false;
    }

    return true;
  };

  static unlockWallet = async (password) => {
    try {
      const { accounts } = await chrome.storage.local.get("accounts");
      const { chains } = await chrome.storage.local.get("chains");
      const { currency } = await chrome.storage.local.get("currency");

      const decryptedAccounts = SecurityHelper.decrypt(accounts, password);
      if (!decryptedAccounts) {
        return false;
      }
      const defaultAccount = JSON.parse(decryptedAccounts).find(
        (el) => el.default
      );

      await chrome.storage.session.set({
        password,
      });
      await chrome.storage.session.set({
        accounts: JSON.parse(decryptedAccounts),
      });
      store.dispatch(setAccount(defaultAccount));

      store.dispatch(setChain(chains.find((el) => el.default) || chains[0]));
      store.dispatch(
        setCurrency({
          name: currency.name,
          symbol: currency.symbol,
        })
      );
      store.dispatch(setAuth());
      await this.generateAndSetWalletToRefreshToken();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  static setPasswordInSession = (password) => {
    return chrome.storage.session.set({
      password,
    });
  };

  static generateNewMnemonics = () => {
    const { phrase } = ethers.Wallet.createRandom().mnemonic;
    return phrase;
  };

  static getMnemonics = async (address) => {
    try {
      const { password } = await chrome.storage.session.get("password");
      const { mnemonics } = await chrome.storage.local.get("mnemonics");
      if (mnemonics) {
        const decryptedMnemonics = SecurityHelper.decrypt(mnemonics, password);

        // Parse the decrypted mnemonics
        const mnemonicsList = JSON.parse(decryptedMnemonics);
        console.log("mnemonicsList", mnemonicsList);
        // Find the mnemonic matching the provided address
        const matchedMnemonic = mnemonicsList.find(
          (mnemonic) => mnemonic.address.toLowerCase() === address.toLowerCase()
        );
        console.log("matchedMnemonic", matchedMnemonic);

        // Return the matched mnemonic phrase, or the default if no match
        const defaultMnemonics = matchedMnemonic || mnemonicsList[0];
        return defaultMnemonics.phrase;
      } else {
        // Generate a new mnemonic if none are found
        const { phrase } = ethers.Wallet.createRandom().mnemonic;
        return phrase;
      }
    } catch (error) {
      return false;
    }
  };

  static getPrivateKey = async () => {
    try {
      const { account } = store.getState();
      return account.privateKey;
    } catch (error) {
      return false;
    }
  };

  static getSolanaPrivateKey = async () => {
    try {
      const { password } = await chrome.storage.session.get("password");
      const { mnemonics } = await chrome.storage.local.get("mnemonics");
      const decryptedMnemonics = SecurityHelper.decrypt(mnemonics, password);
      const defaultMnemonics = JSON.parse(decryptedMnemonics).find(
        (el) => el.default
      );
      const seed = await bip39.mnemonicToSeed(defaultMnemonics.phrase);
      const path = `m/44'/501'/0'`;
      const derivedSeed = derivePath(path, seed).key;
      const account = new Account(
        nacl.sign.keyPair.fromSeed(derivedSeed).secretKey
      );
      console.log("lllllllllllDDDDDDDDDDDDDDdddd ");

      return account.secretKey;
    } catch (error) {
      return false;
    }
  };

  static getSolanaPrivateKeyWithAddress = async (address) => {
    console.log("addressInSolana", address);
    const mnemonics = await WalletHelper.getMnemonics(address);
    console.log("mnemonicsinsolana", mnemonics);
    try {
      // const { password } = await chrome.storage.session.get("password");
      // const { mnemonics } = await chrome.storage.local.get("mnemonics");
      // const decryptedMnemonics = SecurityHelper.decrypt(mnemonics, password);
      // const defaultMnemonics = JSON.parse(mnemonics).find((el) => el.default);
      const seed = await bip39.mnemonicToSeed(mnemonics);
      const path = `m/44'/501'/0'`;
      const derivedSeed = derivePath(path, seed).key;
      const account = new Account(
        nacl.sign.keyPair.fromSeed(derivedSeed).secretKey
      );

      return account.secretKey;
    } catch (error) {
      return false;
    }
  };

  static getBitcoinPrivateKey = async () => {
    try {
      const { password } = await chrome.storage.session.get("password");
      const { mnemonics } = await chrome.storage.local.get("mnemonics");
      const decryptedMnemonics = SecurityHelper.decrypt(mnemonics, password);
      const defaultMnemonics = JSON.parse(decryptedMnemonics).find(
        (el) => el.default
      );
      var root = new BIP84.fromSeed(
        defaultMnemonics.phrase,
        "",
        !IS_PRODUCTION
      );
      var child0 = root.deriveAccount(0);
      var account0 = new BIP84.fromZPrv(child0);
      return account0.getPrivateKey(0);
    } catch (error) {
      return false;
    }
  };

  static getBitcoinPrivateKeyWithAddress = async (address) => {
    console.log("addressInBtc", address);

    const mnemonics = await WalletHelper.getMnemonics(address);
    console.log("mnemonics", mnemonics);
    try {
      // const { password } = await chrome.storage.session.get("password");
      // const { mnemonics } = await chrome.storage.local.get("mnemonics");

      // const decryptedMnemonics = SecurityHelper.decrypt(mnemonics, password);
      // console.log("decryptedMnemonics", decryptedMnemonics);

      // const defaultMnemonics = JSON.parse(decryptedMnemonics).find(
      //   (el) => el.default
      // );
      // console.log("defaultMnemonics", defaultMnemonics);

      var root = new BIP84.fromSeed(mnemonics, "", !IS_PRODUCTION);
      var child0 = root.deriveAccount(0);
      var account0 = new BIP84.fromZPrv(child0);
      return account0.getPrivateKey(0);
    } catch (error) {
      return false;
    }
  };

  static getAdaPrivateKey = async () => {
    try {
      const { password } = await chrome.storage.session.get("password");
      const { mnemonics } = await chrome.storage.local.get("mnemonics");
      const decryptedMnemonics = SecurityHelper.decrypt(mnemonics, password);
      const defaultMnemonics = JSON.parse(decryptedMnemonics).find(
        (el) => el.default
      );
      const response = AdaHelper.generateWalletAddress(defaultMnemonics.phrase);
      return response;
    } catch (error) {
      return false;
    }
  };

  static getChains = async () => {
    const { chains } = await chrome.storage.local.get("chains");
    return chains;
  };

  static logout = async () => {
    await chrome.storage.local.remove([
      "accounts",
      "mnemonics",
      "registered",
      "alerts",
      "legalPolicy",
    ]);
    await chrome.storage.session.remove(["accounts", "password"]);
    // await chrome.runtime.reload(true);
    window.location.reload(true);
  };


  static checkIfAlreadyThere = async (newMnemonics) => {
    const { password } = await chrome.storage.session.get("password");
    let { mnemonics } = await chrome.storage.local.get("mnemonics");
    const decryptMnemonics = SecurityHelper.decrypt(mnemonics, password);
    // console.log("mnemonicsmnemonicsmnemonics ", mnemonics);
    // console.log("newMnemonicsnewMnemonicsnewMnemonicsnewMnemonics ", newMnemonics);
    // console.log('JSON.parse(decryptMnemonics)JSON.parse(decryptMnemonics) ', JSON.parse(decryptMnemonics));


    if (decryptMnemonics) {
      const checkIfThere = JSON.parse(decryptMnemonics).find(
        (el) => el.phrase === newMnemonics
      );
      // console.log("checkIfTherecheckIfThere ", checkIfThere);
      
      if (checkIfThere) return true;
      return false;
    } else {
      return false;
    }
  };

  static generateAndSetWalletForWatchOnlySameWallet = async (
    coinFamily,
    address,
    accountId
  ) => {
    let coinSymbol = "ETH";

    switch (coinFamily) {
      case 1:
        coinSymbol = "ETH";
        break;
      case 2:
        coinSymbol = "BTC";
        break;
      case 3:
        coinSymbol = "BNB";
        break;
      case 4:
        coinSymbol = "SOL";
        break;
      case 5:
        coinSymbol = "ADA";
        break;
      case 6:
        coinSymbol = "POL";
        break;
      case 7:
        coinSymbol = "AVAX";
        break;
      case 8:
        coinSymbol = "CRO";
        break;
      case 9:
        coinSymbol = "PLS";
        break;
      default:
        break;
    }

    try {
      const { password } = await chrome.storage.session.get("password");
      let { accounts } = await chrome.storage.session.get("accounts");
      const { chains } = await chrome.storage.local.get("chains");
      const { currency } = await chrome.storage.local.get("currency");

      const account = accounts.find((el) => el.id == accountId);

      const { deviceId } = await chrome.storage.local.get("deviceId");

      await server.post(
        `${process.env.REACT_APP_BASE_URL}/wallet/create`,
        {
          wallet_address: address,
          address_list: [
            {
              coin_symbol: coinSymbol.toLowerCase(),
              coin_family: coinFamily,
              wallet_address: address,
            },
          ],
          wallet_name: account.name,
          device_token: "chrome",
          is_default: 1,
          device_type: "android",
          is_watch_only: 1,
          coin_family: coinFamily,
          device_id: deviceId,
        },
        {
          headers: {
            Authorization:
              accounts.length !== 0 ? accounts[0].jwtToken : undefined,
          },
        }
      );

      await server.post(
        "/wallet/reterive_wallet_balance",
        {
          address_list: [
            {
              coin_symbol: coinSymbol.toLowerCase(),
              coin_family: coinFamily,
              wallet_address: address,
            },
          ],
          fiat_currency: "USD",
          is_watch_only: 1,
          wallet_address: address,
        },
        {
          headers: {
            Authorization:
              accounts.length !== 0 ? accounts[0].jwtToken : undefined,
          },
        }
      );

      const updatedAccount = {
        id: account.id,
        address: account.address,
        isWatchOnly: true,
        name: account.name,
        default: true,
        coinFamilyAndAddress: {
          1: coinFamily == 1 ? address : account.coinFamilyAndAddress[1],
          2: coinFamily == 2 ? address : account.coinFamilyAndAddress[2],
          3: coinFamily == 3 ? address : account.coinFamilyAndAddress[3],
          4: coinFamily == 4 ? address : account.coinFamilyAndAddress[4],
          5: coinFamily == 5 ? address : account.coinFamilyAndAddress[5],
          6: coinFamily == 6 ? address : account.coinFamilyAndAddress[6],
          7: coinFamily == 7 ? address : account.coinFamilyAndAddress[7],
          8: coinFamily == 8 ? address : account.coinFamilyAndAddress[8],
          9: coinFamily == 9 ? address : account.coinFamilyAndAddress[9],
        },
        coinFamilies: [...account.coinFamilies, coinFamily],
        addressLists: [...account.addressLists, address],
        jwtToken: account.jwtToken,
        refreshToken: account.refreshToken,
        deviceId: deviceId,
        totalBalanceShow: account.totalBalanceShow,
        balanceIn: account.balanceIn,
      };

      console.log(
        "🚀 ~ file: wallet.helper.js:973 ~ WalletHelper ~ updatedAccount:",
        updatedAccount
      );

      const foundIndex = accounts.findIndex((x) => x.id == updatedAccount.id);
      console.log(
        "🚀 ~ file: wallet.helper.js:983 ~ WalletHelper ~ foundIndex:",
        foundIndex
      );
      accounts[foundIndex] = updatedAccount;

      const encryptedAccounts = SecurityHelper.encrypt(accounts, password);

      await chrome.storage.local.set({
        accounts: encryptedAccounts,
        registered: true,
      });

      await chrome.storage.session.set({ accounts: accounts });

      store.dispatch(setAccount(accounts.find((el) => el.default)));

      store.dispatch(setChain(chains.find((el) => el.default)));

      store.dispatch(
        setCurrency({
          name: currency.name,
          symbol: currency.symbol,
        })
      );

      store.dispatch(setAuth());
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  static generateAndSetWalletForWatchOnly = async (
    name,
    coinFamily,
    address
  ) => {
    let coinSymbol = "ETH";

    switch (coinFamily) {
      case 1:
        coinSymbol = "ETH";
        break;
      case 2:
        coinSymbol = "BTC";
        break;
      case 3:
        coinSymbol = "BNB";
        break;
      case 4:
        coinSymbol = "SOL";
        break;
      case 5:
        coinSymbol = "ADA";
        break;
      case 6:
        coinSymbol = "POL";
        break;
      case 7:
        coinSymbol = "AVAX";
        break;
      case 8:
        coinSymbol = "CRO";
        break;
      case 9:
        coinSymbol = "PLS";
        break;
      default:
        break;
    }

    try {
      const { password } = await chrome.storage.session.get("password");
      let { accounts } = await chrome.storage.session.get("accounts");
      const { chains } = await chrome.storage.local.get("chains");
      const { currency } = await chrome.storage.local.get("currency");

      if (!accounts) {
        accounts = [];
      }

      const { deviceId } = await chrome.storage.local.get("deviceId");
      const createWallet = await server.post(
        `${process.env.REACT_APP_BASE_URL}/wallet/create`,
        {
          wallet_address: address,
          address_list: [
            {
              coin_symbol: coinSymbol.toLowerCase(),
              coin_family: coinFamily,
              wallet_address: address,
            },
          ],
          wallet_name: name,
          device_token: "chrome",
          is_default: 1,
          device_type: "android",
          is_watch_only: 1,
          coin_family: coinFamily,
          device_id: deviceId,
        },
        {
          headers: {
            Authorization:
              accounts.length !== 0 ? accounts[0].jwtToken : undefined,
          },
        }
      );

      await server.post(
        "/wallet/reterive_wallet_balance",
        {
          address_list: [
            {
              coin_symbol: coinSymbol.toLowerCase(),
              coin_family: coinFamily,
              wallet_address: address,
            },
          ],
          fiat_currency: "USD",
          is_watch_only: 1,
          wallet_address: address,
        },
        {
          headers: {
            Authorization:
              accounts.length !== 0 ? accounts[0].jwtToken : undefined,
          },
        }
      );

      const finalAccounts = [
        ...accounts,
        {
          id: uuidv4(),
          address: address,
          isWatchOnly: true,
          name,
          default: accounts.length === 0 ? true : false,
          coinFamilyAndAddress: {
            1: coinFamily == 1 ? address : null,
            2: coinFamily == 2 ? address : null,
            3: coinFamily == 3 ? address : null,
            4: coinFamily == 4 ? address : null,
            5: coinFamily == 5 ? address : null,
            6: coinFamily == 6 ? address : null,
            7: coinFamily == 7 ? address : null,
            8: coinFamily == 8 ? address : null,
            9: coinFamily == 9 ? address : null,
          },
          coinFamilies: [coinFamily],
          addressLists: [address],
          jwtToken:
            accounts.length === 0
              ? createWallet.data.token
              : accounts[0].jwtToken,
          refreshToken:
            accounts.length === 0
              ? createWallet.data.refresh_token
              : accounts[0].refreshToken,
          deviceId: deviceId,
          totalBalanceShow: true,
        },
      ];

      const encryptedAccounts = SecurityHelper.encrypt(finalAccounts, password);

      await chrome.storage.local.set({
        accounts: encryptedAccounts,
        registered: true,
      });

      await chrome.storage.session.set({ accounts: finalAccounts });

      store.dispatch(setAccount(finalAccounts.find((el) => el.default)));

      store.dispatch(setChain(chains.find((el) => el.default)));

      store.dispatch(
        setCurrency({
          name: currency.name,
          symbol: currency.symbol,
        })
      );

      store.dispatch(setAuth());
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  static generateAndSetWalletPrivateKey = async (privateKey, name) => {
    try {
      const { password } = await chrome.storage.session.get("password");
      let { accounts } = await chrome.storage.session.get("accounts");
      const { chains } = await chrome.storage.local.get("chains");
      const { currency } = await chrome.storage.local.get("currency");

      if (!accounts) {
        accounts = [];
      }

      const address = await privateKeyToAddress(privateKey);
      const solanaAddress =
        await SolanaHelper.generateSolanaAddressFromPrivateKey(privateKey);
      const bitcoinAddress = await BTCHelper.generateBitcoinAddress(privateKey);

      const { deviceId } = await chrome.storage.local.get("deviceId");

      const createWallet = await server.post(
        `${process.env.REACT_APP_BASE_URL}/user/create/wallet`,
        {
          device_id: deviceId,
          wallet_address: address,
          device_token: "chrome",
          wallet_name: name,
          referral_code: "",
          addressList: [
            {
              symbol: "bnb",
              address: address,
              coin_family: 1,
            },
            {
              symbol: "eth",
              address: address,
              coin_family: 2,
            },
            {
              symbol: "btc",
              address: bitcoinAddress,
              coin_family: 3,
            },
            {
              symbol: "matic",
              address: address,
              coin_family: 4,
            },
            {
              symbol: "sol",
              address: solanaAddress,
              coin_family: 5,
            },
          ],
        },
        {
          headers: {
            Authorization:
              accounts.length !== 0 ? accounts[0].jwtToken : undefined,
          },
        }
      );
 
      const id = uuidv4();

      const finalAccounts = [
        ...accounts,
        {
          id,
          address: address,
          isWatchOnly: false,
          privateKey,
          path: null,
          name,
          default: accounts.length === 0 ? true : false,
          coinFamilyAndAddress: {
            1: address,
            2: address,
            3: bitcoinAddress,
            4: address,
            5: solanaAddress,
          },
          coinFamilies: [1, 2, 3, 4, 5],
          addressLists: [
            address,
            address,
            bitcoinAddress,
            address,
            solanaAddress,
          ],
          userId: createWallet.data.data.userId,
          jwtToken:
            accounts.length === 0
              ? createWallet.data.data.token
              : accounts[0].jwtToken,
          refreshToken:
            accounts.length === 0
              ? createWallet.data.data.refreshToken
              : accounts[0].refreshToken,
          deviceId: deviceId,
          totalBalanceShow: true,
          importedUsingPrivateKey: true,
        },
      ];

      const encryptedAccounts = SecurityHelper.encrypt(finalAccounts, password);

      await chrome.storage.local.set({
        accounts: encryptedAccounts,
        registered: true,
      });

      await chrome.storage.session.set({ accounts: finalAccounts });

      store.dispatch(setAccount(finalAccounts.find((el) => el.default)));

      store.dispatch(setChain(chains.find((el) => el.default)));

      store.dispatch(
        setCurrency({
          name: currency.name,
          symbol: currency.symbol,
        })
      );

      store.dispatch(setAuth());
      return id;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  static generateAndSetWallet = async (newMnemonics, name, type) => {
    try {
      const { password } = await chrome.storage.session.get("password");
      let { accounts } = await chrome.storage.session.get("accounts");
      const { chains } = await chrome.storage.local.get("chains");
      const { currency } = await chrome.storage.local.get("currency");
      let { mnemonics } = await chrome.storage.local.get("mnemonics");
      // console.log("MNEMONICS in generateAndSetWallet", mnemonics);
      const solanaAddress = await SolanaHelper.generateSolanaAddress(
        newMnemonics
      );
      const bitcoinAddress = await BTCHelper.generateBitcoinAddress(
        newMnemonics
      );
      // console.log("ADDDDD ", solanaAddress);

      // const tronAddress = await TronHelper.generateTronAddress(newMnemonics);

      // const adaAddress =
      //   AdaHelper.generateWalletAddress(newMnemonics).baseAddress;

      if (!accounts) {
        accounts = [];
      }

      newMnemonics = newMnemonics?.toLowerCase();
      // console.log("AAAAAAAAAAAAAAAAAAAA ", newMnemonics);

      const { address, privateKey } = ethers.Wallet.fromMnemonic(
        newMnemonics,
        // `m/44'/60'/0'/0/${accounts.length}`
        `m/44'/60'/0'/0/0`
      );


      // console.log(`m/44'/60'/0'/0/${accounts.length}`);

      if (!mnemonics) {
        mnemonics = [];
      } else {
        mnemonics = SecurityHelper.decrypt(mnemonics, password);
        mnemonics = JSON.parse(mnemonics);
        if(!Array.isArray(mnemonics)){
          mnemonics=[mnemonics]
        }
      }
      const finalMnemonics = [
        ...mnemonics,
        {
          phrase: newMnemonics,
          default: accounts?.length === 0 ? true : false,
          address: address,
        },
      ];
      // console.log("Finallll ", finalMnemonics);

      const { deviceId } = await chrome.storage.local.get("deviceId");

      const createWallet = await server.post(
        `${process.env.REACT_APP_BASE_URL}/user/create/wallet`,
        {
          device_id: deviceId,
          wallet_address: address,
          device_token: "chrome",
          wallet_name: name,
          referral_code: "",
          addressList: [
            {
              symbol: "bnb",
              address: address,
              coin_family: 1,
            },
            {
              symbol: "eth",
              address: address,
              coin_family: 2,
            },
            {
              symbol: "btc",
              address: bitcoinAddress,
              coin_family: 3,
            },
            {
              symbol: "pol",
              address: address,
              coin_family: 4,
            },
            {
              symbol: "sol",
              address: solanaAddress,
              coin_family: 5,
            },
            // {
            //   symbol: 'trx',
            //   address: tronAddress,
            //   coin_family: 6,
            // }
          ],
        },
        {
          headers: {
            Authorization:
              accounts.length !== 0 ? accounts[0].jwtToken : undefined,
          },
        }
      );

      // console.log("Createeeeeeeeee ", createWallet);
      const id = uuidv4();

      const finalAccounts = [
        ...accounts.map((account) => ({
          ...account,
          default: false, // Set all existing accounts' default to false
        })),
        {
          id,
          address: address,
          isWatchOnly: false,
          privateKey,
          path: `m/44'/60'/0'/0/${accounts.length + 1}`,
          name,
          // default: accounts.length === 0 ? true : false,
          default: true, // make default
          coinFamilyAndAddress: {
            1: address,
            2: address,
            3: bitcoinAddress,
            4: address,
            5: solanaAddress,
          },
          coinFamilies: [1, 2, 3, 4, 5],
          addressLists: [
            address,
            address,
            bitcoinAddress,
            address,
            solanaAddress,
          ],
          userId: createWallet.data.data.userId,
          jwtToken: createWallet.data.data.token,
          refreshToken: createWallet.data.data.refreshToken,
          deviceId: deviceId,
          totalBalanceShow: true,
        },
      ];

      const encryptedMnemonics = SecurityHelper.encrypt(
        finalMnemonics,
        password
      );

      const encryptedAccounts = SecurityHelper.encrypt(finalAccounts, password);

      await chrome.storage.local.set({
        accounts: encryptedAccounts,
        mnemonics: encryptedMnemonics,
        registered: true,
      });

      await chrome.storage.session.set({ accounts: finalAccounts });

      store.dispatch(setAccount(finalAccounts.find((el) => el.default)));

      store.dispatch(setChain(chains.find((el) => el.default)));

      store.dispatch(
        setCurrency({
          name: currency.name,
          symbol: currency.symbol,
        })
      );

      store.dispatch(setAuth());
      return id;
    } catch (error) {
      console.log(error);
      // return false;
      throw error?.response?.data?.message || "Something went wrong.";
    }
  };

  static generateAndSetWalletToRefreshToken = async () => {
    try {
      const { password } = await chrome.storage.session.get("password");
      let { accounts } = await chrome.storage.session.get("accounts");
      const { chains } = await chrome.storage.local.get("chains");
      const { currency } = await chrome.storage.local.get("currency");
      const { deviceId } = await chrome.storage.local.get("deviceId");
      const defaultAccount = accounts.find((el) => el.default);

      const response = await server.post(
        `/auth/authorisation`,
        {
          token: defaultAccount.jwtToken,
          refreshToken: defaultAccount.refreshToken,
        },
        {
          headers: {
            Authorization: defaultAccount.jwtToken,
          },
        }
      );

      const updateAccounts = accounts.map((el) => {
        if (el.id === defaultAccount.id) {
          el.jwtToken = response.data.token;
          el.refreshToken = response.data.refreshToken;
          el.deviceId = deviceId;
          return el;
        } else {
          return el;
        }
      });

      const encryptedAccounts = SecurityHelper.encrypt(
        updateAccounts,
        password
      );

      await chrome.storage.local.set({
        accounts: encryptedAccounts,
        registered: true,
      });

      await chrome.storage.session.set({ accounts: updateAccounts });

      store.dispatch(setAccount(updateAccounts.find((el) => el.default)));

      store.dispatch(setChain(chains.find((el) => el.default)));

      store.dispatch(
        setCurrency({
          name: currency.name,
          symbol: currency.symbol,
        })
      );

      store.dispatch(setAuth());
      store.dispatch(setLoading(false));
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  static updateWalletName = async (name, id) => {
    const { password } = await chrome.storage.session.get("password");
    try {
      const { accounts } = await chrome.storage.local.get("accounts");
      const decryptedAccounts = SecurityHelper.decrypt(accounts, password);

      if (!decryptedAccounts) {
        return false;
      }

      const updateAccounts = JSON.parse(decryptedAccounts).map((el) => {
        if (el.id == id) {
          el.name = name;
          return el;
        }
        return el;
      });

      const encryptedAccounts = SecurityHelper.encrypt(
        updateAccounts,
        password
      );

      await chrome.storage.local.set({
        accounts: encryptedAccounts,
      });
      await chrome.storage.session.set({
        accounts: updateAccounts,
      });
      store.dispatch(setAccount(updateAccounts.find((el) => el.default)));
      return true;
    } catch (error) {
      return false;
    }
  };

  static updatePassword = async (oldPassword, newPassword) => {
    try {
      const { accounts } = await chrome.storage.local.get("accounts");
      const { mnemonics } = await chrome.storage.local.get("mnemonics");

      const decryptedMnemonics = SecurityHelper.decrypt(mnemonics, oldPassword);
      const decryptedAccounts = SecurityHelper.decrypt(accounts, oldPassword);

      if (!decryptedAccounts) {
        return false;
      }

      if (!decryptedMnemonics) {
        return false;
      }

      const encryptedAccounts = SecurityHelper.encrypt(
        JSON.parse(decryptedAccounts),
        newPassword
      );

      const encryptedMnemonics = SecurityHelper.encrypt(
        JSON.parse(decryptedMnemonics),
        newPassword
      );

      await chrome.storage.local.set({
        accounts: encryptedAccounts,
        mnemonics: encryptedMnemonics,
      });

      await chrome.storage.session.set({
        password: newPassword,
      });

      return true;
    } catch (error) {
      return false;
    }
  };

  static updateShowTotalBalance = async (status, id) => {
    const { password } = await chrome.storage.session.get("password");
    try {
      const { accounts } = await chrome.storage.local.get("accounts");
      const decryptedAccounts = SecurityHelper.decrypt(accounts, password);

      if (!decryptedAccounts) {
        return false;
      }

      const updateAccounts = JSON.parse(decryptedAccounts).map((el) => {
        if (el.id == id) {
          el.totalBalanceShow = status;
          return el;
        }
        return el;
      });

      const encryptedAccounts = SecurityHelper.encrypt(
        updateAccounts,
        password
      );

      await chrome.storage.local.set({
        accounts: encryptedAccounts,
      });
      await chrome.storage.session.set({
        accounts: updateAccounts,
      });
      store.dispatch(setAccount(updateAccounts.find((el) => el.default)));
      return true;
    } catch (error) {
      return false;
    }
  };

  static updateBalanceInShow = async (status, id) => {
    const { password } = await chrome.storage.session.get("password");
    try {
      const { accounts } = await chrome.storage.local.get("accounts");
      const decryptedAccounts = SecurityHelper.decrypt(accounts, password);

      if (!decryptedAccounts) {
        return false;
      }

      const updateAccounts = JSON.parse(decryptedAccounts).map((el) => {
        if (el.id == id) {
          el.balanceIn = status;
          return el;
        }
        return el;
      });

      const encryptedAccounts = SecurityHelper.encrypt(
        updateAccounts,
        password
      );

      await chrome.storage.local.set({
        accounts: encryptedAccounts,
      });
      await chrome.storage.session.set({
        accounts: updateAccounts,
      });
      store.dispatch(setAccount(updateAccounts.find((el) => el.default)));
      return true;
    } catch (error) {
      return false;
    }
  };

  static updateTokens = async (jwtToken, refreshToken) => {
    const { password } = await chrome.storage.session.get("password");
    try {
      const { accounts } = await chrome.storage.local.get("accounts");
      const decryptedAccounts = SecurityHelper.decrypt(accounts, password);

      if (!decryptedAccounts) {
        return false;
      }

      const updateAccounts = JSON.parse(decryptedAccounts).map((el) => {
        if (el.default) {
          el.jwtToken = jwtToken;
          el.refreshToken = refreshToken;
          return el;
        }
        return el;
      });

      const encryptedAccounts = SecurityHelper.encrypt(
        updateAccounts,
        password
      );

      await chrome.storage.local.set({
        accounts: encryptedAccounts,
      });
      await chrome.storage.session.set({
        accounts: updateAccounts,
      });
      store.dispatch(setAccount(updateAccounts.find((el) => el.default)));
      return true;
    } catch (error) {
      return false;
    }
  };

  static setCurrencyPreference = async (currency) => {
    await chrome.storage.local.set({
      currency,
    });
    store.dispatch(setCurrency(currency));
  };

  static setNetworkPreference = async (chainId) => {
    const { chains } = await chrome.storage.local.get("chains");

    const updatedChains = chains.map((el) => {
      if (el.chainId == chainId) {
        el.default = true;
      } else {
        el.default = false;
      }
      return el;
    });

    await chrome.storage.local.set({
      chains: updatedChains,
    });

    store.dispatch(setChain(updatedChains.find((el) => el.default)));
  };

  static setWalletPreference = async (walletId) => {
    try {
      console.log(walletId, "walletId");
      const { password } = await chrome.storage.session.get("password");
      const { accounts } = await chrome.storage.local.get("accounts");

      const decryptedAccounts = SecurityHelper.decrypt(accounts, password);

      const updatesAccounts = JSON.parse(decryptedAccounts).map((el) => {
        if (el.id === walletId) {
          el.default = true;
        } else {
          el.default = false;
        }
        return el;
      });
      const encryptedAccounts = SecurityHelper.encrypt(
        updatesAccounts,
        password
      );

      await chrome.storage.local.set({
        accounts: encryptedAccounts,
      });

      store.dispatch(
        setBalancesIn(
          updatesAccounts.find((el) => el.default).balanceIn !== null ||
            updatesAccounts.find((el) => el.default).balanceIn !== undefined
            ? updatesAccounts.find((el) => el.default).balanceIn === false
              ? false
              : true
            : true
        )
      );
      store.dispatch(setNfts([]));
      store.dispatch(setTokens([]));
      await chrome.storage.session.set({ accounts: updatesAccounts });
      store.dispatch(setAccount(updatesAccounts.find((el) => el.default)));
      await this.generateAndSetWalletToRefreshToken();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };


  static removeMnemonic = async (address) => {

    const { password } = await chrome.storage.session.get("password");
    const { mnemonics } = await chrome.storage.local.get("mnemonics");
    if (mnemonics) {
      const decryptedMnemonics = SecurityHelper.decrypt(mnemonics, password);

      // Parse the decrypted mnemonics
      const mnemonicsList = JSON.parse(decryptedMnemonics);
      console.log("mnemonicsList", mnemonicsList);
      // Find the mnemonic matching the provided address
      const unmatchedMnemonic = mnemonicsList.filter(
        (mnemonic) => mnemonic.address.toLowerCase() !== address.toLowerCase()
      );
      console.log("unmatchedMnemonic", unmatchedMnemonic);
      // if (unmatchedMnemonic.length == 1) {
        // const encryptedAgain = SecurityHelper.encrypt([unmatchedMnemonic[unmatchedMnemonic.length-1]], password);
        // chrome.storage.local.set({
        //   mnemonics: encryptedAgain,
        //   registered: true,
        // });
      // } else {
        const encryptedAgain = SecurityHelper.encrypt(unmatchedMnemonic, password);

        console.log("encryptedAgain", encryptedAgain);
        chrome.storage.local.set({
          mnemonics: encryptedAgain,
          registered: true,
        });
      // }

    }
  }

  static deleteWallet = async (id, evmAddress) => {
    const { password } = await chrome.storage.session.get("password");
    const { accounts } = await chrome.storage.local.get("accounts");
    const decryptedAccounts = SecurityHelper.decrypt(accounts, password);

    console.log("decryptedAccounts-----------> ", decryptedAccounts);

    const newAccounts = JSON.parse(decryptedAccounts).filter(
      (el) => el.id !== id
    );

    const newAccountsEncrypted = SecurityHelper.encrypt(newAccounts, password);

    await chrome.storage.local.set({
      accounts: newAccountsEncrypted,
    });

    await chrome.storage.session.set({
      accounts: newAccounts,
    });

    store.dispatch(setAccount(newAccounts.find((el) => el.default)));
  };

  static reorderWallet = async (accounts) => {
    const { password } = await chrome.storage.session.get("password");

    const newAccounts = accounts;

    const newAccountsEncrypted = SecurityHelper.encrypt(newAccounts, password);
    await chrome.storage.local.set({
      accounts: newAccountsEncrypted,
    });

    await chrome.storage.session.set({
      accounts: newAccounts,
    });

    store.dispatch(setAccount(newAccounts.find((el) => el.default)));
  };

  static addAlert = async (
    coinId,
    type,
    price,
    accountId,
    currencyName,
    currencySymbol,
    selectedToken
  ) => {
    try {
      let { alerts } = await chrome.storage.local.get("alerts");

      alerts.push({
        id: uuidv4(),
        coinId,
        type,
        price,
        sent: false,
        accountId,
        currencyName,
        currencySymbol,
        selectedToken,
      });

      await chrome.storage.local.set({
        alerts,
      });

      store.dispatch(setAlerts(alerts));
    } catch (error) {
      return false;
    }
  };

  static editAlert = async (uuid, type, price) => {
    try {
      let { alerts } = await chrome.storage.local.get("alerts");

      const list = alerts.map((el) => {
        if (el.id == uuid) {
          el.type = type;
          el.price = price;
          el.sent = false;
          return el;
        } else {
          return el;
        }
      });

      alerts = list;
      await chrome.storage.local.set({
        alerts,
      });

      store.dispatch(setAlerts(alerts));
    } catch (error) {
      console.log(error);
    }
  };

  static removeAlert = async (uuid) => {
    console.log(
      "🚀 ~ file: wallet.helper.js:1649 ~ WalletHelper ~ removeAlert= ~ uuid:",
      uuid
    );
    try {
      let { alerts } = await chrome.storage.local.get("alerts");

      const list = alerts.filter((el) => el.id != uuid);
      alerts = list;

      await chrome.storage.local.set({
        alerts,
      });

      store.dispatch(setAlerts(alerts));
    } catch (error) {
      console.log(error);
    }
  };
}
