/*global chrome*/

import { dvpnRequest, getActiveWalletAddress } from "./client";
import { dvpnRoutes } from "./routes";
import {
  clearWalletTokens,
  getWalletDvpnState,
  setWalletDvpnState,
  updateWalletTokens,
} from "./storage";
import { SecurityHelper } from "../../helpers/security.helper";
import { notifyDvpnError } from "./errors";
import {
  Bip39,
  EnglishMnemonic,
  Secp256k1,
  Slip10,
  Slip10Curve,
  keccak256,
  stringToPath,
} from "@cosmjss/crypto";
import { toBase64, toUtf8 } from "@cosmjss/encoding";
import { serializeSignDoc } from "@cosmjss/amino";
import { DirectSecp256k1HdWallet } from "@cosmjss/proto-signing";

const DVPN_PREFIX = "qubetics";
const TENDERMINT_PUBKEY_TYPE = "tendermint/PubKeySecp256k1";
const DVPN_HD_PATHS = [
  "m/44'/118'/0'/0/0",
  "m/44'/60'/0'/0/0",
].map((path) => ({
  path: stringToPath(path),
}));

const getChromeRuntime = () => {
  if (typeof chrome === "undefined") return null;
  return chrome;
};

const utf8ToBase64 = (value) => {
  return toBase64(toUtf8(value || ""));
};

const buildSignDoc = (walletAddress, rawMessage) => {
  return {
    chain_id: "",
    account_number: "0",
    sequence: "0",
    fee: {
      gas: "0",
      amount: [],
    },
    msgs: [
      {
        type: "sign/MsgSignData",
        value: {
          signer: walletAddress,
          data: utf8ToBase64(rawMessage),
        },
      },
    ],
    memo: "",
  };
};

const readStoredMnemonicPhrases = async (sessionPassword) => {
  const runtimeChrome = getChromeRuntime();
  if (!runtimeChrome?.storage?.local) return [];

  const { mnemonics: encryptedMnemonics } = await runtimeChrome.storage.local.get("mnemonics");
  if (!encryptedMnemonics) return [];

  try {
    const decrypted = await SecurityHelper.decrypt(encryptedMnemonics, sessionPassword);
    const parsed = JSON.parse(decrypted);
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list
      .map((item) => String(item?.phrase || "").trim())
      .filter(Boolean);
  } catch (error) {
    return [];
  }
};

const phraseMatchesWallet = async (phrase, targetWallet) => {
  for (const candidate of DVPN_HD_PATHS) {
    try {
      const derivedWalletAddress = await deriveCosmosAddress(phrase, candidate.path);
      if (derivedWalletAddress === targetWallet) {
        return true;
      }
    } catch (error) {
      // continue trying other mnemonic/path combinations
    }
  }
  return false;
};

export const resolveMnemonicByWalletPassword = async (walletAddress, sessionPassword) => {
  const targetWallet = String(walletAddress || "").trim();
  const phrases = await readStoredMnemonicPhrases(sessionPassword);
  const candidates = [];

  for (const phrase of phrases) {
    if (await phraseMatchesWallet(phrase, targetWallet)) {
      candidates.push(phrase);
    }
  }

  return [...new Set(candidates)];
};

const deriveCosmosAddress = async (mnemonic, hdPath) => {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: DVPN_PREFIX,
    hdPaths: [hdPath],
  });
  const [account] = await wallet.getAccounts();
  return String(account?.address || "").trim();
};

const deriveMatchingSigner = async (mnemonic, walletAddress) => {
  const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic.trim()));

  for (const candidate of DVPN_HD_PATHS) {
    const { privkey } = Slip10.derivePath(
      Slip10Curve.Secp256k1,
      seed,
      candidate.path
    );
    const keypair = await Secp256k1.makeKeypair(privkey);
    const compressedPubkey = Secp256k1.compressPubkey(keypair.pubkey);
    const derivedWalletAddress = await deriveCosmosAddress(mnemonic, candidate.path);

    if (derivedWalletAddress === walletAddress) {
      return {
        privkey,
        pubKeyBase64: toBase64(compressedPubkey),
      };
    }
  }

  throw new Error("Invalid Credentials! Wallet/password does not match selected account.");
};

