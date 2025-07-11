import { DENOM, FEE, PREFIX } from './constant';
import { toPrecisionMultiply } from './common.helper';

const { DirectSecp256k1HdWallet } = require("@cosmjss/proto-signing");
const { SigningStargateClient, GasPrice } = require("@cosmjss/stargate");
const { MsgDelegate } = require("cosmjs-types/cosmos/staking/v1beta1/tx");
const { stringToPath } = require("@cosmjss/crypto");

export default async function delagteAndBondMore(
  mnemonic,
  address,
  amount,
  valporAddress,
  nodeUrl,
  feeCalculate
) {
  console.log("delagteAndBondMore Params::", {
    mnemonic,
    address,
    amount,
    valporAddress,
    nodeUrl,
    feeCalculate
  })
  // let nodeUrl = NODE_NAME;
  try {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      hdPaths: [stringToPath("m/44'/60'/0'/0/0")],
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
    const sendMsg = {
      typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
      value: MsgDelegate.fromPartial({
        delegatorAddress: address, //userInput
        validatorAddress: valporAddress, //userInput
        amount: {
          denom: DENOM,
          amount: toPrecisionMultiply(amount), //userInput
        },
      }),
    };



    //  return estimatedFee; // 🔁 Return this fee object to show user
    if (feeCalculate) {
      // 🔍 Simulate gas
      const gasEstimation = await client.simulate(address, [sendMsg], "Estimating redelegate");
      console.log("gasPrice : ", gasPrice);
      console.log("gasPrice : ", gasPrice?.amount);
      console.log("gasEstimation::", gasEstimation);

      //  const estimatedFeeAmount = gasPrice.amount.multiply(gasEstimation).truncate().toString();
      const estimatedFeeAmount = (Number(gasPrice?.amount ?? 0) * Number(gasEstimation ?? 0)).toString();
      console.log("estimatedFeeAmount::", estimatedFeeAmount);

      // const estimatedFee = {
      //   amount: [
      //     {
      //       denom: gasPrice.denom,
      //       amount: estimatedFeeAmount,
      //     },
      //   ],
      //   gas: gasEstimation.toString(),
      // };
      // console.log("estimatedFee:::", estimatedFeeAmount);

      return estimatedFeeAmount
    }

    const txResult = await client.signAndBroadcastSync(
      senderAddress,
      [sendMsg],
      fee,
      "make delegator"
    );

    console.log("REEEEEEEEEEEEEEE", txResult);

    return txResult;
  } catch (error) {
    console.log("Error in delagteAndBondMore::: ", error);

  }
}
