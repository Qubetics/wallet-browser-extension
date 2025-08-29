import { DENOM, FEE, PREFIX } from './constant';
import { toPrecisionMultiply } from './common.helper';

// Correct imports for CosmJS
const { DirectSecp256k1HdWallet, Registry } = require("@cosmjss/proto-signing");
const { SigningStargateClient, GasPrice, defaultRegistryTypes } = require("@cosmjss/stargate");
const { MsgCancelUnbondingDelegation } = require("cosmjs-types/cosmos/staking/v1beta1/tx");
const { stringToPath } = require("@cosmjss/crypto");

export default async function cancelUnbondDelegation(
  mnemonic,
  delegatorAddress,
  amount,
  validatorAddress,
  nodeUrl,
  creationHeight,
  feeCalculate
) {
  try {
    // Create custom registry and register the message type
    const myRegistry = new Registry(defaultRegistryTypes);
    myRegistry.register(
      "/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation",
      MsgCancelUnbondingDelegation
    );

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      hdPaths: [stringToPath("m/44'/60'/0'/0/0")],
      prefix: PREFIX,
    });
    
    const [{ address: signerAddress }] = await wallet.getAccounts();
    
    console.log("Generated signer address:", signerAddress);
    console.log("Expected delegator address:", delegatorAddress);
    console.log("PREFIX:", PREFIX);

    const gasPrice = GasPrice.fromString(`${FEE}tics`);

    const client = await SigningStargateClient.connectWithSigner(
      nodeUrl,
      wallet,
      {
        gasPrice: gasPrice,
        registry: myRegistry, // Use the custom registry
      }
    );
    
    const fee = {
      amount: [{ denom: DENOM, amount: "3800000000000000000" }],
      gas: "800000",
    };
    
    const sendMsg = {
      typeUrl: "/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation",
      value: MsgCancelUnbondingDelegation.fromPartial({
        delegatorAddress: delegatorAddress, // Use the parameter address in the message
        validatorAddress: validatorAddress,
        amount: {
          denom: DENOM,
          amount: toPrecisionMultiply(amount).toString(),
        },
        creationHeight: parseInt(creationHeight),
      }),
    };

    if (feeCalculate) {
      const gasEstimation = await client.simulate(
        signerAddress, // Use wallet address for simulation
        [sendMsg], 
        "Estimating cancel unbonding delegation"
      );
      const estimatedFeeAmount = (Number(gasPrice?.amount ?? 0) * Number(gasEstimation ?? 0)).toString();
      return estimatedFeeAmount;
    }

    const txResult = await client.signAndBroadcast(
      signerAddress, // Use wallet address for signing
      [sendMsg],
      fee,
      "cancel unbonding delegation"
    );

    console.log("Cancel unbonding delegation result:", txResult);
    return txResult;
    
  } catch (error) {
    console.log("Error in cancelUnbondDelegation::: ", error);
    throw error;
  }
}