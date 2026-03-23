/*global chrome*/
import { SecurityHelper } from './security.helper';
import * as ethers from 'ethers';
import { store } from '..';
import { setAccount } from '../actions/accounts';
import { setChain } from '../actions/chains';
import { v4 as uuidv4 } from 'uuid';
import { setCurrency } from '../actions/currency';
import { setAuth } from '../actions/auth';
import { SolanaHelper } from './solana.helper';
import nacl from 'tweetnacl';
import * as bip39 from '@scure/bip39';
import { derivePath } from 'ed25519-hd-key';
import { Account } from '@solana/web3.js';
import { BTCHelper } from './btc.helper';
import { IS_PRODUCTION } from '../config/bitcoin.config';
import { AdaHelper } from './ada.helper';
import { setAlerts } from '../actions/alerts';
import { setBalancesIn } from '../actions/balance-off-out';
import { setNfts } from '../actions/nfts';
import { setTokens } from '../actions/tokens';
import { server } from '../server';
import { setLoading } from '../actions/loading';
import { generateCosmosWalletAddress } from './cosmos.helper';
import {
  clearWalletDvpnState,
  getDvpnWalletAddress,
} from '../services/dvpn/storage';
const BIP84 = require('bip84');
const privateKeyToAddress = require('ethereum-private-key-to-address');

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
    const { mnemonics } = await chrome.storage.local.get('mnemonics');
    const decryptedMnemonics = await SecurityHelper.decrypt(
      mnemonics,
      password
    );
    if (!decryptedMnemonics) {
      return false;
    }

    return true;
  };

  static unlockWallet = async (password) => {
    // console.log('UNLOCK WALLET');
    try {
      const { accounts } = await chrome.storage.local.get('accounts');
      const { chains } = await chrome.storage.local.get('chains');
      const { currency } = await chrome.storage.local.get('currency');

      const isVerified = await this.verifyPassword(password);
      // console.log(
      //   '🚀 ~ WalletHelper ~ staticunlockWal ~ isVerified:',
      //   isVerified
      // );

      if (!isVerified) {
        return false;
      }
      const defaultAccount = accounts.find((el) => el.default);
      // console.log(
      //   '🚀 ~ WalletHelper ~ staticunlockWal ~ defaultAccount:',
      //   defaultAccount
      // );

      await chrome.storage.session.set({
        accounts: accounts,
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
      // console.log('Error unlocking wallet :', error);
      return false;
    }
  };

  static generateNewMnemonics = () => {
    const { phrase } = ethers.Wallet.createRandom().mnemonic;
    return phrase;
  };

  static getMnemonics = async (address) => {
    // console.log('GET MNEMONICS FUNCTION', address)
    try {
      const { password } = await chrome.storage.session.get('password');
      const { mnemonics } = await chrome.storage.local.get('mnemonics');
      if (mnemonics) {
        // console.log('FOUND MNEMONICS', address)
        const decryptedMnemonics = await SecurityHelper.decrypt(
          mnemonics,
          password
        );

        // Parse the decrypted mnemonics
        const mnemonicsList = JSON.parse(decryptedMnemonics);
        // console.log("mnemonicsList", mnemonicsList);
        // Find the mnemonic matching the provided address
        const matchedMnemonic = mnemonicsList.find(
          (mnemonic) => mnemonic.address.toLowerCase() === address.toLowerCase()
        );
        // console.log("matchedMnemonic", matchedMnemonic);

        // Return the matched mnemonic phrase, or the default if no match
        const defaultMnemonics = matchedMnemonic || mnemonicsList[0];
        return defaultMnemonics.phrase;
      } else {
        // console.log('GENETRATE MNEMONICS', address)
        // Generate a new mnemonic if none are found
        const { phrase } = ethers.Wallet.createRandom().mnemonic;
        return phrase;
      }
    } catch (error) {
      return false;
    }
  };

  static getMnemonicsByPassword = async (address, password) => {
    try {
      const { mnemonics } = await chrome.storage.local.get('mnemonics');
      if (mnemonics) {
        const decryptedMnemonics = await SecurityHelper.decrypt(
          mnemonics,
          password
        );

        const mnemonicsList = JSON.parse(decryptedMnemonics);
        const matchedMnemonic = mnemonicsList.find(
          (mnemonic) =>
            mnemonic?.address?.toLowerCase() === address?.toLowerCase()
        );
        const defaultMnemonics = matchedMnemonic || mnemonicsList[0];
        return defaultMnemonics.phrase;
      } else {
        const { phrase } = ethers.Wallet.createRandom().mnemonic;
        return phrase;
      }
    } catch (error) {
      return false;
    }
  };

  static generateNewMnemonics = () => {
    const { phrase } = ethers.Wallet.createRandom().mnemonic;
    return phrase;
  };

  static getPrivateKey = () => {
    try {
      const { account } = store.getState();
      return account.privateKey;
    } catch (error) {
      return false;
    }
  };

  static getPrivateKeyEvm = async (password) => {
    let phrase = '';
    const { mnemonics } = await chrome.storage.local.get('mnemonics');
    const decryptedMnemonics = await SecurityHelper.decrypt(
      mnemonics,
      password
    );
    try {
      const mnemonics = JSON.parse(decryptedMnemonics);
      mnemonics?.map((item) => {
        if (item.default) {
          phrase = item.phrase;
        }
      });
      const result = ethers.Wallet.fromMnemonic(phrase);
      // console.log('🚀 ~ WalletHelper ~ getPrivateKeyEvm= ~ result:', result);
      return result;
    } catch (error) {
      return false;
    }
  };

  static getPrivateKeyWithPassword = async (account, password) => {
    let phrase = '';
    const { mnemonics } = await chrome.storage.local.get('mnemonics');
    const decryptedMnemonics = await SecurityHelper.decrypt(
      mnemonics,
      password
    );
    try {
      const parsedMnemonis = JSON.parse(decryptedMnemonics);
      parsedMnemonis.map((item) => {
        if (item?.address === account?.address) {
          phrase = item.phrase;
        }
      });
      const result = ethers.Wallet.fromMnemonic(phrase);
      return result;
    } catch (error) {
      return false;
    }
  };

  static getSolanaPrivateKeyWithAddress = async (address, password) => {
    const mnemonics = await WalletHelper.getMnemonicsByPassword(
      address,
      password
    );
    try {
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
      const { password } = await chrome.storage.session.get('password');
      const { mnemonics } = await chrome.storage.local.get('mnemonics');

      const decryptedMnemonics = await SecurityHelper.decrypt(
        mnemonics,
        password
      );

      const defaultMnemonics = JSON.parse(decryptedMnemonics).find(
        (el) => el.default
      );
      var root = new BIP84.fromSeed(
        defaultMnemonics.phrase,
        '',
        !IS_PRODUCTION
      );
      var child0 = root.deriveAccount(0);
      var account0 = new BIP84.fromZPrv(child0);
      return account0.getPrivateKey(0);
    } catch (error) {
      return false;
    }
  };

  static getBitcoinPrivateKeyWithPassword = async (address, password) => {
    try {
      const { mnemonics } = await chrome.storage.local.get('mnemonics');

      const decryptedMnemonics = await SecurityHelper.decrypt(
        mnemonics,
        password
      );

      const mnemonicsList = JSON.parse(decryptedMnemonics);
      // Find the mnemonic matching the provided address
      const matchedMnemonic = mnemonicsList.find(
        (mnemonic) => mnemonic.address.toLowerCase() === address.toLowerCase()
      );

      // If no match found, fall back to default mnemonic
      const targetMnemonics = matchedMnemonic || mnemonicsList.find(
        (el) => el.default
      );

      if (!targetMnemonics) {
        return false;
      }

      var root = new BIP84.fromSeed(
        targetMnemonics.phrase,
        "",
        !IS_PRODUCTION
      );
      var child0 = root.deriveAccount(0);
      var account0 = new BIP84.fromZPrv(child0);
      // console.log(
      //   '🚀 ~ WalletHelper ~ getBitcoinPrivateKeyWithPassword= ~ account0:',
      //   account0,
      //   account0.getAddress(0),
      //   account0.getAccountPrivateKey(0)
      // );
      return account0.getPrivateKey(0);
    } catch (error) {
      return false;
    }
  };

  static getBitcoinPrivateKeyWithAddress = async (address, password) => {
    const mnemonics = await WalletHelper.getMnemonicsByPassword(
      address,
      password
    );
    try {
      var root = new BIP84.fromSeed(mnemonics, '', !IS_PRODUCTION);
      var child0 = root.deriveAccount(0);
      var account0 = new BIP84.fromZPrv(child0);
      return account0.getPrivateKey(0);
    } catch (error) {
      return false;
    }
  };

  static getChains = async () => {
    const { chains } = await chrome.storage.local.get('chains');
    return chains;
  };

  static logout = async () => {
    await chrome.storage.local.remove([
      'accounts',
      'mnemonics',
      'registered',
      'alerts',
      'legalPolicy',
    ]);
    await chrome.storage.session.remove(['accounts']);
    window.location.reload(true);
  };

  static isAccountExistWithMnemonics = async (newMnemonics, password) => {
    let { mnemonics } = await chrome.storage.local.get('mnemonics');
    const decryptMnemonics = await SecurityHelper.decrypt(mnemonics, password);
    if (decryptMnemonics) {
      const checkIfThere = JSON.parse(decryptMnemonics).find(
        (el) => el.phrase === newMnemonics
      );
      if (checkIfThere) return true;
      return false;
    } else {
      return false;
    }
  };

  static generateAndSetWalletForWatchOnlySameWallet = async (
    coinFamily,
    address,
    accountId,
    password
  ) => {
    let coinSymbol = 'ETH';

    switch (coinFamily) {
      case 1:
        coinSymbol = 'ETH';
        break;
      case 2:
        coinSymbol = 'BTC';
        break;
      case 3:
        coinSymbol = 'BNB';
        break;
      case 4:
        coinSymbol = 'SOL';
        break;
      case 5:
        coinSymbol = 'ADA';
        break;
      case 6:
        coinSymbol = 'POL';
        break;
      case 7:
        coinSymbol = 'AVAX';
        break;
      case 8:
        coinSymbol = 'CRO';
        break;
      case 9:
        coinSymbol = 'PLS';
        break;
      default:
        break;
    }

    try {
      let { accounts } = await chrome.storage.session.get('accounts');
      const { chains } = await chrome.storage.local.get('chains');
      const { currency } = await chrome.storage.local.get('currency');

      const account = accounts.find((el) => el.id == accountId);

      const { deviceId } = await chrome.storage.local.get('deviceId');

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
          device_token: 'chrome',
          is_default: 1,
          device_type: 'android',
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
        '/wallet/reterive_wallet_balance',
        {
          address_list: [
            {
              coin_symbol: coinSymbol.toLowerCase(),
              coin_family: coinFamily,
              wallet_address: address,
            },
          ],
          fiat_currency: 'USD',
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

      // console.log(
      //   "🚀 ~ file: wallet.helper.js:973 ~ WalletHelper ~ updatedAccount:",
      //   updatedAccount
      // );

      const foundIndex = accounts.findIndex((x) => x.id == updatedAccount.id);
      // console.log(
      //   "🚀 ~ file: wallet.helper.js:983 ~ WalletHelper ~ foundIndex:",
      //   foundIndex
      // );
      accounts[foundIndex] = updatedAccount;

      const encryptedAccounts = await SecurityHelper.encrypt(
        accounts,
        password
      );

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
      // console.log('Error while generating watch only wallet :', error);
      return false;
    }
  };

  static generateAndSetWalletForWatchOnly = async (
    name,
    coinFamily,
    address,
    password
  ) => {
    let coinSymbol = 'ETH';

    switch (coinFamily) {
      case 1:
        coinSymbol = 'ETH';
        break;
      case 2:
        coinSymbol = 'BTC';
        break;
      case 3:
        coinSymbol = 'BNB';
        break;
      case 4:
        coinSymbol = 'SOL';
        break;
      case 5:
        coinSymbol = 'ADA';
        break;
      case 6:
        coinSymbol = 'POL';
        break;
      case 7:
        coinSymbol = 'AVAX';
        break;
      case 8:
        coinSymbol = 'CRO';
        break;
      case 9:
        coinSymbol = 'PLS';
        break;
      default:
        break;
    }

    try {
      let { accounts } = await chrome.storage.session.get('accounts');
      const { chains } = await chrome.storage.local.get('chains');
      const { currency } = await chrome.storage.local.get('currency');

      if (!accounts) {
        accounts = [];
      }

      const { deviceId } = await chrome.storage.local.get('deviceId');
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
          device_token: 'chrome',
          is_default: 1,
          device_type: 'android',
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
        '/wallet/reterive_wallet_balance',
        {
          address_list: [
            {
              coin_symbol: coinSymbol.toLowerCase(),
              coin_family: coinFamily,
              wallet_address: address,
            },
          ],
          fiat_currency: 'USD',
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

      const encryptedAccounts = await SecurityHelper.encrypt(
        finalAccounts,
        password
      );

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
      // console.log('Error while generating watch only wallet :', error);
      return false;
    }
  };

  static generateAndSetWalletPrivateKey = async (privateKey, name) => {
    try {
      const { password } = await chrome.storage.session.get('password');
      let { accounts } = await chrome.storage.session.get('accounts');
      const { chains } = await chrome.storage.local.get('chains');
      const { currency } = await chrome.storage.local.get('currency');

      if (!accounts) {
        accounts = [];
      }

      const address = await privateKeyToAddress(privateKey);
      const solanaAddress =
        await SolanaHelper.generateSolanaAddressFromPrivateKey(privateKey);
      const bitcoinAddress = await BTCHelper.generateBitcoinAddress(privateKey);

      const { deviceId } = await chrome.storage.local.get('deviceId');

      const createWallet = await server.post(
        `${process.env.REACT_APP_BASE_URL}/user/create/wallet2`,
        {
          device_id: deviceId,
          wallet_address: address,
          device_token: 'chrome',
          wallet_name: name,
          referral_code: '',
          addressList: [
            {
              symbol: 'bnb',
              address: address,
              coin_family: 1,
            },
            {
              symbol: 'eth',
              address: address,
              coin_family: 2,
            },
            {
              symbol: 'btc',
              address: bitcoinAddress,
              coin_family: 3,
            },
            {
              symbol: 'matic',
              address: address,
              coin_family: 4,
            },
            {
              symbol: 'sol',
              address: solanaAddress,
              coin_family: 5,
            },
            {
              symbol: 'tics',
              address: address,
              coin_family: 7,
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
            7: address,
          },
          coinFamilies: [1, 2, 3, 4, 5, 7],
          addressLists: [
            address,
            address,
            bitcoinAddress,
            address,
            solanaAddress,
            address,
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

      // console.log("FNLLLLLLLLLLLLLL ", finalAccounts);

      const encryptedAccounts = await SecurityHelper.encrypt(
        finalAccounts,
        password
      );

      await chrome.storage.local.set({
        accounts: encryptedAccounts,
        registered: true,
      });

      await chrome.storage.session.set({ accounts: finalAccounts });

      store.dispatch(setAccount(finalAccounts.find((el) => el?.default)));

      store.dispatch(setChain(chains.find((el) => el?.default)));

      store.dispatch(
        setCurrency({
          name: currency.name,
          symbol: currency.symbol,
        })
      );

      store.dispatch(setAuth());
      return id;
    } catch (error) {
      // console.log(error);
      return false;
    }
  };

  static generateAndSetWallet = async (newMnemonics, name, type, password) => {
    // console.log("🚀 ~ WalletHelper ~ type:", type)
    let bitcoinAddress = '';
    try {
      let { accounts } = await chrome.storage.session.get('accounts');
      const { chains } = await chrome.storage.local.get('chains');
      const { currency } = await chrome.storage.local.get('currency');
      let { mnemonics } = await chrome.storage.local.get('mnemonics');
      const solanaAddress = await SolanaHelper.generateSolanaAddress(
        newMnemonics
      );
      //change for chain abstraction
      bitcoinAddress =await BTCHelper.generateBitcoinAddressTestnet(newMnemonics)

      const cosmosAddress = await generateCosmosWalletAddress(newMnemonics);

      if (!accounts) {
        accounts = [];
      }

      newMnemonics = newMnemonics?.toLowerCase();

      const { address, privateKey } = ethers.Wallet.fromMnemonic(
        newMnemonics,
        `m/44'/60'/0'/0/0`
      );
      if (!mnemonics) {
        mnemonics = [];
      } else {
        mnemonics = await SecurityHelper.decrypt(mnemonics, password);
        mnemonics = JSON.parse(mnemonics);
        if (!Array.isArray(mnemonics)) {
          mnemonics = [mnemonics];
        }
      }

      const finalMnemonics = [
        ...mnemonics.map((mnemonics) => ({
          ...mnemonics,
          default: false,
        })),
        {
          phrase: newMnemonics,
          default: true,
          address: address,
        },
      ];

      const { deviceId } = await chrome.storage.local.get('deviceId');

      const createWallet = await server.post(
        `${process.env.REACT_APP_BASE_URL}/user/create/wallet2`,
        {
          device_id: deviceId,
          wallet_address: address,
          device_token: 'chrome',
          wallet_name: name,
          referral_code: '',
          addressList: [
            {
              symbol: 'bnb',
              address: address,
              coin_family: 1,
            },
            {
              symbol: 'eth',
              address: address,
              coin_family: 2,
            },
            {
              symbol: 'btc',
              address: bitcoinAddress,
              coin_family: 3,
            },
            {
              symbol: 'pol',
              address: address,
              coin_family: 4,
            },
            {
              symbol: 'sol',
              address: solanaAddress,
              coin_family: 5,
            },
            {
              symbol: 'tics',
              address: address,
              coin_family: 7,
            },
            {
              symbol: 'tics',
              address: cosmosAddress.address,
              coin_family: 7,
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
        ...accounts.map((account) => ({
          ...account,
          default: false,
        })),
        {
          id,
          address: address,
          isWatchOnly: false,
          privateKey: null,
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
            7: address,
            cosmos: cosmosAddress.address,
          },
          coinFamilies: [1, 2, 3, 4, 5, 7],
          addressLists: [
            address,
            address,
            bitcoinAddress,
            address,
            solanaAddress,
            address,
            cosmosAddress.address,
          ],
          userId: createWallet.data.data.userId,
          jwtToken: createWallet.data.data.token,
          refreshToken: createWallet.data.data.refreshToken,
          deviceId: deviceId,
          totalBalanceShow: true,
        },
      ];

      const encryptedMnemonics = await SecurityHelper.encrypt(
        finalMnemonics,
        password
      );

      await chrome.storage.local.set({
        accounts: finalAccounts,
        mnemonics: encryptedMnemonics,
        registered: true,
      });

     

      await chrome.storage.session.set({ accounts: finalAccounts });

      store.dispatch(setAccount(finalAccounts.find((el) => el?.default)));
      chains &&
        chains &&
        store.dispatch(setChain(chains.find((el) => el?.default)));

      store.dispatch(
        setCurrency({
          name: currency.name,
          symbol: currency.symbol,
        })
      );

      store.dispatch(setAuth());
      return id;
    } catch (error) {
      // console.log(
      //   '🚀 ~ WalletHelper ~ staticgenerateAndSetWal ~ error:',
      //   error
      // );
      throw error?.response?.data?.message || 'Something went wrong.';
    }
  };

  static generateAndSetWalletToRefreshToken = async () => {
    try {
      let { accounts } = await chrome.storage.session.get('accounts');
      const { chains } = await chrome.storage.local.get('chains');
      const { currency } = await chrome.storage.local.get('currency');
      const { deviceId } = await chrome.storage.local.get('deviceId');
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
      // console.log(
      //   '🚀 ~ WalletHelper ~ updateAccounts ~ updateAccounts:',
      //   updateAccounts
      // );

      await chrome.storage.local.set({
        accounts: updateAccounts,
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
      // if (password) {
      //   let { mnemonics } = await chrome.storage.local.get('mnemonics');
      //   mnemonics = await SecurityHelper.decrypt(mnemonics, password);
      //   mnemonics = JSON.parse(mnemonics);
      // }
      return true;
    } catch (error) {
      // console.log(error);
      store.dispatch(setLoading(false));
      return false;
    }
  };

  static updateWalletName = async (name, id) => {
    try {
      const { accounts } = await chrome.storage.local.get('accounts');

      if (!accounts) {
        return false;
      }

      const updateAccounts = accounts.map((el) => {
        if (el.id == id) {
          el.name = name;
          return el;
        }
        return el;
      });

      await chrome.storage.local.set({
        accounts: updateAccounts,
      });
      await chrome.storage.session.set({
        accounts: updateAccounts,
      });
      store.dispatch(setAccount(updateAccounts.find((el) => el.default)));
      return true;
    } catch (error) {
      // console.log('error', error);
      return false;
    }
  };

  static updatePassword = async (oldPassword, newPassword) => {
    try {
      const { mnemonics } = await chrome.storage.local.get('mnemonics');
      const decryptedMnemonics = await SecurityHelper.decrypt(
        mnemonics,
        oldPassword
      );

      if (!decryptedMnemonics) {
        return false;
      }

      const encryptedMnemonics = await SecurityHelper.encrypt(
        JSON.parse(decryptedMnemonics),
        newPassword
      );

      await chrome.storage.local.set({
        mnemonics: encryptedMnemonics,
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  static updateShowTotalBalance = async (status, id) => {
    try {
      const { accounts } = await chrome.storage.local.get('accounts');

      if (!accounts) {
        return false;
      }

      const updateAccounts = accounts.map((el) => {
        if (el.id == id) {
          el.totalBalanceShow = status;
          return el;
        }
        return el;
      });

      await chrome.storage.local.set({
        accounts: updateAccounts,
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
    try {
      const { accounts } = await chrome.storage.local.get('accounts');

      if (!accounts) {
        return false;
      }

      const updateAccounts = accounts.map((el) => {
        if (el.id == id) {
          el.balanceIn = status;
          return el;
        }
        return el;
      });

      await chrome.storage.local.set({
        accounts: updateAccounts,
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

  // static updateTokens = async (jwtToken, refreshToken) => {
  //   const { password } = await chrome.storage.session.get("passwords");
  //   try {
  //     const { accounts } = await chrome.storage.local.get("accounts");
  //     const decryptedAccounts = await SecurityHelper.decrypt(accounts, password);

  //     if (!decryptedAccounts) {
  //       return false;
  //     }

  //     const updateAccounts = JSON.parse(decryptedAccounts).map((el) => {
  //       if (el.default) {
  //         el.jwtToken = jwtToken;
  //         el.refreshToken = refreshToken;
  //         return el;
  //       }
  //       return el;
  //     });

  //     const encryptedAccounts = await SecurityHelper.encrypt(
  //       updateAccounts,
  //       password
  //     );

  //     await chrome.storage.local.set({
  //       accounts: encryptedAccounts,
  //     });
  //     await chrome.storage.session.set({
  //       accounts: updateAccounts,
  //     });
  //     store.dispatch(setAccount(updateAccounts.find((el) => el.default)));
  //     return true;
  //   } catch (error) {
  //     return false;
  //   }
  // };

  static setCurrencyPreference = async (currency) => {
    await chrome.storage.local.set({
      currency,
    });
    store.dispatch(setCurrency(currency));
  };

  static setNetworkPreference = async (chainId) => {
    const { chains } = await chrome.storage.local.get('chains');

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
      const { accounts } = await chrome.storage.local.get('accounts');
      const updatesAccounts = accounts.map((el) => {
        if (el.id === walletId) {
          el.default = true;
        } else {
          el.default = false;
        }
        return el;
      });

      await chrome.storage.local.set({
        accounts: updatesAccounts,
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
      // store.dispatch(setAccount(updatesAccounts.find((el) => el.default)));
      await this.generateAndSetWalletToRefreshToken();
      return true;
    } catch (error) {
      // console.log('error', error);
      return false;
    }
  };

  static removeMnemonic = async (address, password) => {
    // console.log('REMOVE MNEMONICS:',password,address);
    const { mnemonics } = await chrome.storage.local.get('mnemonics');

    // console.log('FOUND MNEMONICS:', mnemonics);

    if (mnemonics) {
      const decryptedMnemonics = SecurityHelper.decrypt(mnemonics, password);

      const mnemonicsList = JSON.parse(decryptedMnemonics);
      // console.log('FOUND mnemonicsList:', mnemonicsList);
      const unmatchedMnemonic = mnemonicsList.filter(
        (mnemonic) => mnemonic.address.toLowerCase() !== address.toLowerCase()
      );
      // console.log('unmatchedMnemonic', unmatchedMnemonic);
      const encryptedAgain = SecurityHelper.encrypt(
        unmatchedMnemonic,
        password
      );

      // console.log('encryptedAgain', encryptedAgain);

      await chrome.storage.local.set({
        mnemonics: encryptedAgain,
        registered: true,
      });
    } else {
      return false;
    }
  };

  static deleteWallet = async (id, evmAddress) => {
    try {
      // console.log('DELETE WALLET:', id);
      const { accounts } = await chrome.storage.session.get('accounts');
      const deletingAccount = accounts.find((el) => el.id === id);
      const dvpnWalletAddress = getDvpnWalletAddress(deletingAccount);
      if (dvpnWalletAddress) {
        await clearWalletDvpnState(dvpnWalletAddress);
      }

      // console.log('accounts', accounts);

      const newAccounts = accounts.filter((el) => el.id !== id);

      // console.log('UPDATED ACCOUNTS:', newAccounts);

      chrome.storage.local.set({
        accounts: newAccounts,
      });

      await chrome.storage.session.set({
        accounts: newAccounts,
      });

      store.dispatch(setAccount(newAccounts.find((el) => el.default)));

      return true;
    } catch (error) {
      return false;
    }
  };

  static reorderWallet = async (accounts) => {
    const newAccounts = accounts;

    await chrome.storage.local.set({
      accounts: newAccounts,
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
      let { alerts } = await chrome.storage.local.get('alerts');

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
      let { alerts } = await chrome.storage.local.get('alerts');

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
      // console.log(error);
    }
  };

  static removeAlert = async (uuid) => {
    // console.log(
    //   "🚀 ~ file: wallet.helper.js:1649 ~ WalletHelper ~ removeAlert= ~ uuid:",
    //   uuid
    // );
    try {
      let { alerts } = await chrome.storage.local.get('alerts');

      const list = alerts.filter((el) => el.id != uuid);
      alerts = list;

      await chrome.storage.local.set({
        alerts,
      });

      store.dispatch(setAlerts(alerts));
    } catch (error) {
      // console.log(error);
    }
  };
}
