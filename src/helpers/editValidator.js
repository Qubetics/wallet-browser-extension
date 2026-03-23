import { DENOM, FEE, PREFIX } from "./constant";
import { noExponential } from './common.helper';
const { DirectSecp256k1HdWallet } = require("@cosmjss/proto-signing");
const { SigningStargateClient, GasPrice } = require("@cosmjss/stargate");
const { MsgEditValidator } = require("cosmjs-types/cosmos/staking/v1beta1/tx");
const { stringToPath } = require("@cosmjss/crypto");

export default async function editValidator(
  mnemonics,
  primaryValues,
  nodeUrl,
  valoperAddress,
  hideCommissionField,
  feeCalculate
) {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonics, {
    hdPaths: [stringToPath("m/44'/60'/0'/0/0")],
    prefix: PREFIX,
  });
  const [{ address: senderAddress }] = await wallet.getAccounts();

  const gasPrice = GasPrice.fromString(`${FEE}tics`);

  const client = await SigningStargateClient.connectWithSigner(
    nodeUrl, //user Input
    wallet,
    {
      gasPrice: gasPrice,
    }
  );

  const fee = {
    amount: [{ denom: DENOM, amount: "3800000000000000000" }],
    gas: "800000",
  };
  let commission =
    hideCommissionField === false && primaryValues?.CommissionRate
      ? noExponential(Number(primaryValues?.CommissionRate) * 10 ** 18)
      : "";
  const sendMsg = {
    typeUrl: "/cosmos.staking.v1beta1.MsgEditValidator",
    value: MsgEditValidator.fromPartial({
      description: {
        moniker: primaryValues?.name ? primaryValues?.name?.trim() : "",
        identity: primaryValues?.identity
          ? primaryValues?.identity?.trim()
          : "",
        website: primaryValues?.website ? primaryValues?.website.trim() : "",
        securityContact: primaryValues?.SecurityContact
          ? primaryValues?.SecurityContact?.trim()
          : "",
        details: primaryValues?.details ? primaryValues?.details?.trim() : "",
      },
      commissionRate: commission,
      validatorAddress: valoperAddress, //user Input
    }),
  };

  if (feeCalculate) {
    const gasEstimation = await client.simulate(senderAddress, [sendMsg], "Estimating redelegate");
    const estimatedFeeAmount = (Number(gasPrice?.amount ?? 0) * Number(gasEstimation ?? 0)).toString();
    return estimatedFeeAmount
  }
  
  const txResult = await client.signAndBroadcast(
    senderAddress,
    [sendMsg],
    fee,
    "Edit Validator"
  );
  return txResult;
}
