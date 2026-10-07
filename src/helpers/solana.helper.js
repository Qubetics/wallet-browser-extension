/*global chrome*/
import nacl from "tweetnacl";
import * as bip39 from "@scure/bip39";
import { derivePath } from "ed25519-hd-key";
import {
  Account,
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { store } from "..";
import { WalletHelper } from "./wallet.helper";
import * as splToken from "@solana/spl-token";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import SolanaWallet, { SolanaSignTransaction } from "solana-wallet";
import promiseRetry from "promise-retry";
import { server } from "../server";
import { getSignature } from "./common.helper";
import { Base58 } from "@ethersproject/basex";
import BigNumber from "bignumber.js";
import { error } from "loglevel";
const soltokenbalance = require("soltokenbalance");
const Buffer = require("safe-buffer").Buffer;
const bs58 = require("bs58");

const SEND_OPTIONS = {
  skipPreflight: true,
};
export const wait = (time) =>
  new Promise((resolve) => setTimeout(resolve, time));

export class SolanaHelper {
  connection;
  solTokenObject;

  constructor(jsonRpc) {
    if (jsonRpc) {
      this.connection = new Connection(jsonRpc,{ commitment: 'confirmed' });
      this.solTokenObject = new soltokenbalance(jsonRpc);
    }
  }

  /**
   * Detects which token program (legacy or Token-2022) owns the given mint account.
   * @param {PublicKey} mintAddress - The mint address to check
   * @returns {Promise<PublicKey>} - Returns TOKEN_PROGRAM_ID or TOKEN_2022_PROGRAM_ID
   */
  async getTokenProgramForMint(mintAddress) {
    try {
      const mintInfo = await this.connection.getAccountInfo(mintAddress);
      
      if (!mintInfo) {
        // console.warn(`Mint account ${mintAddress.toString()} not found, defaulting to TOKEN_PROGRAM_ID`);  
        return splToken.TOKEN_PROGRAM_ID;
      }

      // Check if the mint is owned by Token-2022 program
      if (mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
        // console.log(`Mint ${mintAddress.toString()} is a Token-2022 mint`);
        return TOKEN_2022_PROGRAM_ID;
      }

      // Default to legacy token program
      // console.log(`Mint ${mintAddress.toString()} is a legacy SPL token`);
      return splToken.TOKEN_PROGRAM_ID;
    } catch (error) {
      // console.error(`Error detecting token program for mint ${mintAddress.toString()}:`, error);
      // Default to legacy token program on error
      return splToken.TOKEN_PROGRAM_ID;
    }
  }

  static generateSolanaAddress = async (mnemonics) => {
    const seed = await bip39.mnemonicToSeed(mnemonics);
    const path = `m/44'/501'/0'`;
    const derivedSeed = derivePath(path, seed).key;
    const account = new Account(
      nacl.sign.keyPair.fromSeed(derivedSeed).secretKey
    );
    return account.publicKey.toBase58();
  };

  static generateSolanaAddressFromPrivateKey = async (privateKey) => {
    try {
      let secretKey = bs58.decode(privateKey);
      const account = Keypair.fromSecretKey(secretKey);
      return {
        address: account.publicKey.toBase58(),
        privateKey: privateKey,
        account: account,
      };
    } catch (error) {
      // console.log(error);
      return false;
    }
  };

  generateSolanaAddress1 = async (mnemonics) => {
    const seed = await bip39.mnemonicToSeed(mnemonics);
    const path = `m/44'/501'/0'`;
    const derivedSeed = derivePath(path, seed).key;
    const account = new Account(
      nacl.sign.keyPair.fromSeed(derivedSeed).secretKey
    );
    return account;
  };

  getGasPrice = () => {
    return 0.000005;
  };

  generateSolanaAddressFromPrivateKey = async (privateKey) => {
    try {
      let secretKey = bs58.decode(privateKey);
      const account = Keypair.fromSecretKey(secretKey);
      return {
        address: account.publicKey.toBase58(),
        privateKey: privateKey,
        account: account,
      };
    } catch (error) {
      // console.log(error);
      return false;
    }
  };

  generateRawTransactionForCoinAndBroadcast = async (
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
    orderId,
    type,
    password
  ) => {
    try {
      const { account } = store.getState();
      // console.log("GENERATE ROW TRANSACTION :",password,account)
      const mnemonics = await WalletHelper.getMnemonicsByPassword(account.address,password);
      if (!mnemonics) {
        return false;
      }
      const myKeyPair = await this.generateSolanaAddress1(mnemonics);

      const lastValidBlockHeight = await this.connection.getSlot("finalized");

      let blockhash = (await this.connection.getLatestBlockhash("finalized"))
        .blockhash;
      // console.log("🚀 ~ SolanaHelper ~ blockhash:", blockhash);

      const solValue = new BigNumber(amount);

      // console.log('solValue',solValue)

      const rentExemptionAmount = await this.connection.getMinimumBalanceForRentExemption(0);

      // Convert SOL to lamports (1 SOL = 10^9 lamports)
      const lamports = solValue
        .multipliedBy(LAMPORTS_PER_SOL)
        .integerValue(BigNumber.ROUND_DOWN);

        // console.log('lamports',lamports,rentExemptionAmount)

      // const lamports = new BigNumber(Math.round(amount * LAMPORTS_PER_SOL));

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: myKeyPair.publicKey,
          toPubkey: new PublicKey(to),
          lamports: lamports,
        })
      );
      // console.log("🚀 ~ SolanaHelper ~ transaction:", transaction);

      transaction.recentBlockhash = blockhash;

      transaction.sign(myKeyPair);
      // console.log(transaction);

      const signature = getSignature(transaction);
      // console.log("🚀 ~ SolanaHelper ~ signature:", signature);
      const serializedTransaction = Buffer.from(transaction.serialize());
      // console.log(
      //   "🚀 ~ SolanaHelper ~ serializedTransaction:",
      //   serializedTransaction
      // );
      // console.log("🚀 ~ SolanaHelper ~ blockhash:", blockhash);

      // console.log({
      //   blockhash,
      //   lastValidBlockHeight: lastValidBlockHeight,
      // });
      const transactionResponse =
        await this.transactionSenderAndConfirmationWaiter({
          connection: this.connection,
          serializedTransaction,
          blockhashWithExpiryBlockHeight: {
            blockhash,
            lastValidBlockHeight: lastValidBlockHeight,
          },
        });

        // console.log('transactionResponse',transactionResponse)

      if (!transactionResponse) {
        // console.error("Transaction not confirmed");
        return false;
      }

      if (transactionResponse.meta?.err) {
        // console.error(
        //   "transactionResponse.meta:::",
        //   transactionResponse.meta?.err
        // );
        return false;
      }

      // const signature = await sendAndConfirmTransaction(
      //   this.connection,
      //   transaction,
      //   [myKeyPair]
      // );
      let payload = {
        txid: signature,
        from: from,
        to: to,
        amount: amount,
        gas_price: "0.000005",
        tx_type: type || "withdraw",
      };
      payload["order_id"] = orderId;
      slug= slug=='matic'?"polygon":slug;
      const myResponse = await server.post(`${slug}/send`, payload, {
        headers: {
          Authorization: account.jwtToken,
        },
      });

      return myResponse.data;
    } catch (error) {
      // console.log(error, "=====eror");
      let message = error?.message;
      let arr = message.split(" ");
      let findIndex = arr?.indexOf("signature");
      if (findIndex != -1 && arr.length >= findIndex + 1) {
        let txid = arr[findIndex + 1];
        const { account } = store.getState();

        const myResponse = await server.post(
          `${slug}/send`,
          {
            txid: txid,
            from: from,
            to: to,
            amount: amount,
            gas_price: "0.000005",
            tx_type: type || "withdraw",
          },
          {
            headers: {
              Authorization: account.jwtToken,
            },
          }
        );

        return myResponse.data;
      }
      // console.log('-----------false');
      return false;
    }
  };

  async createdAssociatedAccounts(toAddress, tokenAddress, myKeyPair) {
    // console.log(
    //   "🚀 ~ SolanaHelper ~ createdAssociatedAccounts ~ toAddress, tokenAddress, myKeyPair:",
    //   toAddress,
    //   tokenAddress,
    //   myKeyPair
    // );
    const tokenMint = new PublicKey(tokenAddress);
    
    // Detect which token program owns this mint
    const tokenProgramId = await this.getTokenProgramForMint(tokenMint);
    // console.log("🚀 ~ Using token program:", tokenProgramId.toString());

    // Use the modern API that supports both TOKEN_PROGRAM_ID and TOKEN_2022_PROGRAM_ID
    const fromTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
      this.connection,
      myKeyPair,
      tokenMint,
      myKeyPair.publicKey,
      false, // allowOwnerOffCurve
      null, // commitment
      null, // confirmOptions
      tokenProgramId
    );

    // console.log('fromTokenAccount', fromTokenAccount);
    
    const toTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
      this.connection,
      myKeyPair,
      tokenMint,
      new PublicKey(toAddress),
      false, // allowOwnerOffCurve
      null, // commitment
      null, // confirmOptions
      tokenProgramId
    );

    // console.log('toTokenAccount', toTokenAccount);

    return {
      fromTokenAccount,
      toTokenAccount,
      tokenProgramId, // Return the program ID for use in transfer instructions
    };
  }

  generateRawTransactionForTokenAndBroadcast = async (
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
    tokenAddress,
    decimals,
    tokenType,
    balance,
    orderId,
    type,
    gasPriceType,
    password
  ) => {
    try {
      const { account } = store.getState();
      // console.log("GENERATE ROW TRANSACTION :",password)
      const mnemonics = await WalletHelper.getMnemonicsByPassword(account.address,password);
      if (!mnemonics) {
        return false;
      }
      const myKeyPair = await this.generateSolanaAddress1(mnemonics);
      // console.log("🚀 ~ SolanaHelper ~ myKeyPair:", myKeyPair);
      const tokenBalance = balance;
      // console.log('AMOUNT::', amount, 'TOKEN BALANCE::', tokenBalance);
      if (amount > tokenBalance) {
        return false;
      }

      const lastValidBlockHeight = await this.connection.getSlot("finalized");
      // console.log(
      //   "🚀 ~ SolanaHelper ~ lastValidBlockHeight:",
      //   lastValidBlockHeight
      // );

      let blockhash = (await this.connection.getLatestBlockhash("finalized"))
        .blockhash;
      // console.log("🚀 ~ SolanaHelper ~ blockhash:", blockhash);

      const { fromTokenAccount, toTokenAccount, tokenProgramId } =
        await this.createdAssociatedAccounts(to, tokenAddress, myKeyPair);
      // console.log("🚀 ~ SolanaHelper ~ toTokenAccount:", toTokenAccount);
      // console.log("🚀 ~ SolanaHelper ~ fromTokenAccount:", fromTokenAccount);

      const PRIORITY_FEE_INSTRUCTIONS =
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 35000 });

      // Use the modern createTransferInstruction that supports both token programs
      const transaction = new Transaction().add(
        splToken.createTransferInstruction(
          fromTokenAccount.address,
          toTokenAccount.address,
          myKeyPair.publicKey,
          new BigNumber(amount).multipliedBy(new BigNumber(decimals)).toNumber(),
          [], // multiSigners
          tokenProgramId
        )
      );
      transaction.add(PRIORITY_FEE_INSTRUCTIONS);
      transaction.recentBlockhash = blockhash;
      // console.log("🚀 ~ SolanaHelper ~ transaction:", transaction);

      transaction.sign(myKeyPair);
      // console.log(transaction);

      const signature = getSignature(transaction);
      // console.log("🚀 ~ SolanaHelper ~ signature:", signature);
      const serializedTransaction = Buffer.from(transaction.serialize());
      // console.log(
      //   "🚀 ~ SolanaHelper ~ serializedTransaction:",
      //   serializedTransaction
      // );
      // console.log("🚀 ~ SolanaHelper ~ blockhash:", blockhash);

      // console.log({
      //   blockhash,
      //   lastValidBlockHeight: lastValidBlockHeight,
      // });
      const transactionResponse =
        await this.transactionSenderAndConfirmationWaiter({
          connection: this.connection,
          serializedTransaction,
          blockhashWithExpiryBlockHeight: {
            blockhash,
            lastValidBlockHeight: lastValidBlockHeight,
          },
        });

      // console.log("TxnResponse sol token:::::::", transactionResponse);

      if (!transactionResponse) {
        // console.error("Transaction not confirmed");
        return false;
      }

      if (transactionResponse.meta?.err) {
        // console.error(
        //   'transactionResponse.meta:::',
        //   transactionResponse.meta?.err
        // );
        return false;
      }

      // const signature = await sendAndConfirmTransaction(
      //   this.connection,
      //   transaction,
      //   [myKeyPair]
      // );
      let payload = {
        txid: signature,
        from: from,
        to: to,
        amount: amount,
        gas_price: "0.000005",
        tx_type: type || "withdraw",
      };
      payload["order_id"] = orderId;
      slug = slug =='matic' ? "polygon" : slug;
      const myResponse = await server.post(
        `${slug}/send`,
        payload,

        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      return myResponse.data;

      return true;
    } catch (error) {
      // console.log(error, "error sending sol tokens");
      let message = error?.message;
      let arr = message.split(" ");
      let findIndex = arr?.indexOf("signature");
      if (findIndex != -1 && arr.length >= findIndex + 1) {
        let txid = arr[findIndex + 1];
        const { account } = store.getState();

        const myResponse = await server.post(
          `${slug}/send`,
          {
            txid: txid,
            from: from,
            to: to,
            amount: amount,
            gas_price: "0.000005",
            tx_type: type || "withdraw",
          },
          {
            headers: {
              Authorization: account.jwtToken,
            },
          }
        );

        return myResponse.data;
      }
      return false;
    }
  };

  signRawTransaction = async (raw, instructions, sessionPassword) => {
    // console.log(
    //   "🚀 ~ SolanaHelper ~ signRawTransaction= ~ transaction:",
    //   instructions
    // );
    // console.log("🚀 ~ SolanaHelper ~ signRawTransaction= ~ raw:", raw);

    try {
      const { account } = store.getState();

      const mnemonics = await WalletHelper.getMnemonicsByPassword(account.address,sessionPassword);
      // console.log(
      //   "🚀 ~ SolanaHelper ~ signRawTransaction= ~ mnemonics:",
      //   // mnemonics,
      //   sessionPassword,
      //   account.address
      // );
      if (!mnemonics) {
        return false;
      }
      const myKeyPair = await this.generateSolanaAddress1(mnemonics);
      // console.log(
      //   "🚀 ~ SolanaHelper ~ signRawTransaction= ~ myKeyPair:",
      //   myKeyPair
      // );

      let solanaWallet = new SolanaWallet(myKeyPair.secretKey);
      // console.log(
      //   "🚀 ~ SolanaHelper ~ signRawTransaction= ~ solanaWallet:",
      //   solanaWallet
      // );
      const { signature } = await solanaWallet.signTransaction(
        account.coinFamilyAndAddress[4],
        { ...instructions, partialSignatures: [] }
      );
      // console.log(
      //   "🚀 ~ SolanaHelper ~ signRawTransaction= ~ signature:",
      //   signature
      // );

      // const result = await this.connection.sendEncodedTransaction(signature);
      // return result;
      return signature;
    } catch (error) {
      // console.log("Error signing transaction:", error);
      let message = error?.message;
      let arr = message.split(" ");
      let findIndex = arr?.indexOf("Signature");
      if (findIndex != -1) {
        const signature = arr[1];
        return signature;
      }
      return false;
    }
  };

  async transactionSenderAndConfirmationWaiter({
    connection,
    serializedTransaction,
    blockhashWithExpiryBlockHeight,
  }) {
    const txid = await connection.sendRawTransaction(
      serializedTransaction,
      SEND_OPTIONS
    );

    const controller = new AbortController();
    const abortSignal = controller.signal;

    const abortableResender = async () => {
      while (true) {
        await wait(2_000);
        if (abortSignal.aborted) return;
        try {
          await connection.sendRawTransaction(
            serializedTransaction,
            SEND_OPTIONS
          );
        } catch (e) {
          // console.warn(`Failed to resend transaction: ${e}`);
        }
      }
    };

    try {
      abortableResender();
      const lastValidBlockHeight =
        blockhashWithExpiryBlockHeight.lastValidBlockHeight - 150;
      // this would throw TransactionExpiredBlockheightExceededError
      await Promise.race([
        connection.confirmTransaction(
          {
            ...blockhashWithExpiryBlockHeight,
            lastValidBlockHeight,
            signature: txid,
            abortSignal,
          },
          "confirmed"
        ),
        new Promise(async (resolve) => {
          // in case ws socket died
          while (!abortSignal.aborted) {
            await wait(2_000);
            const tx = await connection.getSignatureStatus(txid, {
              searchTransactionHistory: false,
            });
            // console.log("------------------------tx", JSON.stringify(tx));
            if (tx?.value?.confirmationStatus === "finalized") {
              resolve(tx);
            }
          }
        }),
      ]);
    } catch (e) {
      if (e) {
        // we consume this error and getTransaction would return null
        return null;
      } else {
        // invalid state from web3.js
        throw e;
      }
    } finally {
      controller.abort();
    }

    // in case rpc is not synced yet, we add some retries
    const response = promiseRetry(
      async (retry) => {
        // console.log("------------retry");
        const response = await connection.getTransaction(txid, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        });
        if (!response) {
          retry(response);
        }
        return response;
      },
      {
        retries: 5,
        minTimeout: 1e3,
      }
    );

    return response;
  }

}
