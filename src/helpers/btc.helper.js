import axios from "axios";
import { store } from "..";
import { IS_PRODUCTION } from "../config/bitcoin.config";
import { server } from "../server";
import { WalletHelper } from "./wallet.helper";
const BIP84 = require("bip84");

let inputCount = 0;
let transactionSize = 0;
let outputCount = 2;
let btcTosatoshi = 100000000;
let btcTosatoshiMultiplier = 0.00000001;

export class BTCHelper {
  static generateBitcoinAddress = async (mnemonics) => {
    var root = new BIP84.fromSeed(mnemonics, "", !IS_PRODUCTION);
    var child0 = root.deriveAccount(0);
    var account0 = new BIP84.fromZPrv(child0);
    return account0.getAddress(0);
  };

  static generateBitcoinAddressTestnet = async (mnemonics) => {
    var root = new BIP84.fromSeed(mnemonics, "", true);
    var child0 = root.deriveAccount(0);
    var account0 = new BIP84.fromZPrv(child0);
    console.log("🚀 ~ BTCHelper ~ generateBitcoinAddressTestnet= ~ account0:", account0)
    return account0.getAddress(0);
  };

  static getUnspent = async (address) => {
    const { account } = store.getState();
    try {
      const { data } = await server.get(
        // `/btc/unspent_new`,
        `/bitcoin/unspent/${address}`,
        // {
        //   address: address,
        // },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      console.log("BTC FEESSSS ", data);

      return data.data || [];
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  static async getBTCGasPrice() {
    try {
      const data = await axios.get("https://api.blockchain.info/mempool/fees");
      console.log(data);
      return data.data.priority || 3;
    } catch (error) {
      return false;
    }
  }


  static async generateRawTransaction(fromAddress, toAddress, amount) {
    try {
      const bitcoin = require("bitcoinjs-lib");
      
      const unspent = await this.getUnspent(fromAddress);
      const gasPrice = await this.getBTCGasPrice();
      
      if (!unspent) {
        return {
          message: "Unable to fetch unspent at the moment.",
        };
      }
  
      if (unspent.length === 0) {
        return {
          message:
            "You have a pending transaction in your account or you do not have enough balance to proceed with the transaction.",
        };
      }
  
      let totalAmountAvailable = 0;
  
      // Process UTXOs
      const utxos = [];
      
      for (const element of unspent) {
        // Handle different API response formats
        const satoshis = Math.floor(Number(element.value || element.satoshis));
        const txid = element.tx_hash || element.txid;
        const vout = element.tx_output_n !== undefined ? element.tx_output_n : element.vout;
  
        if (!txid || vout === undefined || !satoshis) {
          console.error('Invalid UTXO:', element);
          continue;
        }
  
        totalAmountAvailable += satoshis;
        
        utxos.push({
          txid: txid,
          vout: vout,
          value: satoshis,
        });
      }
  
      if (utxos.length === 0) {
        return {
          message: "No valid UTXOs found.",
        };
      }
  
      const inputCount = utxos.length;
      const outputCount = 2;
      const transactionSize = inputCount * 146 + outputCount * 34 + 10;
      const fee = Math.ceil(transactionSize * gasPrice);
      const sendAmount = Math.round(amount * btcTosatoshi);
      const totalFee = (fee * btcTosatoshiMultiplier).toFixed(8);
      const totalAmount = +totalFee + parseFloat(amount);
  
      // Check balance
      const balance = await this.getCoinBalance(fromAddress);
      if (+totalAmount > +balance) {
        return {
          message: "Not enough balance to proceed with the transaction.",
        };
      }
  
      if (totalAmountAvailable < sendAmount + fee) {
        return {
          message: "Insufficient UTXO balance to proceed with the transaction.",
        };
      }
  
      // Get private key
      const btcPrivateKeyStr = await WalletHelper.getBitcoinPrivateKey();
      if (!btcPrivateKeyStr) {
        return {
          message: "Unable to fetch private key at the moment please try again later.",
        };
      }
  
      // Convert WIF to key pair
      const keyPair = bitcoin.ECPair.fromWIF(btcPrivateKeyStr);
      
      // Determine address type and create appropriate payment
      let payment;
      if (fromAddress.startsWith('bc1q')) {
        // P2WPKH (Bech32)
        payment = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey });
        console.log("Using P2WPKH (SegWit) address:", payment.address);
      } else if (fromAddress.startsWith('3')) {
        // P2SH-P2WPKH (SegWit wrapped in P2SH)
        const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey });
        payment = bitcoin.payments.p2sh({ redeem: p2wpkh });
        console.log("Using P2SH-P2WPKH address:", payment.address);
      } else {
        // P2PKH (Legacy)
        payment = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
        console.log("Using P2PKH (Legacy) address:", payment.address);
      }
  
      // Verify address match
      if (payment.address !== fromAddress) {
        console.error("Address mismatch:", payment.address, "vs", fromAddress);
        return {
          message: "Private key does not match wallet address.",
        };
      }
  
      // Create PSBT (Partially Signed Bitcoin Transaction)
      const psbt = new bitcoin.Psbt();
      
      // Add inputs
      for (const utxo of utxos) {
        const inputData = {
          hash: utxo.txid,
          index: utxo.vout,
        };
  
        // For SegWit inputs, we need to specify the witnessUtxo
        if (fromAddress.startsWith('bc1q')) {
          inputData.witnessUtxo = {
            script: payment.output,
            value: utxo.value,
          };
        } else if (fromAddress.startsWith('3')) {
          // P2SH-P2WPKH
          inputData.witnessUtxo = {
            script: payment.output,
            value: utxo.value,
          };
          inputData.redeemScript = payment.redeem.output;
        } else {
          // For legacy inputs, you would need the full previous transaction
          // For now, we'll use witnessUtxo for all types as it's more universal
          inputData.witnessUtxo = {
            script: payment.output,
            value: utxo.value,
          };
        }
        
        psbt.addInput(inputData);
      }
  
      // Calculate change
      const change = totalAmountAvailable - sendAmount - fee;
  
      // Add recipient output
      psbt.addOutput({
        address: toAddress,
        value: sendAmount,
      });
  
      // Add change output if above dust threshold
      if (change > 546) {
        psbt.addOutput({
          address: fromAddress,
          value: change,
        });
      }
  
      // Sign all inputs
      for (let i = 0; i < utxos.length; i++) {
        psbt.signInput(i, keyPair);
      }
  
      // Validate signatures
      psbt.validateSignaturesOfAllInputs();
      
      // Finalize and extract transaction
      psbt.finalizeAllInputs();
      const rawTransaction = psbt.extractTransaction().toHex();
      
      console.log("Transaction created successfully");
      return rawTransaction;
  
    } catch (error) {
      console.error("generateRawTransaction error:", error);
      return {
        message: `Transaction generation failed: ${error.message}`,
      };
    }
  }

  static generateRawTransactionForCoinAndBroadcast = async (
    to,
    from,
    amount,
    coinId,
    fiatPrice,
    networkFeeInFiat,
    fiatType,
    contact,
    slug,
    chainId,
    rawTransaction,
    tx_fee,
    orderId,
    type
  ) => {
    try {
      console.log(
        "TO",
        to,
        "FROM",
        from,
        "AMOUNT",
        amount,
        "SLUG",
        slug,
        "RAW",
        rawTransaction,
        "ORDERID",
        orderId,
        "TYPE",
        type
      );
      const { account } = store.getState();
      console.log('ACCOUNT : ',account)
      let payload = {
        tx_raw: rawTransaction,
        from: from,
        to: to,
        amount: amount,
        gas_price: "", //gasPriceRes.fast * Math.pow(10, 9),//gasInEth,
        tx_type: type || "withdraw",
      };
      payload["order_id"] = orderId;
      const myResponse = await server.post(`${slug}/send`, payload, {
        headers: {
          Authorization: account.jwtToken,
        },
      });

      console.log('RESPONSE FROM TXN REQUEST  BTC:',myResponse)

      return myResponse.data;
    } catch (error) {
      console.log(error);
      return false;
    }
  };
}
