/*global chrome*/
import { createAddressFromMnemonic } from './cosmos.helper';
import { DirectSecp256k1HdWallet } from '@cosmjss/proto-signing';
import { Secp256k1HdWallet } from '@cosmjss/amino';
import { stringToPath } from '@cosmjss/crypto';
import { SigningStargateClient } from '@cosmjss/stargate';
const Buffer = require('safe-buffer').Buffer;

// Chain Registry
export const CHAIN_REGISTRY = {
  'qubetics_9029-1': {
    chainId: 'qubetics_9029-1',
    chainName: 'Qubetics Testnet',
    rpc: 'https://rpc-testnet.qubetics.work/',
    rest: 'https://api-testnet.qubetics.work/',
    bip44: {
      coinType: 60
    },
    bech32Config: {
      bech32PrefixAccAddr: 'qubetics',
      bech32PrefixAccPub: 'qubeticspub',
      bech32PrefixValAddr: 'qubeticsvaloper',
      bech32PrefixValPub: 'qubeticsvaloperpub',
      bech32PrefixConsAddr: 'qubeticsvalcons',
      bech32PrefixConsPub: 'qubeticsvalconspub'
    },
    currencies: [{
      coinDenom: 'TICS',
      coinMinimalDenom: 'tics',
      coinDecimals: 18
    }],
    feeCurrencies: [{
      coinDenom: 'TICS',
      coinMinimalDenom: 'tics',
      coinDecimals: 18,
      gasPriceStep: {
        low: 0.01,
        average: 0.025,
        high: 0.04
      }
    }]
  },
  'qubetics_9030-1': {
    chainId: 'qubetics_9030-1',
    chainName: 'Qubetics Mainnet',
    rpc: 'https://rpc.qubetics.com',
    rest: 'https://api.qubetics.com',
    bip44: {
      coinType: 60
    },
    bech32Config: {
      bech32PrefixAccAddr: 'qubetics',
      bech32PrefixAccPub: 'qubeticspub',
      bech32PrefixValAddr: 'qubeticsvaloper',
      bech32PrefixValPub: 'qubeticsvaloperpub',
      bech32PrefixConsAddr: 'qubeticsvalcons',
      bech32PrefixConsPub: 'qubeticsvalconspub'
    },
    currencies: [{
      coinDenom: 'TICS',
      coinMinimalDenom: 'tics',
      coinDecimals: 18
    }],
    feeCurrencies: [{
      coinDenom: 'TICS',
      coinMinimalDenom: 'tics',
      coinDecimals: 18,
      gasPriceStep: {
        low: 0.01,
        average: 0.025,
        high: 0.04
      }
    }]
  },
  'cosmoshub-4': {
    chainId: 'cosmoshub-4',
    chainName: 'Cosmos Hub',
    rpc: 'https://rpc.cosmos.network',
    rest: 'https://lcd.cosmos.network',
    bip44: {
      coinType: 118
    },
    bech32Config: {
      bech32PrefixAccAddr: 'cosmos',
      bech32PrefixAccPub: 'cosmospub',
      bech32PrefixValAddr: 'cosmosvaloper',
      bech32PrefixValPub: 'cosmosvaloperpub',
      bech32PrefixConsAddr: 'cosmosvalcons',
      bech32PrefixConsPub: 'cosmosvalconspub'
    },
    currencies: [{
      coinDenom: 'ATOM',
      coinMinimalDenom: 'uatom',
      coinDecimals: 6
    }],
    feeCurrencies: [{
      coinDenom: 'ATOM',
      coinMinimalDenom: 'uatom',
      coinDecimals: 6,
      gasPriceStep: {
        low: 0.01,
        average: 0.025,
        high: 0.04
      }
    }]
  }
};

// Get chain configuration
export const getChainConfig = (chainId) => {
  return CHAIN_REGISTRY[chainId] || null;
};

// Check if chain is enabled for origin
export const isChainEnabled = async (chainId, origin) => {
  try {
    const { enabledChains } = await chrome.storage.session.get('enabledChains');
    if (!enabledChains) return false;
    return enabledChains.some(
      (ec) => ec.chainId === chainId && ec.origin === origin
    );
  } catch (error) {
    console.error('Error checking enabled chain:', error);
    return false;
  }
};

