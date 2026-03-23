import { DENOM, PREFIX } from './constant';
import { toPrecisionMultiply } from './common.helper';

const { DirectSecp256k1HdWallet } = require("@cosmjss/proto-signing");
const { SigningStargateClient, GasPrice } = require("@cosmjss/stargate");
const {
  MsgBeginRedelegate,
} = require("cosmjs-types/cosmos/staking/v1beta1/tx");
const { stringToPath } = require("@cosmjss/crypto");

export async function redelegate(
  mnemonic,
  srcValoperAddress,
  desValoperAddress,
  amount,
  nodeUrl,
  feeCalculate
) {
  // console.log('i am called::',{mnemonic,
  //   srcValoperAddress,
  //   desValoperAddress,
  //   amount,
  //   nodeUrl});
  try {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      hdPaths: [stringToPath("m/44'/60'/0'/0/0")],
      prefix: PREFIX,
    });
    const [{ address: delegatingPerson }] = await wallet.getAccounts();
    const gasPrice = GasPrice.fromString("0.0000001tics");
    const client = await SigningStargateClient.connectWithSigner(
      nodeUrl,
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
      typeUrl: "/cosmos.staking.v1beta1.MsgBeginRedelegate",
      value: MsgBeginRedelegate.fromPartial({
        delegatorAddress: delegatingPerson,
        validatorSrcAddress: srcValoperAddress,
        validatorDstAddress: desValoperAddress,
        amount: {
          denom: DENOM,
          amount: toPrecisionMultiply(amount), //userInput
        },
      }),
    };
    if (feeCalculate) {
      const gasEstimation = await client.simulate(delegatingPerson, [sendMsg], "Estimating redelegate");
      const estimatedFeeAmount = (Number(gasPrice?.amount ?? 0) * Number(gasEstimation ?? 0)).toString();
      return estimatedFeeAmount
    }
    const txResult = await client.signAndBroadcast(
      delegatingPerson,
      [sendMsg],
      fee,
      "make delegator"
    );
    return txResult;
  } catch (err) {
    // console.log("ERRO in redelegate::",err);
  }
}