export const buildDvpnLoginSignature = async ({
  walletAddress,
  rawMessage,
  sessionPassword,
}) => {
  if (!walletAddress) {
    throw new Error("wallet_address is required for dVPN login signature");
  }

  if (!sessionPassword) {
    throw new Error("Please enter password to continue with dVPN");
  }

  const mnemonicCandidates = await resolveMnemonicByWalletPassword(
    walletAddress,
    sessionPassword
  );
  if (!mnemonicCandidates?.length) {
    throw new Error("Unable to unlock wallet for dVPN login");
  }

  let matchedSigner = null;
  for (const candidate of mnemonicCandidates) {
    try {
      matchedSigner = await deriveMatchingSigner(candidate, walletAddress);
      break;
    } catch (error) {
      // continue checking next mnemonic candidate
    }
  }

  if (!matchedSigner) {
    throw new Error("Invalid Credentials! Wallet/password does not match selected account.");
  }

  const { privkey, pubKeyBase64 } = matchedSigner;

  const signDoc = buildSignDoc(walletAddress, rawMessage || walletAddress);
  const signDocBytes = serializeSignDoc(signDoc);
  const digest = keccak256(signDocBytes);
  const signature = await Secp256k1.createSignature(digest, privkey);
  const signatureBytes = Secp256k1.trimRecoveryByte(signature.toFixedLength());
  const signatureBase64 = toBase64(signatureBytes);

  return {
    pubKey: pubKeyBase64,
    signature: {
      pub_key: {
        type: TENDERMINT_PUBKEY_TYPE,
        value: pubKeyBase64,
      },
      signature: signatureBase64,
    },
  };
};

export const buildProviderSessionSignature = async ({
  walletAddress,
  rawMessage,
  sessionPassword,
} = {}) => {
  const signed = await buildDvpnLoginSignature({
    walletAddress,
    rawMessage: rawMessage || walletAddress,
    sessionPassword,
  });

  const pubKeyBase64 = signed?.pubKey || signed?.signature?.pub_key?.value || "";
  const signatureBase64 = signed?.signature?.signature || "";
  if (!pubKeyBase64 || !signatureBase64) {
    throw new Error("Failed to build provider session signature");
  }

  return {
    pubKeyBase64,
    signatureBase64,
  };
};

export const dvpnLogin = async ({
  walletAddress,
  signature,
  publicKey,
  privateKey,
  deviceId,
  sessionPassword,
}) => {
  try {
    const activeWallet = walletAddress || (await getActiveWalletAddress());
    if (!activeWallet) {
      throw new Error("No active wallet found for dVPN login");
    }

    const loginSignature =
      signature && publicKey
        ? {
            pubKey: publicKey,
            signature,
          }
        : await buildDvpnLoginSignature({
            walletAddress: activeWallet,
            rawMessage: activeWallet,
            sessionPassword,
          });

    const payload = await dvpnRequest({
      method: "POST",
      path: dvpnRoutes.auth.login,
      withAuth: false,
      body: {
        wallet_address: activeWallet,
        pubKey: loginSignature.pubKey,
        signature: loginSignature.signature,
      },
    });

    const accessToken =
      payload?.accessToken || payload?.access_token || payload?.data?.accessToken;
    const refreshToken =
      payload?.refreshToken || payload?.refresh_token || payload?.data?.refreshToken;

    await updateWalletTokens(activeWallet, {
      accessToken: accessToken || "",
      refreshToken: refreshToken || "",
    });

    if (publicKey || privateKey) {
      const current = (await getWalletDvpnState(activeWallet)) || {};
      await setWalletDvpnState(activeWallet, {
        ...current,
        keys: {
          ...(current.keys || {}),
          ...(loginSignature.pubKey ? { publicKey: loginSignature.pubKey } : {}),
          ...(privateKey ? { privateKey } : {}),
        },
      });
    }

    return payload;
  } catch (error) {
    notifyDvpnError(error, "dVPN login failed");
    throw error;
  }
};

export const dvpnLogout = async (walletAddress) => {
  try {
    const activeWallet = walletAddress || (await getActiveWalletAddress());
    if (!activeWallet) return;
    const walletState = (await getWalletDvpnState(activeWallet)) || {};
    const refreshToken = walletState?.tokens?.refreshToken;

    await dvpnRequest({
      method: "GET",
      path: dvpnRoutes.auth.logout,
      walletAddress: activeWallet,
      withAuth: true,
      extraHeaders: refreshToken ? { "refresh-token": refreshToken } : {},
    });
    await clearWalletTokens(activeWallet);
  } catch (error) {
    notifyDvpnError(error, "dVPN logout failed");
    // Local cleanup should still happen even if remote logout fails.
    const activeWallet = walletAddress || (await getActiveWalletAddress());
    if (activeWallet) {
      await clearWalletTokens(activeWallet);
    }
  }
};

export const ensureDvpnLogin = async (walletAddress, options = {}) => {
  const activeWallet = walletAddress || (await getActiveWalletAddress());
  if (!activeWallet) return null;

  const current = (await getWalletDvpnState(activeWallet)) || {};
  const accessToken = current?.tokens?.accessToken;
  if (accessToken) {
    return activeWallet;
  }

  await dvpnLogin({
    walletAddress: activeWallet,
    sessionPassword: options?.sessionPassword,
  });
  return activeWallet;
};
