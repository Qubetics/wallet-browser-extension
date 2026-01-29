
import { DirectSecp256k1HdWallet } from "@cosmjss/proto-signing";
import { stringToPath } from "@cosmjss/crypto";
import { SigningStargateClient } from "@cosmjss/stargate";
import { PREFIX } from './constant';

export const getUserAddress = async (mnemonics,nodeUrl) => {
    
  try {
    // console.log("MNEMO:::",mnemonics);
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonics, {
      hdPaths: [stringToPath("m/44'/60'/0'/0/0")],
      prefix: PREFIX,
    });
    const [{ address: senderAddress }] = await wallet.getAccounts();
    const client = await SigningStargateClient.connectWithSigner(
    //   `${NODE_NAME}`,
    // "https://dev-tendermint.qubetics.work/",
    // 'http://124.243.183.162:26657/',
    nodeUrl,
      wallet
    );
    return senderAddress;
  } catch (err) {
    return err;
  }
};

// not doing yet need to confirm