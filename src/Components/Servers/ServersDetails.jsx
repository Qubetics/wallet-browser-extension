import React, { useEffect, useMemo, useState } from "react";
import MenuRestofHeaders from "../BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { InputField } from "../InputField/InputFieldSimple";
import Search from "../../Assets/SearchIcon.svg";
import "./Servers.scss";
import { useLocation, useNavigate } from "react-router-dom";
import { getActiveWalletAddress, getNodes } from "../../services/dvpn";
import { Skeleton } from "antd";

const toCityItems = (payload) => {
  const data = payload?.data || payload || {};
  const citiesRaw = Array.isArray(data?.cities)
    ? data.cities
    : Array.isArray(data)
      ? data
      : [];
  return citiesRaw.map((item) => {
    if (typeof item === "string") {
      return {
        city: item,
        country: data?.country || "",
        flag: data?.flag_url || "",
      };
    }
    return {
      city: item?.city || item?.name || "Unknown City",
      country: item?.country || data?.country || "",
      flag: item?.flag_url || data?.flag_url || "",
    };
  });
};

function ServersDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const fallbackCountry = sessionStorage.getItem("dvpn_selected_country") || "Selected Country";
  const fallbackPlanId = sessionStorage.getItem("dvpn_selected_plan_id") || "";
  const fallbackFlag = sessionStorage.getItem("dvpn_selected_country_flag") || "";
  const selectedCountry = location?.state?.country || fallbackCountry;
  const planId = location?.state?.planId || fallbackPlanId;
  const selectedFlag = location?.state?.flag || fallbackFlag;
  const [cityItems, setCityItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadCities = async () => {
      try {
        setLoading(true);
        const walletAddress = await getActiveWalletAddress();
        const payload = await getNodes(walletAddress, {
          limit: 10,
          page: 1,
          order: "ASC",
          reverse: false,
          plan_id: planId,
          country: selectedCountry,
          protocol: "wireguard",
        });
        if (cancelled) return;
        setCityItems(toCityItems(payload));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCities();
    return () => {
      cancelled = true;
    };
  }, [planId, selectedCountry]);

  const filteredCityItems = useMemo(() => {
    const q = String(searchTerm || "").trim().toLowerCase();
    if (!q) return cityItems;
    return cityItems.filter((item) => String(item?.city || "").toLowerCase().includes(q));
  }, [cityItems, searchTerm]);

  if (location?.state?.country) {
    sessionStorage.setItem("dvpn_selected_country", location.state.country);
    if (location?.state?.planId) {
      sessionStorage.setItem("dvpn_selected_plan_id", location.state.planId);
    }
    if (location?.state?.flag) {
      sessionStorage.setItem("dvpn_selected_country_flag", location.state.flag);
    }
  }

  return (
    <div
      className={`scrollableCont servers-details`}
      style={{ height: "auto" }}
    >
      <div className="searchBarFixed">
        <MenuRestofHeaders title={"Servers"} backTo={"/servers"} />
        <div className="search">
          <InputField
            placeholder={"Search city..."}
            checkForSymbols={true}
            value={searchTerm}
            getData={(value) => setSearchTerm(value)}
            addonBefore={
              <span>
                <img
                  src={Search}
                  style={{
                    width: "17px",
                  }}
                  alt="Search"
                />
              </span>
            }
          />
        </div>
      </div>

      <div className="servers-list city-list-wrap">
        {loading &&
          Array.from({ length: 3 }).map((_, index) => (
            <div className="server-card city-card" key={`city-skeleton-${index}`}>
              <Skeleton className="dvpn-skeleton-wave" active paragraph={{ rows: 1 }} title={false} />
            </div>
          ))}
        {!loading &&
          filteredCityItems.map((cityItem, index) => (
          <div
            key={`${cityItem?.city}-${index}`}
            className="server-card city-card"
            onClick={() =>
              navigate("/serversNodes", {
                state: {
                  country: selectedCountry,
                  city: cityItem?.city,
                  planId,
                  flag: cityItem?.flag || selectedFlag,
                },
              })
            }
          >
            <div className="server-info">
              <div className="server-header">
                {cityItem?.flag || selectedFlag ? (
                  <span className="server-flag">
                    <img src={cityItem?.flag || selectedFlag} alt={selectedCountry} />
                  </span>
                ) : null}
                <div className="server-details">
                  <h3 className="server-name">{cityItem?.city}</h3>
                  <p className="server-location">{selectedCountry}</p>
                </div>
              </div>

              <div className="server-footer">
                <button className="connect-btn connect">View</button>
              </div>
            </div>
          </div>
          ))}
      </div>
    </div>
  );
}

export default ServersDetails;
