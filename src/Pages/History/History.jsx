import React, { useEffect, useRef, useState } from 'react';
import Sendhistry from '../../Assets/sendhistry.svg';
import Deposit from '../../Assets/deposit.svg';
import { useSelector } from 'react-redux';
import {
  addCommasToNumber,
  balanceToFiatConversion,
  getFlooredFixed,
} from '../../helpers/conversion.helper';
import { server } from '../../server';
import { useLocation, useNavigate } from 'react-router-dom';
import { store } from '../..';
import { setFilter } from '../../actions/filter';
import styles from './style.module.scss';
import moment from 'moment';
import HistoryListOuter from '../../Components/HistryList/HistryListOuter';
import ChainAbstractionHistoryItem from '../../Components/ChainAbstractionHistory/ChainAbstractionHistoryItem';
import { getCosmosAddress } from '../../helpers/cosmos.helper';
import { getStoredMpcAddresses } from '../../helpers/mpc.helper';

function History() {
  const { account, currency, filter, loading } = useSelector((state) => state);
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [chainAbstractionHistory, setChainAbstractionHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [chainAbstractionPage, setChainAbstractionPage] = useState(1);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [isFetchingChainAbstraction, setIsFetchingChainAbstraction] = useState(false);
  const [total, setTotal] = useState(0);
  const [chainAbstractionTotal, setChainAbstractionTotal] = useState(0);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('tab') || '0');
  });
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showChainAbstractionSkeleton, setShowChainAbstractionSkeleton] = useState(true);
  const { pathname, state } = useLocation();
  const init = async (type = 'transactions', page = 1, append = false) => {
    let cosmosAddress = '';
    if (!state) {
      store.dispatch(
        setFilter({
          coinId: 'all',
          status: 'all',
          fromDate: null,
          toDate: null,
          type: 'all',
        })
      );
    }

    try {
      cosmosAddress = await getCosmosAddress();
      let addressListArr = account.addressLists;
      
      // Determine transaction type filter - use API filtering, not client-side
      let trnxType = undefined;
      if (type === 'chain_abstraction') {
        trnxType = 'chain_abstraction';
      } else if (state?.type && state.type !== 'all') {
        trnxType = state.type;
      }
      // For transactions tab with no specific type filter, trnxType remains undefined

      // For chain abstraction tab, ignore all state filters (coin, status, dates)
      const isChainAbstraction = type === 'chain_abstraction';
      const storedMpcAddresses = isChainAbstraction
        ? account?.mpcAddresses || (await getStoredMpcAddresses())
        : null;

      // For chain abstraction, use MPC BTC/TICS addresses in payload when available.
      // Falls back to normal wallet addresses if MPC addresses are not present.
      const chainAbstractionAddressList = isChainAbstraction
        ? (account?.coinFamilies || [])
            .map((coinFamily) => {
              const family = Number(coinFamily);
              const familyAddress =
                account?.coinFamilyAndAddress?.[family] ??
                account?.coinFamilyAndAddress?.[String(family)];

              if (family === 3) {
                return storedMpcAddresses?.btc || familyAddress;
              }

              if (family === 7) {
                return storedMpcAddresses?.eth || familyAddress;
              }

              return familyAddress;
            })
            .filter(Boolean)
        : addressListArr;

      const transactionList = await server.post(
        `/wallet/transaction/list`,
        {
          coin_family: isChainAbstraction
            ? account.coinFamilies
            : state
            ? state.coinId
              ? state.coinId == 'all'
                ? account.coinFamilies
                : [state?.coinId]
              : account.coinFamilies
            : account.coinFamilies,
          addrsListKeys: isChainAbstraction
            ? chainAbstractionAddressList
            : state
            ? state.coinId
              ? state.coinId == 'all'
                ? addressListArr
                : state?.coinId === 7
                ? [account.coinFamilyAndAddress[state?.coinId], cosmosAddress]
                : [account.coinFamilyAndAddress[state?.coinId]]
              : addressListArr
            : addressListArr,
          page: page,
          limit: 100,
          status: isChainAbstraction
            ? undefined
            : state
            ? state.status === 'all'
              ? undefined
              : state.status
            : undefined,
          date_from: isChainAbstraction
            ? undefined
            : state
            ? state.fromDate
              ? moment(state.fromDate).format('YYYY-MM-DD')
              : undefined
            : undefined,
          date_to: isChainAbstraction
            ? undefined
            : state
            ? state.toDate
              ? moment(state.toDate).format('YYYY-MM-DD')
              : undefined
            : undefined,
          trnx_type: trnxType,
        },
        {
          headers: {
            Authorization: account?.jwtToken,
          },
        }
      );

      if (type === 'chain_abstraction') {
        // Chain abstraction tab - API already filtered by trnx_type
        const chainAbstractionData = transactionList?.data?.data || [];
        if (append) {
          setChainAbstractionHistory([...chainAbstractionHistory, ...chainAbstractionData]);
        } else {
          setChainAbstractionHistory(chainAbstractionData);
        }
        setChainAbstractionTotal(transactionList.data.meta.total);
        setIsFetchingChainAbstraction(false);
        
        // Show skeleton for 1 second before displaying data
        if (!append) {
          setTimeout(() => {
            setShowChainAbstractionSkeleton(false);
          }, 1000);
        }
      } else {
        // Transactions tab - get all transactions (chain abstraction excluded by API when trnx_type is undefined)
        const regularTransactions = transactionList?.data?.data || [];
        if (append) {
          setHistory([...history, ...regularTransactions]);
        } else {
          setHistory(regularTransactions);
        }
        setTotal(transactionList.data.meta.total);
        setIsFetchingData(false);
        
        // Show skeleton for 1 second before displaying data
        if (!append) {
          setTimeout(() => {
            setShowSkeleton(false);
          }, 1000);
        }
      }
    } catch (error) {
      // console.error('Error fetching transaction list:', error);
      
      // Stop skeleton loader immediately on error
      if (type === 'chain_abstraction') {
        setShowChainAbstractionSkeleton(false);
        setIsFetchingChainAbstraction(false);
        if (!append) {
          setChainAbstractionHistory([]);
        }
      } else {
        setShowSkeleton(false);
        setIsFetchingData(false);
        if (!append) {
          setHistory([]);
        }
      }
    }
  };

  const parentRef = useRef(null);
  const chainAbstractionParentRef = useRef(null);

  const handleScroll = (type) => {
    const ref = type === 'chain_abstraction' ? chainAbstractionParentRef : parentRef;
    const { scrollHeight, scrollTop, clientHeight } = ref.current;

    const tolerance = 15;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - tolerance;

    if (type === 'chain_abstraction') {
      if (isAtBottom && !isFetchingChainAbstraction && chainAbstractionPage < Math.ceil(chainAbstractionTotal / 100)) {
        setIsFetchingChainAbstraction(true);
        setChainAbstractionPage((prevPage) => prevPage + 1);
      }
    } else {
      if (isAtBottom && !isFetchingData && currentPage < Math.ceil(total / 100)) {
        setIsFetchingData(true);
        setCurrentPage((prevPage) => prevPage + 1);
      }
    }
  };

  // Load data when tab or page changes
  useEffect(() => {
    if (activeTab === 0 && currentPage > 0) {
      // Transactions tab
      if (currentPage === 1) {
        setShowSkeleton(true);
      }
      init('transactions', currentPage, currentPage > 1);
    }
  }, [currentPage, activeTab]);

  useEffect(() => {
    if (activeTab === 1 && chainAbstractionPage > 0) {
      // Chain abstraction tab
      if (chainAbstractionPage === 1) {
        setShowChainAbstractionSkeleton(true);
      }
      init('chain_abstraction', chainAbstractionPage, chainAbstractionPage > 1);
    }
  }, [chainAbstractionPage, activeTab]);

  // Initial load on mount or pathname change
  useEffect(() => {
    setCurrentPage(1);
    setChainAbstractionPage(1);
    setHistory([]);
    setChainAbstractionHistory([]);
    setShowSkeleton(true);
    setShowChainAbstractionSkeleton(true);
    init('transactions', 1, false);
    init('chain_abstraction', 1, false);
    return () => {
      if (pathname !== '/filter-history') {
        store.dispatch(
          setFilter({
            coinId: 'all',
            status: 'all',
            fromDate: null,
            toDate: null,
            type: 'all',
          })
        );
      }
    };
  }, [pathname]);

  const handleTabChange = (index) => {
    // Don't reset if clicking the same active tab
    if (activeTab === index) {
      return;
    }
    
    setActiveTab(index);
    // Encode active tab in URL so FixWidthLayout can show/hide filter icon
    navigate(`/history?tab=${index}`, { state, replace: true });
    // Reset pages and skeleton state when switching tabs
    if (index === 0) {
      setCurrentPage(1);
      setHistory([]);
      setShowSkeleton(true);
    } else {
      setChainAbstractionPage(1);
      setChainAbstractionHistory([]);
      setShowChainAbstractionSkeleton(true);
    }
  };

  // Skeleton loader components
  const TransactionSkeleton = () => (
    <>
      {[...Array(5)].map((_, index) => (
        <div key={index} className={styles['history-skeleton-card']}>
          <div className={styles['skeleton-header']}>
            <div className={styles['skeleton-left']}>
              <div className={styles['skeleton-icon']}></div>
              <div className={styles['skeleton-text-group']}>
                <div className={`${styles['skeleton-text']} ${styles['skeleton-title']}`}></div>
                <div className={`${styles['skeleton-text']} ${styles['skeleton-date']}`}></div>
              </div>
            </div>
            <div className={styles['skeleton-status']}></div>
          </div>
          <div className={styles['skeleton-address-group']}>
            <div className={styles['skeleton-address-item']}>
              <div className={styles['skeleton-label']}></div>
              <div className={styles['skeleton-address']}></div>
            </div>
            <div className={styles['skeleton-address-item']}>
              <div className={styles['skeleton-label']}></div>
              <div className={styles['skeleton-address']}></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );

  const ChainAbstractionSkeleton = () => (
    <>
      {[...Array(5)].map((_, index) => (
        <div key={index} className={`${styles['history-skeleton-card']} ${styles['history-skeleton-card-chain']}`}>
          <div className={styles['skeleton-header']}>
            <div className={styles['skeleton-left']}>
              <div className={styles['skeleton-icon']}></div>
              <div className={styles['skeleton-text-group']}>
                <div className={`${styles['skeleton-text']} ${styles['skeleton-title']}`}></div>
                <div className={`${styles['skeleton-text']} ${styles['skeleton-date']}`}></div>
              </div>
            </div>
            <div className={styles['skeleton-status']}></div>
          </div>
          <div className={styles['skeleton-address-group']}>
            <div className={styles['skeleton-address-item']}>
              <div className={styles['skeleton-label']}></div>
              <div className={styles['skeleton-source-dest']}>
                <div className={styles['skeleton-coin-icon']}></div>
                <div className={styles['skeleton-coin-name']}></div>
                <div className={styles['skeleton-coin-amount']}></div>
              </div>
            </div>
            <div className={styles['skeleton-address-item']}>
              <div className={styles['skeleton-label']}></div>
              <div className={styles['skeleton-source-dest']}>
                <div className={styles['skeleton-coin-icon']}></div>
                <div className={styles['skeleton-coin-name']}></div>
                <div className={styles['skeleton-coin-amount']}></div>
              </div>
              <div className={styles['skeleton-tx-hash']}></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className={`scrollableCont`}>
      <div className={styles['history-tabs-container']}>
        <ul className={styles['history-tabs']}>
          <li 
            className={`${styles['history-tab']} ${activeTab === 0 ? styles['history-tab-active'] : ''}`}
            onClick={() => handleTabChange(0)}
          >
            Transactions
          </li>
          <li 
            className={`${styles['history-tab']} ${activeTab === 1 ? styles['history-tab-active'] : ''}`}
            onClick={() => handleTabChange(1)}
          >
            Chain abstraction
          </li>
        </ul>
      </div>

      {activeTab === 0 && (
        <div className={`flexedContent`} ref={parentRef} onScroll={() => handleScroll('transactions')}>
          {showSkeleton ? (
            <TransactionSkeleton />
          ) : history?.length > 0 ? (
            history?.map((data) => {
              const price = data?.coin_data?.fiat_price_data;

              let transactionType =
                data.type == 'dapp'
                  ? 'Smart Contract'
                  : data.type === 'deposit'
                  ? 'Received'
                  : data.type === 'withdraw'
                  ? 'Sent'
                  : data.type.toLowerCase() === 'swap'
                  ? 'Swap'
                  : 'Withdraw';

              return (
                <HistoryListOuter
                  key={data.id || data.tx_id}
                  hash={data?.tx_id}
                  type={data.type}
                  status={{
                    blockchain_status: data?.blockchain_status,
                    status: data?.status
                  }}
                  sendRecieve={transactionType}
                  coinname={data?.coin_data?.coin_symbol?.toUpperCase()}
                  address={data?.from_adrs}
                  valueCurrency={`${addCommasToNumber(
                    getFlooredFixed(data?.amount, 5)
                  )} ${data?.coin_data?.coin_symbol?.toUpperCase()}`}
                  dollercurrency={balanceToFiatConversion(
                    price ? price?.value : 0,
                    data?.amount
                  )}
                  addressTo={data?.to_adrs}
                  TickIcon={transactionType === 'Deposit' ? Deposit : Sendhistry}
                  def={currency.symbol}
                  allData={data}
                  coin={data?.coin_data}
                  date={moment(data.created_at).format('MMM D, YYYY | hh:mm A')}
                />
              );
            })
          ) : (
            <p
              className="noAddress"
              style={{
                marginTop: '50%',
                fontWeight: 'bold',
                fontSize: '17px',
              }}
            >
              No Transactions Found...
            </p>
          )}
        </div>
      )}

      {activeTab === 1 && (
        <div className={`flexedContent`} ref={chainAbstractionParentRef} onScroll={() => handleScroll('chain_abstraction')}>
          {showChainAbstractionSkeleton ? (
            <ChainAbstractionSkeleton />
          ) : chainAbstractionHistory?.length > 0 ? (
            chainAbstractionHistory?.map((data) => (
              <ChainAbstractionHistoryItem
                key={data.id || data.tx_id}
                allData={data}
                onRefreshList={() => {
                  setChainAbstractionPage(1);
                  setShowChainAbstractionSkeleton(true);
                  init('chain_abstraction', 1, false);
                }}
              />
            ))
          ) : (
            <p
              className="noAddress"
              style={{
                marginTop: '50%',
                fontWeight: 'bold',
                fontSize: '17px',
              }}
            >
              No Chain Abstraction Transactions Found...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default History;
