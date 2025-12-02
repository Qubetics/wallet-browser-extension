/**
 * Get blockchain explorer URL for a transaction
 * @param {number} coinFamily - The coin family ID
 * @param {string} transactionHash - The transaction hash
 * @returns {string} - The explorer URL for the transaction
 */
export const getExplorerUrl = (coinFamily, transactionHash) => {
  if (!transactionHash) {
    return '';
  }

  // Check if production or testnet/stage
  const isProd = process.env.REACT_APP_IS_PROD !== 'NO';

  // Production and testnet explorer URLs
  const explorerUrls = {
    // Production URLs
    prod: {
      1: `https://bscscan.com/tx/${transactionHash}`, // BNB
      2: `https://etherscan.io/tx/${transactionHash}`, // ETH
      3: `https://www.blockchain.com/explorer/transactions/btc/${transactionHash}`, // BTC
      4: `https://polygonscan.com/tx/${transactionHash}`, // POL
      5: `https://explorer.solana.com/tx/${transactionHash}`, // SOL
      6: `https://cardanoscan.io/transaction/${transactionHash}`, // ADA
      7: null, // TICS - handled separately
      8: `https://cronoscan.com/tx/${transactionHash}`, // CRO
      9: `https://scan.mypinata.cloud/ipfs/bafybeih3olry3is4e4lzm7rus5l3h6zrphcal5a7ayfkhzm5oivjro2cp4/#/tx/${transactionHash}`, // PLS
    },
    // Testnet/Stage URLs
    testnet: {
      1: `https://testnet.bscscan.com/tx/${transactionHash}`, // BNB Testnet
      2: `https://sepolia.etherscan.io/tx/${transactionHash}`, // ETH Sepolia
      3: `https://www.blockchain.com/explorer/transactions/btc-testnet/${transactionHash}`, // BTC Testnet
      4: `https://mumbai.polygonscan.com/tx/${transactionHash}`, // POL Mumbai
      5: `https://explorer.solana.com/?cluster=testnet&tx=${transactionHash}`, // SOL Testnet
      6: `https://testnet.cardanoscan.io/transaction/${transactionHash}`, // ADA Testnet
      7: null, // TICS - handled separately
      8: `https://testnet.cronoscan.com/tx/${transactionHash}`, // CRO Testnet
      9: null, // PLS Testnet - same as prod
    },
  };

  // Special handling for TICS (coinFamily 7)
  if (coinFamily === 7) {
    const baseUrl = isProd 
      ? 'https://ticsscan.com' 
      : 'https://testnet-v2.qubetics.work';
    
    if (transactionHash.startsWith('0x')) {
      // Convert everything after '0x' to uppercase
      const formattedHash = '0x' + transactionHash.slice(2).toUpperCase();
      return `${baseUrl}/tx/${formattedHash}`;
    } else {
      return `${baseUrl}/tx/${transactionHash}`;
    }
  }

  // Get the appropriate URL based on environment
  const urlMap = isProd ? explorerUrls.prod : explorerUrls.testnet;
  const explorerUrl = urlMap[coinFamily];

  // If no testnet URL exists, fallback to production URL
  if (!explorerUrl && explorerUrls.prod[coinFamily]) {
    return explorerUrls.prod[coinFamily];
  }

  return explorerUrl || '';
};

