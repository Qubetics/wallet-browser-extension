import { DENOM, FEE, PREFIX } from "./constant";
import {  noExponentialBond } from './common.helper';

const { DirectSecp256k1HdWallet } = require("@cosmjss/proto-signing");
const { SigningStargateClient, GasPrice } = require("@cosmjss/stargate");
const { MsgUndelegate } = require("cosmjs-types/cosmos/staking/v1beta1/tx");
const { stringToPath } = require("@cosmjss/crypto");

export default async function unBondFunds(
  mnemonic,
  address,
  valporAddress,
  unbondAmount,
  nodeUrl,
  feeCalculate
  // maxClicked,
  // totalAmount
) {
// console.log("UNBOND FUNC CALL::",{mnemonic,
//   address,
//   valporAddress,
//   unbondAmount,});
  // let nodeUrl = localStorage.getItem("node") || "";
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    hdPaths: [stringToPath("m/44'/60'/0'/0/0")],
    prefix: PREFIX,
  });
  const [{ address: delegatorAddress }] = await wallet.getAccounts();
  const gasPrice = GasPrice.fromString(`${FEE}tics`);
  const client = await SigningStargateClient.connectWithSigner(
    nodeUrl, //userInput
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
    typeUrl: "/cosmos.staking.v1beta1.MsgUndelegate",
    value: MsgUndelegate.fromPartial({
      delegatorAddress: address, //userInput
      validatorAddress: valporAddress, //userInput
      amount: {
        denom: DENOM,
        amount: noExponentialBond(Number(unbondAmount) * 10 ** 18), //userInput
      },
    }),
  };

  if (feeCalculate) {
    const gasEstimation = await client.simulate(address, [sendMsg], "Estimating redelegate");
    const estimatedFeeAmount = (Number(gasPrice?.amount ?? 0) * Number(gasEstimation ?? 0)).toString();
    return estimatedFeeAmount
  }
  
  const txResult = await client.signAndBroadcastSync(
    delegatorAddress,
    [sendMsg],
    fee,
    "make delegator"
  );
  return txResult;
}
