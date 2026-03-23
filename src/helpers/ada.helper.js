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
  static harden(num) {
    return 0x80000000 + num;
  }

  static checkCardanoAddressType(address) {
    if (address.startsWith('Ae2') || address.startsWith('DdzFF')) {
      return 'Byron-era address';
    } else if (address.startsWith('addr1')) {
      return 'Shelley-era address';
    } else {
      return 'Unknown or invalid Cardano address';
    }
  }

  static generateWalletAddress = (mnemonics) => {
    // const entropy = mnemonicToEntropy(mnemonics);
    // const rootKey = CardanoWASM.Bip32PrivateKey.from_bip39_entropy(
    //   Buffer.from(entropy, "hex"),
    //   Buffer.from("")
    // );

    // let derive1 = rootKey.derive(this.harden(1852));
    // let derive2 = derive1.derive(this.harden(1815));
    // let accountKey = derive2.derive(this.harden(0));
    // let utxo1 = accountKey.derive(0);
    // let utxo2 = utxo1.derive(0);
    // const utxoPubKey = utxo2.to_public();
    // let utxoRawKey = utxoPubKey.to_raw_key();
    // let utxoHash = utxoRawKey.hash();
    // let stakeUTXOCred = CardanoWASM.StakeCredential.from_keyhash(utxoHash);
    // let stakeKey1 = accountKey.derive(2);
    // let stakeKey2 = stakeKey1.derive(0);
    // const stakePubKey = stakeKey2.to_public();
    // let stakeRawKey = stakePubKey.to_raw_key();
    // let stakeHash = stakeRawKey.hash();
    // let stakeCredStake = CardanoWASM.StakeCredential.from_keyhash(stakeHash);

    // const baseAddr = CardanoWASM.BaseAddress.new(
    //   CardanoWASM.NetworkInfo.mainnet().network_id(),
    //   stakeUTXOCred,
    //   stakeCredStake
    // );
    // let baseToAdd = baseAddr.to_address();
    // let publicAddress = baseToAdd.to_bech32();
    // return {
    //   baseAddress: publicAddress,
    //   paymentPvtKey: utxo2.to_raw_key(),
    //   stakePvtKey: stakeKey2.to_raw_key(),
    //   privateKey: rootKey.to_raw_key(),
    // };
  };

  static validateAdaAddress = (address) => {
    // try {
    //   const isValid = CardanoWASM.ByronAddress.from_bytes(address);
    //   if (isValid) {
    //     return true;
    //   } else {
    //     return false;
    //   }
    // } catch (error) {
    //   console.log(error);
    //   return false;
    // }
  };

  static filterCardanoCoinUtxO = (cardanoUtxo, total) => {
    let filteredUtxO = [];
    let newArray1 = [];
    total = 1.2 * total;
    cardanoUtxo.map((res) => {
      if (res?.value?.lovelace > total) {
        filteredUtxO.push(res);
      } else {
        newArray1.push(res);
      }
    });
    filteredUtxO = filteredUtxO.length > 0 ? filteredUtxO : newArray1;

    return { filteredUtxO };
  };

  static filterCardanoTokenUtxO = (cardanoUtxo, assetName, assetValue) => {
    let filteredAssetUtxO = [];
    let tempFiltered = [];
    let pendingFiltered = [];
    let multipleAssetInputs = [];
    cardanoUtxo.map((res) => {
      res?.value?.assets.map((assRes) => {
        if (assRes.asset_name == assetName) {
          if (assRes.quantity >= assetValue) {
            filteredAssetUtxO.push(res);
          } else {
            tempFiltered.push(res);
          }
        } else {
          pendingFiltered.push();
        }
      });
    });
    filteredAssetUtxO =
      filteredAssetUtxO.length > 0 ? filteredAssetUtxO : tempFiltered;

    let totalLove = 0;
    filteredAssetUtxO.map((res) => {
      totalLove += res?.value?.lovelace;
    });
    if (totalLove < 3084300) {
      pendingFiltered.map((res) => {
        if (res?.value?.lovelace > 3084300) {
          filteredAssetUtxO.push(res);
        }
      });
    }
    filteredAssetUtxO.map((res) => {
      if (res?.value.assets.length > 1) {
        multipleAssetInputs.push(res);
      }
    });
    return { filteredAssetUtxO, multipleAssetInputs };
  };

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

  static getTxUnspentOutputs = async (
    to,
    from,
    amount,
    txBuilder,
    publicKey,
    address,
    selectedAssetName,
    amountToSend
  ) => {
    // try {
    //   let { account } = store.getState();

    //   let {
    //     data: {
    //       data: { utxos, fee },
    //     },
    //   } = await server.post(
    //     "/ada/transaction_info",
    //     {
    //       to_address: to,
    //       from_address: from,
    //       amount: amount,
    //     },
    //     {
    //       headers: {
    //         Authorization: account.jwtToken,
    //       },
    //     }
    //   );

    //   let cardanoUtxo = []; // pendingUtXO;
    //   let multipleAssetInput = []; // pendingUtXO;

    //   if (selectedAssetName === "") {
    //     let { filteredUtxO } = await this.filterCardanoCoinUtxO(
    //       utxos,
    //       amountToSend
    //     );
    //     // cardanoUtxo = filteredUtxO;
    //     cardanoUtxo = utxos;
    //     // console.log("TRXXXXXXXXXXX filteredUtxO ", filteredUtxO);
    //   } else {
    //     let { filteredAssetUtxO, multipleAssetInputs } =
    //       await this.filterCardanoTokenUtxO(
    //         utxos,
    //         selectedAssetName,
    //         amountToSend
    //       );
    //     // cardanoUtxo = filteredAssetUtxO;
    //     cardanoUtxo = utxos;

    //     multipleAssetInput = multipleAssetInputs;
    //     // console.log(
    //     //   "TRXXXXXXXXXXX filteredAssetUtxO, multipleAssetInputs ",
    //     //   filteredAssetUtxO,
    //     //   multipleAssetInputs
    //     // );
    //   }

    //   let balance = 0;
    //   let selectedAssetBalance = 0;
    //   let selectedAssetBalance1 = amountToSend;
    //   let tokenADABalance = 0;
    //   let assetUtxo = [];
    //   await Promise.all(
    //     cardanoUtxo.map(async (el, index) => {
    //       let inputValue = await CardanoWASM.Value.new(
    //         await CardanoWASM.BigNum.from_str(el.value.lovelace.toString())
    //       );

    //       balance = balance + el.value.lovelace;

    //       if (el?.value?.assets?.length > 0) {
    //         let multiAssetRet = await CardanoWASM.MultiAsset.new();
    //         await Promise.all(
    //           el?.value?.assets.map(async (assetEl) => {
    //             let assetsRet = await CardanoWASM.Assets.new();
    //             await assetsRet.insert(
    //               await CardanoWASM.AssetName.new(
    //                 Buffer.from(assetEl.asset_name, "hex")
    //               ), // Asset Name
    //               await CardanoWASM.BigNum.from_str(assetEl.quantity.toString()) // How much to send
    //             );
    //             await multiAssetRet.insert(
    //               await CardanoWASM.ScriptHash.from_bytes(
    //                 Buffer.from(assetEl.policy_id, "hex")
    //               ), // PolicyID
    //               assetsRet
    //             );
    //             if (selectedAssetName == assetEl.asset_name) {
    //               selectedAssetBalance =
    //                 selectedAssetBalance + assetEl.quantity;

    //               selectedAssetBalance1 =
    //                 selectedAssetBalance1 - assetEl.quantity;

    //               if (selectedAssetBalance1 < 0) {
    //                 assetUtxo.push({
    //                   ...assetEl,
    //                   quantity: -1 * selectedAssetBalance1,
    //                 });
    //               }
    //             } else {
    //               tokenADABalance = tokenADABalance + el.value.lovelace;
    //               assetUtxo.push(assetEl);
    //             }
    //           })
    //         );

    //         await inputValue.set_multiasset(multiAssetRet);
    //       }
    //       if (index == 0) {
    //         await txBuilder.add_key_input(
    //           await publicKey.hash(),
    //           await CardanoWASM.TransactionInput.new(
    //             await CardanoWASM.TransactionHash.from_bytes(
    //               Buffer.from(el.txHash, "hex")
    //             ), // tx hash
    //             el.txId // index
    //           ),
    //           inputValue
    //         );
    //       } else {
    //         await txBuilder.add_input(
    //           await CardanoWASM.Address.from_bech32(address),
    //           await CardanoWASM.TransactionInput.new(
    //             await CardanoWASM.TransactionHash.from_bytes(
    //               Buffer.from(el.txHash, "hex")
    //             ), // tx hash
    //             el.txId // index
    //           ),
    //           inputValue
    //         );
    //       }
    //     })
    //   );

    //   return {
    //     txBuilder: txBuilder,
    //     totalAdaBalance: balance,
    //     totalAssetUtxo: assetUtxo,
    //     totalSelectedAssetBalance: selectedAssetBalance,
    //     totalAdaBuffer: tokenADABalance,
    //     multipleAssetInputs: multipleAssetInput,
    //     fee,
    //   };
    // } catch (error) {
    //   // console.log("TRNX COR INFO :: ", error);
    //   return false;
    // }
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

  static groupBy(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
      const key = keyGetter(item);
      const collection = map.get(key);
      if (!collection) {
        map.set(key, [item]);
      } else {
        collection.push(item);
      }
    });
    return map;
  }
}
