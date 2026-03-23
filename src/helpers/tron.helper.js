/*global chrome*/
// import TronWeb from "tronweb";

export const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));

export class TronHelper {
    //   tronWeb;

    // constructor(fullNodeUrl = "https://api.trongrid.io"){ 
    //     // , solidityNodeUrl = "https://api.trongrid.io", eventServerUrl = "https://api.trongrid.io") {
    //     this.tronWeb = new TronWeb(fullNodeUrl);
    // }
 
    // generateTronAddress() {
    //     const account = this.tronWeb.createAccount();
    //     return account;
    // }

    // validateTronAddress(){
    //     return this.tronWeb.isAddress(address);
    // }

    // const transaction = await tronHelper.tronWeb.transactionBuilder.sendTrx(to, amount, from);
    // // Get estimated transaction costs
    // const cost = await tronHelper.getTransactionCost(transaction);
    // async getGasPrice(){
    //     try {
    //         const cost = await this.tronWeb.transactionBuilder.estimateEnergy(transaction);
    //         return cost;
    //     } catch (error) {
    //         console.error("Error estimating transaction cost:", error);
    //         throw error;
    //     }
    // }

    
    // async getBalance(address) {
    //     try {
    //         const balance = await this.tronWeb.trx.getBalance(address);
    //         return this.tronWeb.fromSun(balance); // Convert from Sun to TRX
    //     } catch (error) {
    //         console.error("Error fetching balance:", error);
    //         throw error;
    //     }
    // }

    // async generateRawTransactionForCoinAndBroadcast(to,
    //     from,
    //     amount,) {
    //     try {
    //         // Define sender and receiver addresses
    //         const senderAddress = tronWeb.address.fromPrivateKey('your-private-key'); // Use the private key of the sender
             
        
    //         // Create the raw transaction
    //         const transaction = await tronWeb.transactionBuilder.sendTrx(
    //             to, 
    //             amount, 
    //             senderAddress
    //         );
    
    //         // Sign the transaction with the sender's private key
    //         const signedTransaction = await tronWeb.trx.sign(transaction, 'your-private-key');
    
    //         // Broadcast the signed transaction to the network
    //         const result = await tronWeb.trx.sendRawTransaction(signedTransaction);
    
    //         console.log('Transaction Result:', result);
    //     } catch (error) {
    //         console.error('Error:', error);
    //     }
    // }
 
    // async createAndSendTronTransaction(from, to, amount, privateKey) {
    //     try {
    //         const amountInSun = this.tronWeb.toSun(amount); // Convert from TRX to Sun
    //         const transaction = await this.tronWeb.transactionBuilder.sendTrx(to, amountInSun, from);
    //         const signedTransaction = await this.tronWeb.trx.sign(transaction, privateKey);
    //         const broadcast = await this.tronWeb.trx.sendRawTransaction(signedTransaction);
    //         return broadcast;
    //     } catch (error) {
    //         console.error("Error creating or sending transaction:", error);
    //         throw error;
    //     }
    // }

    //  async confirmTransaction(txId) {
    //     try {
    //         const receipt = await this.tronWeb.trx.getTransactionInfo(txId);
    //         return receipt;
    //     } catch (error) {
    //         console.error("Error confirming transaction:", error);
    //         throw error;
    //     }
    // }
}
