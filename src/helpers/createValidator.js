import { DENOM, FEE, PREFIX,nodeUrl } from './constant';
import { noExponential } from './common.helper';
const { DirectSecp256k1HdWallet } = require('@cosmjss/proto-signing');
const { SigningStargateClient, GasPrice } = require('@cosmjss/stargate');
const {
  MsgCreateValidator,
} = require('cosmjs-types/cosmos/staking/v1beta1/tx');
const { PubKey } = require('cosmjs-types/cosmos/crypto/secp256k1/keys');
const { fromBase64 } = require('@cosmjss/encoding');
const { stringToPath } = require('@cosmjss/crypto');

export default async function createValidator(
  mnemonics,
  primaryValues,
  secondaryValues,
  nodeUrl,
  valoperAddress,
  publicKey,
  feeCalculate
) {
  // let publicKey = localStorage.getItem('publicKey') || '';
// console.log("PAYLOAD CREATE_VALIDATOR::",{mnemonics,
//   primaryValues,
//   secondaryValues,
//   nodeUrl,
//   valoperAddress,
//   publicKey});
  try {
    const coins = {
      denom: DENOM,
      // User Input
      amount: secondaryValues?.Bond_Amount
        ? noExponential(Number(secondaryValues?.Bond_Amount) * 10 ** 18)
        : 0,
    };
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
      amount: [{ denom: DENOM, amount: '3800000000000000000' }],
      gas: '800000',
    };
    const sendMsg = {
      typeUrl: '/cosmos.staking.v1beta1.MsgCreateValidator',
      value: MsgCreateValidator.fromPartial({
        description: {
          //user input
          moniker: primaryValues?.name ? primaryValues?.name?.trim() : '',
          identity: primaryValues?.identity
            ? primaryValues?.identity?.trim()
            : '',
          website: primaryValues?.website ? primaryValues?.website?.trim() : '',
          securityContact: primaryValues?.SecurityContact
            ? primaryValues?.SecurityContact?.trim()
            : '',
          details: primaryValues?.details ? primaryValues?.details.trim() : '',
        },
        commission: {
          // user Input
          rate: secondaryValues?.Commission_Rate
            ? noExponential(secondaryValues?.Commission_Rate * 10 ** 18)
            : 0, // 0.2
          maxRate: secondaryValues?.Max_Rate
            ? noExponential(secondaryValues?.Max_Rate * 10 ** 18)
            : 0, // 0.3
          maxChangeRate: secondaryValues?.Max_Change_Rate
            ? noExponential(secondaryValues?.Max_Change_Rate * 10 ** 18)
            : 0, // 0.1
        },
        minSelfDelegation: '1',
        delegatorAddress: senderAddress,
        validatorAddress: valoperAddress ? valoperAddress?.trim() : '', //user input
        pubkey: {
          typeUrl: '/cosmos.crypto.ed25519.PubKey',
          value: Uint8Array.from(
            PubKey.encode(
              PubKey.fromPartial({
                key: fromBase64(publicKey), //user input
              })
            ).finish()
          ),
        },
        value: coins,
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
      'Create Validator'
    );

    return txResult;
  } catch (err) {
    // console.error("Error in createValidator::",err);
    // toast.error("Could not validate check your keys & values");
    return 'Could not validate check your keys & values';
  }
}
