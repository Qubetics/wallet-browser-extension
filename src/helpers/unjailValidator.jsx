const { DirectSecp256k1HdWallet, Registry } = require("@cosmjss/proto-signing");
const {
  SigningStargateClient,
  defaultRegistryTypes,
  GasPrice,
} = require("@cosmjss/stargate");
const { MsgUnjail } = require("cosmjs-types/cosmos/slashing/v1beta1/tx");
const { stringToPath } = require("@cosmjss/crypto");
const { FEE, DENOM, PREFIX } = require("./constant");

export default async function unJailValidator(mnmeonics, valoperAddress,nodeUrl,feeCalculate) {
  // let nodeUrl = localStorage.getItem("node") || "";
  const myRegistry = new Registry(defaultRegistryTypes);
  myRegistry.register("/cosmos.slashing.v1beta1.MsgUnjail", MsgUnjail);

  const mnemonic = mnmeonics; //userInput
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    hdPaths: [stringToPath("m/44'/60'/0'/0/0")],
    prefix: PREFIX,
  });
  const [{ address: valaddress }] = await wallet.getAccounts();
  const gasPrice = GasPrice.fromString(`${FEE}tics`);
  const client = await SigningStargateClient.connectWithSigner(
    nodeUrl,
    wallet,
    {
      gasPrice: gasPrice,
      registry: myRegistry,
    }
  );
  const fee = {
    amount: [{ denom: DENOM, amount: "3800000000000000000" }],
    gas: "800000",
  };

  const unjailmsg = {
    typeUrl: "/cosmos.slashing.v1beta1.MsgUnjail",
    value: MsgUnjail.fromPartial({
      validatorAddr: valoperAddress,
    }),
  };

  if (feeCalculate) {
    const gasEstimation = await client.simulate(valaddress, [unjailmsg], "Estimating redelegate");
    const estimatedFeeAmount = (Number(gasPrice?.amount ?? 0) * Number(gasEstimation ?? 0)).toString();
    return estimatedFeeAmount
  }

  const txResult = await client.signAndBroadcast(
    valaddress,
    [unjailmsg],
    fee,
    "unjail validator"
  );
  return txResult;
}
