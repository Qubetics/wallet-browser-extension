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
import { useLocation, useNavigate } from "react-router-dom";

function AddresBook() {
  const { account, chain, loading } = useSelector((state) => state);
  const [messageApi, contextHolder] = message.useMessage();
  const [editModal, setEditModal] = useState(false);
  const [editModalMain, setEditModalMain] = useState(false);
  const location = useLocation();


  const refresh = () => {
    init();
  };

  const [list, setList] = useState([]);
  const [keyword, setKeyword] = useState(null);

  const init = async () => {
    try {
      store.dispatch(setLoading(true));
      const { data } = await server.post(
        "/user/address_book",
        {
          address: Object.values(account?.coinFamilyAndAddress),
          coin_family: [1, 2, 3, 4, 5, 7],
          limit: 25,
          page: 1,
          search: keyword ? keyword.trim() : undefined,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      setList(data?.data);
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
  }, [keyword]);


  const navigate = useNavigate();
  const handleAddAddress = () => {

    navigate("/add-contact");

  };
  return (
    <div className={`scrollableCont`}>
      <div className="searchBarFixed">
        <MenuRestofHeaders
          backTo={location?.state?.path ? location?.state?.path : "/setting"}
          title={"Address Book"}
          addIcon={"/add-contact"}
        />
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
              const hasEmoji = /[\p{Extended_Pictographic}]/u.test(value);
              if (value.length <= 100 && !hasEmoji) {
                setKeyword(value);
              }
            }}
          />
        </div>
      </div>
      {contextHolder}

      <div className={`flexedContent padding-Top`}>
        {list.length > 0 ? (
          list.map((el, index) => (
            <AddressNetworkCard
              heading={el?.name}
              address={el?.address}
              wallet_address={el?.address}
              currency={`${el?.wallet_data?.coin_family} (${el?.wallet_data?.name})`}
              index={index}
              id={el?.id}
              refresh={refresh}
              wallet_data={el?.wallet_data}
              editModal={editModal}
              setEditModal={setEditModal}
              editModalMain={editModalMain}
              setEditModalMain={setEditModalMain}
              inits={init}
            />
          ))
        ) : (
          <p
            style={{ fontSize: "17px", marginTop: "50%", fontWeight: "bold" }}
            className="noAddress"
          >
            {loading ? 'Loading...' : 'Address Not Found'}
          </p>
        )}
      </div>
    </div>
  );
}

export default AddresBook;