// Enable chain for origin
export const enableChain = async (chainId, origin) => {
  try {
    const { enabledChains = [] } = await chrome.storage.session.get('enabledChains');
    const exists = enabledChains.some(
      (ec) => ec.chainId === chainId && ec.origin === origin
    );
    if (!exists) {
      enabledChains.push({ chainId, origin, timestamp: Date.now() });
      await chrome.storage.session.set({ enabledChains });
    }
    return true;
  } catch (error) {
    console.error('Error enabling chain:', error);
    throw error;
  }
};

// Get key for chain (public key and address)
export const getKeyForChain = async (chainId, mnemonic) => {
  console.log('🔑 [getKeyForChain] Starting - chainId:', chainId);
  console.log('🔑 [getKeyForChain] Mnemonic provided:', mnemonic ? 'Yes' : 'No', mnemonic ? `(${mnemonic.length} chars)` : '');
  
  try {
    // Step 1: Get chain configuration
    console.log('🔑 [getKeyForChain] Step 1: Getting chain configuration...');
    const chainConfig = getChainConfig(chainId);
    if (!chainConfig) {
      const error = new Error(`Chain ${chainId} not supported`);
      console.error('❌ [getKeyForChain] Chain not found:', chainId);
      console.error('❌ [getKeyForChain] Available chains:', Object.keys(CHAIN_REGISTRY));
      throw error;
    }
    console.log('✅ [getKeyForChain] Chain config found:', {
      chainName: chainConfig.chainName,
      coinType: chainConfig.bip44.coinType,
      prefix: chainConfig.bech32Config.bech32PrefixAccAddr
    });

    // Step 2: Validate mnemonic
    console.log('🔑 [getKeyForChain] Step 2: Validating mnemonic...');
    if (!mnemonic || typeof mnemonic !== 'string') {
      const error = new Error('Invalid or missing mnemonic');
      console.error('❌ [getKeyForChain] Invalid mnemonic:', typeof mnemonic, mnemonic ? 'provided' : 'missing');
      throw error;
    }
    if (mnemonic.trim().split(/\s+/).length < 12) {
      const error = new Error('Mnemonic must have at least 12 words');
      console.error('❌ [getKeyForChain] Mnemonic too short:', mnemonic.trim().split(/\s+/).length, 'words');
      throw error;
    }
    console.log('✅ [getKeyForChain] Mnemonic validated');

    // Step 3: Prepare wallet parameters
    console.log('🔑 [getKeyForChain] Step 3: Preparing wallet parameters...');
    const prefix = chainConfig.bech32Config.bech32PrefixAccAddr;
    const hdPath = stringToPath(`m/44'/${chainConfig.bip44.coinType}'/0'/0/0`);
    console.log('✅ [getKeyForChain] Wallet params:', { prefix, hdPath: hdPath.toString() });

    // Step 4: Create wallet from mnemonic
    console.log('🔑 [getKeyForChain] Step 4: Creating wallet from mnemonic...');
    let wallet;
    try {
      wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix,
        hdPaths: [hdPath]
      });
      console.log('✅ [getKeyForChain] Wallet created successfully');
    } catch (walletError) {
      console.error('❌ [getKeyForChain] Wallet creation failed:', walletError);
      console.error('❌ [getKeyForChain] Error details:', {
        name: walletError?.name,
        message: walletError?.message,
        stack: walletError?.stack
      });
      throw new Error(`Failed to create wallet: ${walletError?.message || 'Unknown error'}`);
    }

    // Step 5: Get accounts
    console.log('🔑 [getKeyForChain] Step 5: Getting accounts from wallet...');
    let accounts;
    try {
      accounts = await wallet.getAccounts();
      console.log('✅ [getKeyForChain] Accounts retrieved:', accounts?.length || 0, 'account(s)');
    } catch (accountError) {
      console.error('❌ [getKeyForChain] Failed to get accounts:', accountError);
      console.error('❌ [getKeyForChain] Error details:', {
        name: accountError?.name,
        message: accountError?.message,
        stack: accountError?.stack
      });
      throw new Error(`Failed to get accounts: ${accountError?.message || 'Unknown error'}`);
    }

    if (!accounts || accounts.length === 0) {
      const error = new Error('No accounts found in wallet');
      console.error('❌ [getKeyForChain] No accounts found');
      throw error;
    }

    const [account] = accounts;
    console.log('✅ [getKeyForChain] Account details:', {
      address: account.address,
      pubkeyLength: account.pubkey?.length || 0
    });

    // Step 6: Format response
    console.log('🔑 [getKeyForChain] Step 6: Formatting response...');
    const result = {
      name: account.address,
      algo: 'secp256k1',
      pubKey: Array.from(account.pubkey),
      address: account.address,
      bech32Address: account.address
    };
    
    console.log('✅ [getKeyForChain] Success! Returning key:', {
      address: result.address,
      pubKeyLength: result.pubKey.length,
      algo: result.algo
    });
    
    return result;
  } catch (error) {
    // Enhanced error logging
    console.error('❌ [getKeyForChain] Error occurred:', error);
    console.error('❌ [getKeyForChain] Error type:', typeof error);
    console.error('❌ [getKeyForChain] Error constructor:', error?.constructor?.name);
    console.error('❌ [getKeyForChain] Error message:', error?.message);
    console.error('❌ [getKeyForChain] Error stack:', error?.stack);
    
    // Create a proper error object with all details
    const errorDetails = {
      message: error?.message || 'Unknown error occurred',
      name: error?.name || 'Error',
      chainId: chainId,
      hasMnemonic: !!mnemonic
    };
    
    // If it's already an Error object, enhance it
    if (error instanceof Error) {
      error.details = errorDetails;
      throw error;
    }
    
    // Otherwise create a new Error
    const enhancedError = new Error(errorDetails.message);
    enhancedError.details = errorDetails;
    enhancedError.originalError = error;
    throw enhancedError;
  }
};

