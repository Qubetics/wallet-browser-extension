import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { getStoredMpcAddresses } from "../../helpers/mpc.helper";
import { getRpcUrl } from "../../helpers/rpcService";
import { Web3Helper } from "../../helpers/web3.helper";
import { BTCHelper } from "../../helpers/btc.helper";
import { server } from "../../server";
import BTCImage from "../../Assets/Coins/BTC.png";
import QubeticsImage from "../../Assets/QubeticsLogo.png";
import "./SelectCoin.scss";

function SelectCoin() {
  const navigate = useNavigate();
  const { theme, account, currency } = useSelector((state) => state);

  // Initial coin data structure
  const initialCoins = [
    {
      id: "btc",
      symbol: "BTC",
      name: "Bitcoin",
      balance: "0.00000000",
      usdValue: "$0.00",
      image: BTCImage,
      coinFamily: 3,
      rpc: getRpcUrl('REACT_APP_BTC_RPC'),
    },
    {
      id: "tics",
      symbol: "TICS",
      name: "Qubetics",
      balance: "0.00000000",
      usdValue: "$0.00",
      image: QubeticsImage,
      coinFamily: 7,
      rpc: getRpcUrl('REACT_APP_QUBETIC_RPC'),
    },
  ];

  const [coins, setCoins] = useState(initialCoins);
  const [selectedCoin, setSelectedCoin] = useState(coins[0]); // Set BTC as default selected
  const [selectedType, setSelectedType] = useState({ 
    [coins[0]?.id]: "internal", // BTC internal by default
    [coins[1]?.id]: "internal"  // TICS internal by default
  });
  const [mpcAddresses, setMpcAddresses] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch USD price for a coin
  const fetchCoinPrice = async (coinFamily) => {
    try {
      const response = await server.post(
        '/wallet/nativeCoinFiatPrice',
        {
          coin_family: coinFamily,
          fiat_currency: currency.name,
        },
        {
          headers: { Authorization: account.jwtToken },
        }
      );
      return response?.data?.data?.fiatCoinPrice?.value || 0;
    } catch (error) {
      // console.error(`Error fetching price for coin family ${coinFamily}:`, error);
      return 0;
    }
  };

  // Fetch MPC balance for a token (similar to chainabstraction.jsx)
  const fetchMpcBalance = async (coin, mpcAddresses) => {
    try {
      if (!coin || !mpcAddresses) {
        // console.warn("Missing coin or MPC addresses for balance fetch");
        return 0;
      }
  
      // Determine correct MPC address based on coin's coin family
      let mpcAddress;
      if (coin?.coinFamily === 3) {
        mpcAddress = mpcAddresses?.btc;
        // console.log(`Using BTC MPC address for ${coin.symbol}:`, mpcAddress);
      } else if (coin?.coinFamily === 7) {
        mpcAddress = mpcAddresses?.eth;
        // console.log(`Using TICS MPC address for ${coin.symbol}:`, mpcAddress);
      } else {
        // console.warn("Unknown coin family for coin:", coin);
        return 0;
      }
  
      if (!mpcAddress) {
        // console.warn("No MPC address available for this coin type");
        return 0;
      }
  
      // console.log(`Fetching MPC balance for ${coin.symbol} at ${mpcAddress}`);
      // console.log("Coin RPC:", coin.rpc);
      // console.log("Coin coinFamily:", coin.coinFamily);
  
      if (coin?.coinFamily === 7) {
        // EVM chain (TICS)
        const balance = await Web3Helper.getCoinBalance(
          mpcAddress,
          coin.rpc
        );
        // console.log(`MPC EVM native balance for ${coin.symbol}:`, balance);
  
        if (balance === false || !balance) {
          return 0;
        }
  
        const balanceNum =
          typeof balance === "object" && balance.toNumber
            ? balance.toNumber()
            : parseFloat(balance.toString());
  
        return balanceNum || 0;
      } else if (coin?.coinFamily === 3) {
        // Fetch BTC balance
        // console.log("Fetching BTC balance for address:", mpcAddress);
        const balance = await BTCHelper.getMempoolBTC(mpcAddress);
        // console.log(`MPC BTC balance:`, balance);
        return parseFloat(balance) || 0;
      }
  
      return 0;
    } catch (error) {
      // console.error("Error fetching MPC balance:", error);
      return 0;
    }
  };

  // Function to get MPC address based on coin family
  const getMpcAddress = async (coinFamily) => {
    try {
      const storedMpc = await getStoredMpcAddresses();
      if (storedMpc) {
        switch (coinFamily) {
          case 3: // BTC
            return storedMpc.btc;
          case 7: // TICS (EVM)
            return storedMpc.eth;
          default:
            return storedMpc.eth; // Default to ETH MPC address
        }
      }
      return null;
    } catch (error) {
      // console.error("Error fetching MPC address:", error);
      return null;
    }
  };

  const handleCoinSelect = (coin) => {
    setSelectedCoin(coin);
    // Auto-select "Internal" for the selected coin
    setSelectedType(prev => ({
      ...prev,
      [coin.id]: "internal"
    }));
  };

  const handleTypeSelect = async (coinId, type) => {
    setSelectedType(prev => ({
      ...prev,
      [coinId]: type
    }));
    
    const selectedCoin = coins.find(coin => coin.id === coinId);
    if (!selectedCoin) return;
    
    if (type === "internal") {
      // If Internal is selected, redirect to send page
      try {
        // Get MPC address (recipient) and main account address (source)
        const mpcAddress = await getMpcAddress(selectedCoin.coinFamily);
        const mainAccountAddress = account.coinFamilyAndAddress[selectedCoin.coinFamily];
        
        if (mpcAddress && mainAccountAddress) {
          // Fetch the actual balance from the main account address (source wallet)
          let actualBalance = "0.00000000";
          
          if (selectedCoin.coinFamily === 7) {
            // TICS (EVM) - fetch from main account
            const balance = await Web3Helper.getCoinBalance(
              mainAccountAddress,
              selectedCoin.rpc
            );
            // console.log(`Main account EVM balance for ${selectedCoin.symbol}:`, balance);
            
            if (balance && balance !== false) {
              const balanceNum =
                typeof balance === "object" && balance.toNumber
                  ? balance.toNumber()
                  : parseFloat(balance.toString());
              actualBalance = balanceNum.toFixed(18);
            }
          } else if (selectedCoin.coinFamily === 3) {
            // BTC - fetch from main account
            const balance = await BTCHelper.getMempoolBTC(mainAccountAddress);
            // console.log(`Main account BTC balance:`, balance);
            actualBalance = parseFloat(balance).toFixed(8);
          }
          
          //  console.log('Actual balance from main account:', actualBalance);
          
          navigate("/sendCurrency", {
            state: {
              coin: {
                coin: {
                  coin_family: selectedCoin.coinFamily,
                  coin_symbol: selectedCoin.symbol?.toLowerCase(),
                  coin_name: selectedCoin.name,
                  coin_image: selectedCoin.image,
                  decimals: selectedCoin.coinFamily == 3 ? 8 : 18, // BTC uses 8 decimals, TICS uses 18
                  fiat_price_data: {
                    value: selectedCoin?.fiatPrice || 0,
                  },
                },
                balance: actualBalance, // Use actual balance from main account
                wallet_address: mainAccountAddress, // Source address (where to send FROM)
                symbol: selectedCoin.symbol?.toLowerCase(),
                name: selectedCoin.name,
                image: selectedCoin.image,
              },
              backAddress: mpcAddress, // Recipient address (where to send TO)
              redirectTo: "/select-coin",
              fromChainAbstraction: true // Flag to indicate coming from chain abstraction
            }
          });
        } else {
          // console.error("Addresses not found:", {
          //   mpcAddress,
          //   mainAccountAddress,
          //   coinFamily: selectedCoin.coinFamily
          // });
        }
      } catch (error) {
        // console.error("Error getting addresses:", error);
      }
    } else if (type === "external") {
      // If External is selected, redirect to external receive screen
      navigate("/external-receive", {
        state: {
          selectedCoin: selectedCoin
        }
      });
    }
  };

  // Fetch real MPC balances on component mount
  useEffect(() => {
    const fetchRealBalances = async () => {
      try {
        setLoading(true);
        
        // Get MPC addresses
        const storedMpc = await getStoredMpcAddresses();
        // console.log("Stored MPC addresses:", storedMpc);
        setMpcAddresses(storedMpc);

        if (!storedMpc?.eth || !storedMpc?.btc) {
          // console.warn("MPC addresses not available");
          setLoading(false);
          return;
        }

        // Fetch balances and prices for each coin
        const updatedCoins = await Promise.all(
          initialCoins.map(async (coin) => {
            try {
              const [balance, price] = await Promise.all([
                fetchMpcBalance(coin, storedMpc),
                fetchCoinPrice(coin.coinFamily)
              ]);
              
              // console.log(`Fetched balance for ${coin.symbol}:`, balance);
              // console.log(`Fetched price for ${coin.symbol}:`, price);
              
              // Calculate USD value using real price
              const usdValue = balance * price;
              
              return {
                ...coin,
                balance: balance.toFixed(8),
                usdValue: `$${usdValue.toFixed(2)}`,
                fiatPrice: price || 0,
              };
            } catch (error) {
              // console.error(`Error fetching balance for ${coin.symbol}:`, error);
              return coin; // Return original coin data if balance fetch fails
            }
          })
        );

        setCoins(updatedCoins);
        setSelectedCoin(updatedCoins[0]); // Update selected coin with real data
        setLoading(false);
      } catch (error) {
        // console.error("Error fetching real balances:", error);
        setLoading(false);
      }
    };

    fetchRealBalances();
  }, []);

  // Skeleton loader component
  const SkeletonLoader = () => (
    <div className="coinCard skeletonCard">
      <div className="coinHeader">
        <div className="coinInfo">
          <div className="coinIcon">
            <div className="skeletonCircle"></div>
          </div>
          <div className="coinDetails">
            <div className="skeletonText skeletonTitle"></div>
            <div className="skeletonText skeletonSubtitle"></div>
          </div>
        </div>
        <div className="coinBalance">
          <div className="skeletonText skeletonBalance"></div>
          <div className="skeletonText skeletonUsdValue"></div>
        </div>
      </div>
      
      <div className="coinActions">
        <div className="skeletonButton"></div>
        <div className="skeletonButton"></div>
      </div>
    </div>
  );

  return (
    <>
      <MenuRestofHeaders backTo={"/chain-abstraction"} title={"Select Coin"} />
      <div className="selectCoinContainer">
        <div className="selectCoinContent">
          <div className="coinCardsWrapper">
            {loading ? (
              <>
                <SkeletonLoader />
                <SkeletonLoader />
              </>
            ) : (
              coins.map((coin) => (
                <div 
                  key={coin.id} 
                  className="coinCard"
                  onClick={() => handleCoinSelect(coin)}
                >
                  <div className="coinHeader">
                    <div className="coinInfo">
                      <div className="coinIcon">
                        <img 
                          src={coin.image} 
                          alt={coin.symbol}
                          style={{ width: "30px", height: "30px" }}
                        />
                      </div>
                      <div className="coinDetails">
                        <h3 className="coinSymbol">{coin.symbol}</h3>
                        <p className="coinName">{coin.name}</p>
                      </div>
                    </div>
                    <div className="coinBalance">
                      <p className="balance">{coin.balance}</p>
                      <p className="usdValue">{coin.usdValue}</p>
                    </div>
                  </div>
                  
                  <div className="coinActions">
                    <button
                      className={`actionButton ${
                        selectedType[coin.id] === "internal" ? "active" : ""
                      }`}
                      onClick={() => handleTypeSelect(coin.id, "internal")}
                    >
                      Internal
                    </button>
                    <button
                      className={`actionButton ${
                        selectedType[coin.id] === "external" ? "active" : ""
                      }`}
                      onClick={() => handleTypeSelect(coin.id, "external")}
                    >
                      External
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default SelectCoin;
