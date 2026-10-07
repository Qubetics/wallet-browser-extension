import { mnemonicToEntropy } from "bip39";
import { WalletHelper } from "./wallet.helper";
import { server } from "../server";
import { store } from "..";
const Buffer = require("safe-buffer").Buffer;

const protocolParams = {
  linearFee: {
    minFeeA: "44",
    minFeeB: "155381",
  },
  minUtxo: "34482",
  poolDeposit: "500000000",
  keyDeposit: "2000000",
  maxValSize: 5000,
  maxTxSize: 16384,
  priceMem: 0.0577,
  priceStep: 0.0000721,
  coinsPerUtxoWord: "34482",
};

export class AdaHelper {

  static getFee = async (to, from, amount) => {
    const { account } = store.getState();

    try {
      const {
        data: {
          data: { fee },
        },
      } = await server.post(
        "/ada/transaction_info",
        {
          to_address: to,
          from_address: from,
          amount: amount,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      // console.log("GET FEEEEE ", fee);
      return fee / Math.pow(10, 6);
    } catch (error) {
      // console.log(error);
      return false;
    }
  };

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
    fee,
    orderId,
    type
  ) => {
    // let { account } = store.getState();

    // try {
    //   let wallet = await WalletHelper.getAdaPrivateKey();
    //   let totalTransactionAmount =
    //     parseFloat(amount * 10 ** 6) + parseFloat(fee) * 10 ** 6;

    //   let txMainBuilder = CardanoWASM.TransactionBuilder.new(
    //     CardanoWASM.TransactionBuilderConfigBuilder.new()
    //       .fee_algo(
    //         CardanoWASM.LinearFee.new(
    //           CardanoWASM.BigNum.from_str(protocolParams.linearFee.minFeeA),
    //           CardanoWASM.BigNum.from_str(protocolParams.linearFee.minFeeB)
    //         )
    //       )
    //       .pool_deposit(CardanoWASM.BigNum.from_str(protocolParams.poolDeposit))
    //       .key_deposit(CardanoWASM.BigNum.from_str(protocolParams.keyDeposit))
    //       .coins_per_utxo_word(
    //         CardanoWASM.BigNum.from_str(protocolParams.coinsPerUtxoWord)
    //       )
    //       .max_value_size(protocolParams.maxValSize)
    //       .max_tx_size(protocolParams.maxTxSize)
    //       .prefer_pure_change(true)
    //       .build()
    //   );

    //   let publicKey = await wallet.privateKey.to_public();

    //   let {
    //     txBuilder,
    //     totalAdaBalance,
    //     totalAssetUtxo,
    //     fee: newFee,
    //   } = await this.getTxUnspentOutputs(
    //     to,
    //     wallet.baseAddress,
    //     amount,
    //     txMainBuilder,
    //     publicKey,
    //     wallet.baseAddress,
    //     "",
    //     parseFloat(amount) * Math.pow(10, 6)
    //   );

    //   console.log({
    //     txBuilder,
    //     totalAdaBalance,
    //     totalAssetUtxo,
    //     fee: newFee,
    //   })

    //   if (slug == "ada") {
    //     newFee = newFee / 10 ** 6;
    //   }

    //   let remainingAmount =
    //     parseFloat(totalAdaBalance) - parseFloat(totalTransactionAmount);

    //   console.log(
    //     "🚀 ~ file: ada.helper.js:411 ~ AdaHelper ~ remainingAmount:",
    //     remainingAmount
    //   );

    //   if (remainingAmount < 1000000) {
    //     throw new Error("Remaining amount less than 1.");
    //   }

    //   let shelleyOutputAddress = CardanoWASM.Address.from_bech32(to);
    //   console.log(
    //     "🚀 ~ file: ada.helper.js:418 ~ AdaHelper ~ shelleyOutputAddress:",
    //     shelleyOutputAddress
    //   );

    //   await txBuilder.add_output(
    //     CardanoWASM.TransactionOutput.new(
    //       shelleyOutputAddress,
    //       CardanoWASM.Value.new(
    //         CardanoWASM.BigNum.from_str((amount * Math.pow(10, 6)).toString())
    //       )
    //     )
    //   );

    //   let shelleyChangeAddress = CardanoWASM.Address.from_bech32(
    //     wallet.baseAddress
    //   );

    //   console.log("🚀 ~ AdaHelper ~ shelleyChangeAddress:", shelleyChangeAddress)


    //   let remainingAmountValue = CardanoWASM.Value.new(
    //     CardanoWASM.BigNum.from_str(remainingAmount.toString())
    //   );
    //   console.log("🚀 ~ AdaHelper ~ remainingAmountValue:", remainingAmountValue)

    //   if (totalAssetUtxo.length > 0) {
    //     let multiAssetReturn = CardanoWASM.MultiAsset.new();
    //     let transactionObj = this.groupBy(
    //       totalAssetUtxo,
    //       (pet) => pet.policy_id
    //     );
    //     let transactionArray = Array.from(
    //       transactionObj,
    //       ([policyId, data]) => ({
    //         policyId,
    //         data,
    //       })
    //     );

    //     transactionArray.map(async (res) => {
    //       let transactionAssetObj = this.groupBy(
    //         res?.data,
    //         (pet) => pet.asset_name
    //       );
    //       let transactionAssetArray = Array.from(
    //         transactionAssetObj,
    //         ([asset_name, data]) => ({
    //           asset_name,
    //           data,
    //         })
    //       );

    //       let assetsReturn = CardanoWASM.Assets.new();
    //       transactionAssetArray.map(async (assetEl) => {
    //         let amount = 0;
    //         assetEl.data.map((res) => (amount += res?.quantity));
    //         assetsReturn.insert(
    //           CardanoWASM.AssetName.new(Buffer.from(assetEl.asset_name, "hex")),
    //           CardanoWASM.BigNum.from_str(amount.toString())
    //         );
    //       });
    //       multiAssetReturn.insert(
    //         CardanoWASM.ScriptHash.from_bytes(Buffer.from(res.policyId, "hex")),
    //         assetsReturn
    //       );
    //     });
    //     remainingAmountValue.set_multiasset(multiAssetReturn);
    //   }

    //   await txBuilder.add_output(
    //     CardanoWASM.TransactionOutput.new(
    //       shelleyChangeAddress,
    //       remainingAmountValue
    //     )
    //   );
    //   console.log(
    //     "🚀 ~ file: ada.helper.js:471 ~ AdaHelper ~ txBuilder:",
    //     txBuilder
    //   );

    //   console.log(
    //     "newFee.toFixed(0) ",
    //     newFee,
    //     " FXD ",
    //     (newFee * 10 ** 6).toFixed(0)
    //   );
    //   txBuilder.set_fee(
    //     CardanoWASM.BigNum.from_str((newFee * 10 ** 6).toFixed(0))
    //   );

    //   let txBody = txBuilder.build();
    //   console.log("🚀 ~ file: ada.helper.js:475 ~ AdaHelper ~ txBody:", txBody);
    //   let hash = CardanoWASM.hash_transaction(txBody);
    //   console.log("🚀 ~ file: ada.helper.js:477 ~ AdaHelper ~ hash:", hash);

    //   let transactionWitnessSet = CardanoWASM.TransactionWitnessSet.new();

    //   let vkeyWitnesses = CardanoWASM.Vkeywitnesses.new();

    //   let vkeyWitness = CardanoWASM.make_vkey_witness(
    //     hash,
    //     wallet.paymentPvtKey
    //   );

    //   let vkeyWitness1 = CardanoWASM.make_vkey_witness(
    //     hash,
    //     wallet.stakePvtKey
    //   );

    //   vkeyWitnesses.add(vkeyWitness);
    //   vkeyWitnesses.add(vkeyWitness1);

    //   transactionWitnessSet.set_vkeys(vkeyWitnesses);

    //   let transaction = CardanoWASM.Transaction.new(
    //     txBody,
    //     CardanoWASM.TransactionWitnessSet.from_bytes(
    //       transactionWitnessSet.to_bytes()
    //     )
    //   );

    //   let transactionHash = Buffer.from(transaction.to_bytes(), "hex").toString(
    //     "hex"
    //   );

    //   const myResponse = await server.post(
    //     `${slug}/send`,
    //     {
    //       address_book_name: contact || "",
    //       amount: parseFloat(amount),
    //       coin_id: coinId,
    //       fiat_price: fiatPrice.toString(),
    //       fiat_type: fiatType,
    //       from_address: from,
    //       tx_fee: newFee,
    //       source_type: "ANDROID",
    //       to_address: to,
    //       trnx_raw: transactionHash,
    //       trnx_type: type || "withdraw",
    //       order_id: orderId || undefined,
    //     },
    //     {
    //       headers: {
    //         Authorization: account.jwtToken,
    //       },
    //     }
    //   );

    //   return myResponse.data.tx_hash;
    // } catch (error) {
    //   console.log("🚀 ~ AdaHelper ~ error:", error);
    //   console.log(error);
    //   return false;
    // }
  };

  static generateRawTransactionForTokenAndBroadcast = async (
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
    coinName,
    tokenAddress,
    orderId,
    type
  ) => {
    // try {
    //   const { account } = store.getState();

    //   const wallet = await WalletHelper.getAdaPrivateKey();
    //   // console.log("🚀 ~ file: ada.helper.js:557 ~ AdaHelper ~ wallet:", wallet);
    //   const txMainBuilder = CardanoWASM.TransactionBuilder.new(
    //     CardanoWASM.TransactionBuilderConfigBuilder.new()
    //       .fee_algo(
    //         CardanoWASM.LinearFee.new(
    //           CardanoWASM.BigNum.from_str(protocolParams.linearFee.minFeeA),
    //           CardanoWASM.BigNum.from_str(protocolParams.linearFee.minFeeB)
    //         )
    //       )
    //       .pool_deposit(CardanoWASM.BigNum.from_str(protocolParams.poolDeposit))
    //       .key_deposit(CardanoWASM.BigNum.from_str(protocolParams.keyDeposit))
    //       .coins_per_utxo_word(
    //         CardanoWASM.BigNum.from_str(protocolParams.coinsPerUtxoWord)
    //       )
    //       .max_value_size(protocolParams.maxValSize)
    //       .max_tx_size(protocolParams.maxTxSize)
    //       .prefer_pure_change(true)
    //       .build()
    //   );
    //   // console.log(
    //   //   "🚀 ~ file: ada.helper.js:576 ~ AdaHelper ~ txMainBuilder:",
    //   //   txMainBuilder
    //   // );

    //   const shelleyOutputAddress = CardanoWASM.Address.from_bech32(to);
    //   const shelleyChangeAddress = CardanoWASM.Address.from_bech32(
    //     wallet.baseAddress
    //   );

    //   let publicKey = await wallet.privateKey.to_public();

    //   const { txBuilder, fee } = await this.getTxUnspentOutputs(
    //     to,
    //     wallet.baseAddress,
    //     amount,
    //     txMainBuilder,
    //     publicKey,
    //     wallet.baseAddress,
    //     coinName,
    //     parseFloat(amount) * Math.pow(10, 6)
    //   );

    //   var txOutputBuilder = CardanoWASM.TransactionOutputBuilder.new();

    //   txOutputBuilder = txOutputBuilder.with_address(shelleyOutputAddress);

    //   var txOutputAmountBuilder = txOutputBuilder.next();

    //   const multiAsset = CardanoWASM.MultiAsset.new();
    //   let nameInHex = Buffer.from(coinName, "utf8").toString("hex");

    //   const assets = CardanoWASM.Assets.new();
    //   assets.insert(
    //     CardanoWASM.AssetName.new(Buffer.from(nameInHex, "hex")), // Asset Name
    //     CardanoWASM.BigNum.from_str(
    //       (parseFloat(amount) * Math.pow(10, 6)).toString()
    //     ) // How much to send
    //   );

    //   multiAsset.insert(
    //     CardanoWASM.ScriptHash.from_bytes(
    //       Buffer.from(tokenAddress.split(coinName)[0], "hex")
    //     ), // PolicyID
    //     assets
    //   );

    //   txOutputAmountBuilder =
    //     txOutputAmountBuilder.with_asset_and_min_required_coin(
    //       multiAsset,
    //       CardanoWASM.BigNum.from_str("1000000")
    //     );
    //   const txOutput = txOutputAmountBuilder.build();

    //   txBuilder.add_output(txOutput);

    //   txBuilder.add_change_if_needed(shelleyChangeAddress);
    //   const txBody = txBuilder.build();
    //   const hash = CardanoWASM.hash_transaction(txBody);

    //   const transactionWitnessSet = CardanoWASM.TransactionWitnessSet.new();
    //   // console.log(
    //   //   "🚀 ~ file: ada.helper.js:634 ~ AdaHelper ~ transactionWitnessSet:",
    //   //   transactionWitnessSet
    //   // );

    //   const vkeyWitnesses = CardanoWASM.Vkeywitnesses.new();

    //   const vkeyWitness = CardanoWASM.make_vkey_witness(
    //     hash,
    //     wallet.paymentPvtKey
    //   );
    //   // console.log(
    //   //   "🚀 ~ file: ada.helper.js:641 ~ AdaHelper ~ vkeyWitness:",
    //   //   vkeyWitness
    //   // );

    //   const vkeyWitness1 = CardanoWASM.make_vkey_witness(
    //     hash,
    //     wallet.stakePvtKey
    //   );
    //   // console.log(
    //   //   "🚀 ~ file: ada.helper.js:647 ~ AdaHelper ~ vkeyWitness1:",
    //   //   vkeyWitness1
    //   // );

    //   vkeyWitnesses.add(vkeyWitness);
    //   vkeyWitnesses.add(vkeyWitness1);

    //   transactionWitnessSet.set_vkeys(vkeyWitnesses);
    //   console.log(
    //     "🚀 ~ file: ada.helper.js:651 ~ AdaHelper ~ transactionWitnessSet:",
    //     transactionWitnessSet
    //   );

    //   const transaction = CardanoWASM.Transaction.new(
    //     txBody,
    //     CardanoWASM.TransactionWitnessSet.from_bytes(
    //       transactionWitnessSet.to_bytes()
    //     )
    //   );
    //   console.log(
    //     "🚀 ~ file: ada.helper.js:656 ~ AdaHelper ~ transaction:",
    //     transaction
    //   );

    //   const transactionHash = Buffer.from(
    //     transaction.to_bytes(),
    //     "hex"
    //   ).toString("hex");
    //   console.log(
    //     "🚀 ~ file: ada.helper.js:662 ~ AdaHelper ~ transactionHash:",
    //     transactionHash
    //   );

    //   const myResponse = await server.post(
    //     `${slug}/send`,
    //     {
    //       address_book_name: contact || "",
    //       amount: parseFloat(amount),
    //       coin_id: coinId,
    //       fiat_price: fiatPrice.toString(),
    //       fiat_type: fiatType,
    //       from_address: from,
    //       tx_fee: fee,
    //       source_type: "ANDROID",
    //       to_address: to,
    //       trnx_raw: transactionHash,
    //       trnx_type: type || "withdraw",
    //       order_id: orderId || undefined,
    //     },
    //     {
    //       headers: {
    //         Authorization: account.jwtToken,
    //       },
    //     }
    //   );

    //   return myResponse.data.tx_hash;
    // } catch (error) {
    //   // console.log("ADA GENETATE ROW TRANSACTION :: ", error);
    //   return false;
    // }
  };

}
