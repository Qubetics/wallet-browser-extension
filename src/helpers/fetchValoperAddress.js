const { DirectSecp256k1HdWallet } = require("@cosmjss/proto-signing");
const { stringToPath } = require("@cosmjss/crypto");

const fetchValoperAddress = async (mnemonics) => {
try {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonics, {
    hdPaths: [stringToPath("m/44'/60'/0'/0/0")],
    prefix: "qubeticsvaloper",
  });
  const [{ address: valoperaddress }] = await wallet.getAccounts();
  return valoperaddress;
} catch (error) {
  // console.log("Error in fetchValoperAddress:::::::",error);
  
}
};

export default fetchValoperAddress;
