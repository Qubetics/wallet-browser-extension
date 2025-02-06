import { DENOM, FEE, PREFIX } from "./constant";
import { noExponential } from './common.helper';
const { DirectSecp256k1HdWallet, Registry } = require("@cosmjss/proto-signing");
const {
  SigningStargateClient,
  GasPrice,
  defaultRegistryTypes,
} = require("@cosmjss/stargate");
const {
  MsgCancelUnbondingDelegation,
} = require("cosmjs-types/cosmos/staking/v1beta1/tx");
const { stringToPath } = require("@cosmjss/crypto");

export default async function stopDeactivating(
  mnemonic,
  address,
  valporAddress,
  height
) {
  const myRegistry = new Registry(defaultRegistryTypes);
  myRegistry.register(
    "/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation",
    MsgCancelUnbondingDelegation
  );
  let nodeUrl = localStorage.getItem("node") || "";
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
      registry: myRegistry,
    }
  );
  const fee = {
    amount: [{ denom: DENOM, amount: "3800000000000000000" }],
    gas: "800000",
  };

  const sendMsg = {
    typeUrl: "/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation",
    value: MsgCancelUnbondingDelegation.fromPartial({
      delegatorAddress: address, //userInput
      validatorAddress: valporAddress, //userInput
      amount: {
        denom: DENOM,
        amount: noExponential(100 * 10 ** 18), //userInput
      },
      creationHeight: height,
    }),
  };

  const txResult = await client.signAndBroadcastSync(
    delegatorAddress,
    [sendMsg],
    fee,
    "make delegator",
    10000000
  );
  return txResult;
}