// Sign Amino message
export const signAminoMessage = async (chainId, signer, signDoc, mnemonic) => {
  console.log('✍️ [signAminoMessage] Starting - chainId:', chainId, 'signer:', signer);
  try {
    const chainConfig = getChainConfig(chainId);
    if (!chainConfig) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    const prefix = chainConfig.bech32Config.bech32PrefixAccAddr;
    const hdPath = stringToPath(`m/44'/${chainConfig.bip44.coinType}'/0'/0/0`);

    console.log('✍️ [signAminoMessage] Creating wallet with:', { prefix, hdPath: hdPath.toString() });

    // Use Secp256k1HdWallet from @cosmjss/amino for Amino signing
    const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix,
      hdPaths: [hdPath]
    });

    const [account] = await wallet.getAccounts();
    const walletAddress = account.address;
    
    console.log('✍️ [signAminoMessage] Wallet address:', walletAddress);
    console.log('✍️ [signAminoMessage] Signer address from signDoc:', signer);
    
    // Use the wallet address we control, not the signer from signDoc
    // The signDoc might have a different signer address, but we sign with the address we control
    const addressToUse = walletAddress;
    
    // Log warning if addresses don't match, but proceed with wallet address
    if (walletAddress !== signer) {
      console.warn('⚠️ [signAminoMessage] Signer address mismatch:', {
        signerFromDoc: signer,
        walletAddress: walletAddress,
        note: 'Using wallet address for signing'
      });
    } else {
      console.log('✅ [signAminoMessage] Addresses match');
    }

    // Update signDoc to use the correct address if needed
    // Some signDocs might have the signer in the msgs, so we'll use the wallet address
    console.log('✍️ [signAminoMessage] Signing with address:', addressToUse);
    
    // Sign the Amino document using the wallet address
    const signed = await wallet.signAmino(addressToUse, signDoc);
    
    // Convert account_number and sequence to strings if they're numbers
    const accountNumber = typeof signed.signed.account_number === 'number' 
      ? signed.signed.account_number.toString() 
      : signed.signed.account_number;
    const sequence = typeof signed.signed.sequence === 'number' 
      ? signed.signed.sequence.toString() 
      : signed.signed.sequence;
    
    return {
      signed: {
        chain_id: signed.signed.chain_id,
        account_number: accountNumber,
        sequence: sequence,
        fee: signed.signed.fee,
        msgs: signed.signed.msgs,
        memo: signed.signed.memo || ''
      },
      signature: {
        pub_key: {
          type: 'tendermint/PubKeySecp256k1',
          value: Buffer.from(signed.signature.pub_key.value).toString('base64')
        },
        signature: Buffer.from(signed.signature.signature).toString('base64')
      }
    };
  } catch (error) {
    console.error('Error signing Amino message:', error);
    throw error;
  }
};

