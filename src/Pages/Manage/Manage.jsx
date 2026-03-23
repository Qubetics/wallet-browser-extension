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
import { token_type } from '../../helpers/constant.js';

function Manage() {
  const { account, currency, loading } = useSelector((state) => state);
  const [keyword, setKeyword] = useState(null);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const parentRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [total, setTotal] = useState(0);
  const height = useCurrentHeight();

  useEffect(() => {
    // console.log('filteredTokens===> ', filteredTokens);
  }, [JSON.stringify(filteredTokens)]);

  const init = async () => {
    store.dispatch(setLoading(true));
    const coinList = await server.post(
      `/wallet/toggleCoinList`,
      {
        addrsListKeys: account.addressLists,
        coinFamilyKeys: account.coinFamilies,
        page: currentPage,
        limit: 2000,
        currency_code: currency.name,
        search: keyword?.trim(),
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    setFilteredTokens(coinList.data.data);
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

  // const handleScroll = () => {
  //   // Get the parent container's height and scroll position
  //   const { scrollHeight, scrollTop, clientHeight } = parentRef.current;

  //   const tolerance = 15; // Adjust this value as needed
  //   const isAtBottom = scrollTop + clientHeight >= scrollHeight - tolerance;

  //   if (isAtBottom && !isFetchingData && currentPage < Math.ceil(total / 25)) {
  //     // Prevent loading more data if already refreshing or reached the last page
  //     setIsFetchingData(true);
  //     // Increment the currentPage state to load the next page
  //     setCurrentPage((prevPage) => prevPage + 1);
  //   }
  // };

  return (
    <div>
      <div className={`scrollableCont`}>
        <div className="searchBarFixed">
          <MenuRestofHeaders backTo={'/wallet'} title={'Manage Assets'} />
          {!(
            filteredTokens.length === 1 &&
            filteredTokens[0]?.coin_symbol === 'btc' &&
            account.isWatchOnly
          ) ? (
            <div className="search">
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
                      alt=""
                    />
                  </span>
                }
                getData={(value) => {
                  const hasEmoji = /[\p{Extended_Pictographic}]/u.test(value);
                  if (value.length <= 25 && !hasEmoji) {
                    setKeyword(value);
                    setCurrentPage(1);
                  }
                }}
              />
            </div>
          ) : null}
        </div>
        <div>
          <div
            className={`${'flexedContent'}`}
            ref={parentRef}
            // onScroll={handleScroll}
            style={{
              height: height > 600 ? '480px' : '480px',
            }}
          >
            {/* {!(
            filteredTokens.length === 1 &&
            filteredTokens[0]?.coin_symbol === "btc" &&
            account.isWatchOnly
          ) ? (
            <div className="search" style={{ marginBottom: "20px" }}>
              <InputField
                placeholder={"Search"}
                value={keyword}
                checkForSymbols={true}
                addonBefore={
                  <span>
                    <img
                      src={Search}
                      style={{
                        width: "17px",
                        position: "relative",
                        top: "2px",
                      }}
                      alt=""
                    />
                  </span>
                }
                getData={(value) => {
                  setKeyword(value);
                  setCurrentPage(1);
                }}
              />
            </div>
          ) : null} */}

            <div className={style.spacingbtn}>
              {filteredTokens.length > 0 ? (
                filteredTokens.map((data) => (
                  <ManageCustom
                    key={data.coin_id}
                    currency={data.coin_symbol.toUpperCase()}
                    name={data.coin_name}
                    symbol={data.coin_symbol}
                    img={data.coin_image}
                    // valuecurrency={data.coin_family === 1 ? "BEP20" : "ERC20"}
                    valuecurrency={
                      data?.token_address !== null
                        ? token_type(data?.coin_family)
                        : ''
                    }
                    id={data.coin_id}
                    coinFamily={data.coin_family}
                    walletAddress={
                      account.coinFamilyAndAddress[data.coin_family]
                    }
                    status={data.wallet_data?.status || false}
                    coin={data}
                    curr={currency}
                    init={() => {
                      setCurrentPage(1);
                      init();
                    }}
                  />
                ))
              ) : !loading ? (
                <p
                  className="noAddress"
                  style={{
                    fontWeight: 'bold',
                    fontSize: '15px',
                    marginTop: '65%',
                  }}
                >
                  {loading ? 'Loading...' : 'No assets found'}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="addToken">
        {!(
          filteredTokens.length === 1 &&
          filteredTokens[0]?.coin_symbol === 'btc' &&
          account.isWatchOnly
        ) ? (
          <Link to="/add-token">
            <ButtonComp text={'Add Custom Token'} maxWidth={'100%'} />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default Manage;
