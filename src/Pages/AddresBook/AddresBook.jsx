import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders.jsx";
import AddressNetworkCard from "../../Components/AddressNetworkCard/AddressNetworkCard.jsx";
import { useSelector } from "react-redux";
import { message } from "antd";
import { server } from "../../server.js";
import { InputField } from "../../Components/InputField/InputFieldSimple.jsx";
import Search from "../../Assets/SearchIcon.svg";
import { store } from "../../index.js";
import { setLoading } from "../../actions/loading.js";

function AddresBook() {
  const { account, chain } = useSelector((state) => state);
  const [messageApi, contextHolder] = message.useMessage();

  const refresh = () => {
    init();
  };

  const [list, setList] = useState([]);
  const [keyword, setKeyword] = useState(null);

  const init = async () => {
    try {
      store.dispatch(setLoading(true));
      const { data } = await server.post(
        "/wallet/address_book/list",
        {
          wallet_address: account.coinFamilyAndAddress[1],
          search: keyword ? keyword.trim() : undefined,
          per_page: 300,
          order_by: "name",
          order_type: "asc",
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      setList(data.data);
      store.dispatch(setLoading(false));
    } catch (error) {
      messageApi.error(error.message);
    }
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
  }, [keyword]);

  return (
    <div className={`scrollableCont`}>
      <MenuRestofHeaders
        backTo={"/setting"}
        title={"Address Book"}
        addIcon={"/add-contact"}
      />
      {contextHolder}

      <div className={`flexedContent`}>
        {/* <Link to='/add-contact'>
          <ButtonComp
            text={"Add Contact"}
            maxWidth={"100%"}
            marginBottom={"40px"}
          />
        </Link> */}

        <div className="search" style={{ marginBottom: "20px" }}>
          <InputField
            addonBefore={
              <span>
                <img
                  src={Search}
                  style={{
                    width: "17px",
                  }}
                  alt=""
                />
              </span>
            }
            placeholder={"Search"}
            value={keyword}
            checkForSymbols={true}
            getData={(value) => {
              setKeyword(value);
            }}
          />
        </div>

        {list.length > 0 ? (
          list.map((el, index) => (
            <AddressNetworkCard
              heading={el.name.toUpperCase()}
              address={el.address}
              wallet_address={el.wallet_address}
              currency={`${el.coin_data.coin_symbol.toUpperCase()} (${
                el.coin_data.coin_name
              })`}
              index={index}
              id={el.id}
              refresh={refresh}
            />
          ))
        ) : (
          <p
            style={{ fontSize: "17px", marginTop: "50%", fontWeight: "bold" }}
            className="noAddress"
          >
            Address Not Found
          </p>
        )}
      </div>
    </div>
  );
}

export default AddresBook;