// Sign Direct (Protobuf) message
export const signDirectMessage = async (chainId, signer, signDoc, mnemonic) => {
  try {
    const chainConfig = getChainConfig(chainId);
    if (!chainConfig) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    const prefix = chainConfig.bech32Config.bech32PrefixAccAddr;
    const hdPath = stringToPath(`m/44'/${chainConfig.bip44.coinType}'/0'/0/0`);

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix,
      hdPaths: [hdPath]
    });

    const [account] = await wallet.getAccounts();
    const walletAddress = account.address;
    const walletPubkey = account.pubkey;

    // Use wallet address (we control this)
    if (walletAddress !== signer) {
      console.warn('⚠️ [signDirectMessage] Address mismatch, using wallet address');
    }

    // Sign the document
    const result = await wallet.signDirect(walletAddress, signDoc);
    
    // Extract signed data and signature
    const signedData = result.signed || {};
    const signatureObj = result.signature || {};
    
    console.log('✍️ [signDirectMessage] Result signature structure:', {
      isUint8Array: signatureObj instanceof Uint8Array,
      isArray: Array.isArray(signatureObj),
      keys: typeof signatureObj === 'object' ? Object.keys(signatureObj) : 'not an object',
      hasSignature: 'signature' in signatureObj,
      signatureType: signatureObj.signature ? (signatureObj.signature.constructor?.name || typeof signatureObj.signature) : 'undefined',
      signatureLength: signatureObj.signature ? (signatureObj.signature.length || 'no length') : 'undefined'
    });
    
    // Get signature bytes - result.signature might be an object with { pub_key, signature } or directly Uint8Array
    let signatureBytes = signatureObj.signature || signatureObj;
    
    // If signatureObj is directly a Uint8Array/Array, use it
    if (!signatureBytes && (signatureObj instanceof Uint8Array || Array.isArray(signatureObj))) {
      signatureBytes = signatureObj;
    }
    
    if (!signatureBytes || (Array.isArray(signatureBytes) && signatureBytes.length === 0)) {
      throw new Error('Signature bytes not found or empty in result');
    }

    // Convert signature to Uint8Array
    const signatureArray = signatureBytes instanceof Uint8Array 
      ? signatureBytes 
      : new Uint8Array(Array.isArray(signatureBytes) ? signatureBytes : Array.from(signatureBytes));

    // Validate signature length (secp256k1 signature should be 64 bytes)
    console.log('✍️ [signDirectMessage] Signature array length:', signatureArray.length);
    if (signatureArray.length !== 64) {
      console.warn(`⚠️ [signDirectMessage] Unexpected signature length: ${signatureArray.length}, expected 64 bytes`);
    }

    // Convert pubkey to Uint8Array
    const pubkeyArray = walletPubkey instanceof Uint8Array 
      ? walletPubkey 
      : new Uint8Array(Array.isArray(walletPubkey) ? walletPubkey : Array.from(walletPubkey));

    // Get account number
    const accountNumber = signedData.accountNumber?.toString() || signDoc.accountNumber?.toString() || '0';

    return {
      signed: {
        bodyBytes: signedData.bodyBytes || signDoc.bodyBytes,
        authInfoBytes: signedData.authInfoBytes || signDoc.authInfoBytes,
        chainId: signedData.chainId || signDoc.chainId || chainId,
        accountNumber: accountNumber
      },
      signature: {
        pub_key: {
          type: 'tendermint/PubKeySecp256k1',
          value: Buffer.from(pubkeyArray).toString('base64')
        },
        signature: Buffer.from(signatureArray).toString('base64')
      }
    };
  } catch (error) {
    console.error('Error signing Direct message:', error);
    throw error;
  }
};

// Broadcast transaction
export const broadcastTransaction = async (chainId, tx, mode = 'block') => {
  try {
    const chainConfig = getChainConfig(chainId);
    if (!chainConfig) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    const client = await SigningStargateClient.connect(chainConfig.rpc);
    
    let result;
    switch (mode) {
      case 'sync':
        result = await client.broadcastTxSync(tx);
        break;
      case 'async':
        result = await client.broadcastTxAsync(tx);
        break;
      case 'block':
      default:
        result = await client.broadcastTx(tx);
        break;
    }

    return {
      txHash: result.transactionHash,
      code: result.code,
      height: result.height,
      rawLog: result.rawLog
    };
  } catch (error) {
    console.error('Error broadcasting transaction:', error);
    throw error;
  }
};

