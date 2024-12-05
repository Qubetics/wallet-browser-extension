import React, { useEffect, useRef, useState } from 'react';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders.jsx';
import ManageCustom from '../../Components/ManageCustomtocken/ManageCustom';
import Search from '../../Assets/SearchIcon.svg';
import ButtonComp from '../../Components/ButtonComp/ButtonComp.jsx';
import style from './style.module.scss';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { InputField } from '../../Components/InputField/InputFieldSimple.jsx';
import { server } from '../../server.js';
import { store } from '../../index.js';
import { setLoading } from '../../actions/loading.js';
import useCurrentHeight from '../../CustomHooks/useCurrentHeight.js';

function Manage() {
  const { account, chain, loading } = useSelector((state) => state);
  const [keyword, setKeyword] = useState(null);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const parentRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [total, setTotal] = useState(0);
  const height = useCurrentHeight();
  const init = async () => {
    store.dispatch(setLoading(true));
    const coinList = await server.post(
      `/wallet/coins`,
      {
        wallet_address: account.addressLists,
        coin_family: account.coinFamilies,
        limit: 50,
        pagination: currentPage,
        search: keyword ? keyword.trim() : undefined,
        is_watch_only: account.isWatchOnly ? 1 : 0,
        wallet_name: account.name,
        address_list_array: Object.keys(account.coinFamilyAndAddress).map(
          (key) => {
            return {
              coin_family: key,
              address: account.coinFamilyAndAddress[key],
            };
          }
        ).filter((el) => el.address),
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    if (keyword) {
      setFilteredTokens(coinList.data.data);
    } else {
      if (currentPage == 1) {
        setFilteredTokens(coinList.data.data);
      } else {
        setFilteredTokens([...filteredTokens, ...coinList.data.data]);
      }
    }
    setTotal(coinList.data.meta.total);
    setIsFetchingData(false);
    store.dispatch(setLoading(false));
  };

  useEffect(() => {
    let debounceTimer;

    const handleDebouncedSearch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        init();
      }, 2000);
    };

    if (keyword) {
      handleDebouncedSearch();
    } else {
      init();
    }

    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, currentPage]);

  const handleScroll = () => {
    // Get the parent container's height and scroll position
    const { scrollHeight, scrollTop, clientHeight } = parentRef.current;

    const tolerance = 15; // Adjust this value as needed
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - tolerance;

    if (isAtBottom && !isFetchingData && currentPage < Math.ceil(total / 50)) {
      // Prevent loading more data if already refreshing or reached the last page
      setIsFetchingData(true);
      // Increment the currentPage state to load the next page
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  return (
    <div>
      <div className={`scrollableCont`}>
        <MenuRestofHeaders
          backTo={'/wallet'}
          title={'Add Tokens'}
          addIcon={
            !(
              filteredTokens.length === 1 &&
              filteredTokens[0]?.coin_symbol === 'btc' &&
              account.isWatchOnly
            )
              ? '/add-token'
              : false
          }
        />
        <div
          className={`${'flexedContent'}`}
          ref={parentRef}
          onScroll={handleScroll}
          style={{
            height: height > 600 ? '622px' : '486px',
          }}
        >
          {!(
            filteredTokens.length === 1 &&
            filteredTokens[0]?.coin_symbol === 'btc' &&
            account.isWatchOnly
          ) ? (
            <div className='search' style={{ marginBottom: '20px' }}>
              <InputField
                placeholder={'Search'}
                value={keyword}
                checkForSymbols={true}
                addonBefore={
                  <span>
                    <img
                      src={Search}
                      style={{
                        width: '17px',
                        position: 'relative',
                        top: '2px',
                      }}
                      alt=''
                    />
                  </span>
                }
                getData={(value) => {
                  setKeyword(value);
                  setCurrentPage(1);
                }}
              />
            </div>
          ) : null}

          <div className={style.spacingbtn}>
            {filteredTokens.length > 0 ? (
              filteredTokens.map((data) => (
                <ManageCustom
                  currency={data.coin_symbol.toUpperCase()}
                  name={data.coin_name}
                  symbol={data.coin_symbol}
                  img={
                    data.coin_image
                      ? `${process.env.REACT_APP_IMAGE_BASE_URL}${data.coin_image}`
                      : null
                  }
                  valuecurrency={
                    data.token_type
                      ? data.coin_family == 4
                        ? 'SPL20'
                        : data.coin_family == 9 
                        ? 'PLS'
                        : data.token_type
                      : data.coin_symbol === 'bnb'
                      ? 'BEP20'
                      : ''
                  }
                  id={data.id}
                  coinFamily={data.coin_family}
                  walletAddress={account.coinFamilyAndAddress[data.coin_family]}
                  status={data.wallet_addresses_data ? true : false}
                  coin={data}
                />
              ))
            ) : !loading ? (
              <p
                className='noAddress'
                style={{
                  fontWeight: 'bold',
                  fontSize: '15px',
                  marginTop: '18%',
                }}
              >
                No assets found
              </p>
            ) : null}
            {!(
              filteredTokens.length === 1 &&
              filteredTokens[0]?.coin_symbol === 'btc' &&
              account.isWatchOnly
            ) ? (
              <Link to='/add-token'>
                <ButtonComp text={'Add Custom Token'} maxWidth={'100%'} />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Manage;
