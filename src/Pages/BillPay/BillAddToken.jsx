import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import DarkLinkBill from "../../Assets/darkLinkBill.svg";
import LightLinkBill from "../../Assets/linkBill.svg";
import Search from "../../Assets/SearchIcon.svg";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { spritzHelper } from "../../helpers/spritz.helper";
import { setLoading } from "../../actions/loading";
import { store } from "../..";
import { InputField } from "../../Components/InputField/InputFieldSimple";
function BillAddToken() {
  const { theme } = useSelector((state) => state);
  const { state } = useLocation();
  const navigate = useNavigate();
  const [billLists, setBillList] = useState([]);
  const [search, setSearch] = useState(null);

  const getBillByCategory = async (billType) => {
    try {
      store.dispatch(setLoading(true));
      let billList = await spritzHelper.getInstitutionBills(billType);
      setBillList(billList);
      store.dispatch(setLoading(false));
    } catch (error) {
      // console.log("error::", error);
      store.dispatch(setLoading(false));
    }
  };
  useEffect(() => {
    getBillByCategory(state?.billType);
  }, [state]);

  const handleSearch = async (search, billType) => {
    try {
      store.dispatch(setLoading(true));
      const result = await spritzHelper.searchInstitutionBills(
        search,
        billType
      );
      setBillList(result);
      store.dispatch(setLoading(false));
    } catch (error) {
      store.dispatch(setLoading(false));
      // console.log("error::", error);
    }
  };

  useEffect(() => {
    let debounceTimer;

    const handleDebouncedSearch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        handleSearch(search, state?.billType);
      }, 2000);
    };

    if (search) {
      handleDebouncedSearch();
    } else {
      getBillByCategory(state?.billType);
    }

    return () => clearTimeout(debounceTimer);
  }, [search]);

  return (
    <div>
      <MenuRestofHeaders
        backTo={"/withdraw"}
        title={"My Bills"}
        searchTo={false}
      />
      <div className={`flexedContent`}>
        <div className="search" style={{ marginBottom: "30px" }}>
          <div className="linkedBill">
            <div className="">
              <InputField
                placeholder={"Search"}
                coloredBg={"#eef3f9"}
                value={search}
                checkForSymbols={true}
                getData={(value) => {
                  setSearch(value);
                }}
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
              />
            </div>

            {billLists?.length > 0 ? (
              billLists?.map((item) => {
                return (
                  <>
                    <div
                      className="innerContact"
                      style={{
                        cursor: "pointer",
                      }}
                    >
                      <div
                        className="left"
                        onClick={() =>
                          navigate("/creditcard", {
                            state: {
                              billName: item,
                              billType: state?.billType,
                            },
                          })
                        }
                      >
                        {theme == "darkTheme" ? (
                          <img
                            style={{
                              height: "40px",
                              width: "40px",
                            }}
                            src={item?.logo}
                          />
                        ) : (
                          <img
                            style={{
                              height: "40px",
                              width: "40px",
                            }}
                            src={item?.logo}
                          />
                        )}
                        <div className="leftInner">
                          <h2>{item?.name}</h2>
                        </div>
                      </div>
                    </div>
                    {/* <hr /> */}
                  </>
                );
              })
            ) : (
              <div
                style={{
                  textAlign: "center",
                }}
              >
                <p
                  className="noAddress"
                  style={{
                    marginTop: "4%",
                    marginBottom: "15px",
                    fontWeight: "bold",
                    fontSize: "15px",
                  }}
                >
                  Bill not found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    // </div>
  );
}

export default BillAddToken;
