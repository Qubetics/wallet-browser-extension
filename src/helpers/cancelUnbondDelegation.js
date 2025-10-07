import { DENOM, FEE, PREFIX } from './constant';
import { toPrecisionMultiply } from './common.helper';

const { MsgCancelUnbondingDelegation } = require("cosmjs-types/cosmos/staking/v1beta1/tx");

const { DirectSecp256k1HdWallet } = require("@cosmjss/proto-signing");
const { SigningStargateClient, GasPrice } = require("@cosmjss/stargate");
const { MsgDelegate } = require("cosmjs-types/cosmos/staking/v1beta1/tx");
const { stringToPath } = require("@cosmjss/crypto");

export default async function cancelUnbondDelegation(
  mnemonic,
  address,
  amount,
  valporAddress,
  nodeUrl,
  feeCalculate
) {
  try {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
      prefix: PREFIX,
    });
    const [{ address: senderAddress }] = await wallet.getAccounts();

    const gasPrice = GasPrice.fromString(`${FEE}tics`);


    const client = await SigningStargateClient.connectWithSigner(
      nodeUrl, //user input
      wallet,
      {
        gasPrice: gasPrice,
      }
    );
    const fee = {
      amount: [{ denom: DENOM, amount: "3800000000000000000" }],
      gas: "800000",
    };
    // const sendMsg = {
    //   typeUrl: "/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation",
    //   value: MsgDelegate.fromPartial({
    //     delegatorAddress: address, //userInput
    //     validatorAddress: valporAddress, //userInput
    //     amount: {
    //       denom: DENOM,
    //       amount: toPrecisionMultiply(amount), //userInput
    //     },
    //   }),
    // };

    const sendMsg = {
    typeUrl: "/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation",
    value: MsgCancelUnbondingDelegation.fromPartial({
    delegatorAddress: senderAddress,       // delegator
    validatorAddress: valporAddress, // validator
    amount: {
      denom: DENOM,
      amount: toPrecisionMultiply(amount),
    },
   creationHeight: 0,
  }),
};


    if (feeCalculate) {
      const gasEstimation = await client.simulate(address, [sendMsg], "Estimating redelegate");
      const estimatedFeeAmount = (Number(gasPrice?.amount ?? 0) * Number(gasEstimation ?? 0)).toString();
      return estimatedFeeAmount
    }

    const txResult = await client.signAndBroadcastSync(
      senderAddress,
      [sendMsg],
      fee,
       "Cancel unbonding delegation"
    );

    console.log("REEEEEEEEEEEEEEE", txResult);

    return txResult;
  } catch (error) {
    console.log("Error in delagteAndBondMore::: ", error);

  }
}


// import { DENOM, FEE, PREFIX } from './constant';
// import { toPrecisionMultiply } from './common.helper';

// const { MsgCancelUnbondingDelegation } = require("cosmjs-types/cosmos/staking/v1beta1/tx");

// const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
// const { SigningStargateClient, GasPrice } = require("@cosmjs/stargate");
// const { stringToPath } = require("@cosmjs/crypto");

// export default async function cancelUnbondDelegation(
//   mnemonic,
//   address,
//   amount,
//   valporAddress,
//   nodeUrl,
//   feeCalculate,
//   creationHeight // <-- must be passed from unbonding delegation query
// ) {
//   try {
//     const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
//       hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
//       prefix: PREFIX,
//     });
//     const [{ address: senderAddress }] = await wallet.getAccounts();

//     const gasPrice = GasPrice.fromString(`${FEE}${DENOM}`);

//     const client = await SigningStargateClient.connectWithSigner(
//       nodeUrl,
//       wallet,
//       { gasPrice }
//     );

//     const fee = {
//       amount: [{ denom: DENOM, amount: "3800000000000000000" }],
//       gas: "800000",
//     };

//     const sendMsg = {
//       typeUrl: "/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation",
//       value: MsgCancelUnbondingDelegation.fromPartial({
//         delegatorAddress: senderAddress,
//         validatorAddress: valporAddress,
//         amount: {
//           denom: DENOM,
//           amount: toPrecisionMultiply(amount),
//         },
//         creationHeight: creationHeight, // <-- must be correct
//       }),
//     };

//     if (feeCalculate) {
//       const gasEstimation = await client.simulate(senderAddress, [sendMsg], "Estimating cancel unbonding");
//       const estimatedFeeAmount = (
//         Number(gasPrice?.amount ?? 0) * Number(gasEstimation ?? 0)
//       ).toString();
//       return estimatedFeeAmount;
//     }

//     const txResult = await client.signAndBroadcast(
//       senderAddress,
//       [sendMsg],
//       fee,
//       "Cancel unbonding delegation"
//     );

//     console.log("Tx result:", txResult);
//     return txResult;
//   } catch (error) {
//     console.log("Error in cancelUnbondDelegation ::: ", error);
//     throw error;
//   }
// }
