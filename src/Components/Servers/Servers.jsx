import React, { useEffect, useMemo, useState } from "react";
import "./Servers.scss";
import MenuRestofHeaders from "../BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import EUROPE from "../../Assets/cuntry/europe.svg";
import BRITISH from "../../Assets/cuntry/british.svg";
import { InputField } from "../InputField/InputFieldSimple";
import Search from "../../Assets/SearchIcon.svg";
import { useLocation, useNavigate } from "react-router-dom";
import useCurrentHeight from "../../CustomHooks/useCurrentHeight";
import { getActiveWalletAddress, getNodes } from "../../services/dvpn";
import { Skeleton } from "antd";

const toCountryItems = (payload) => {
  const data = payload?.data || payload || {};
  const countriesRaw = Array.isArray(data?.countries)
    ? data.countries
    : Array.isArray(data)
      ? data
      : [];
  return countriesRaw.map((item) => {
    if (typeof item === "string") {
      return {
        country: item,
        locations: 1,
        flag: item.toLowerCase().includes("united kingdom") ? BRITISH : EUROPE,
      };
    }
    return {
      country: item?.country || item?.name || "Unknown Country",
      locations: item?.locations || item?.count || 1,
      flag: item?.flag_url || (String(item?.country || "").toLowerCase().includes("united kingdom") ? BRITISH : EUROPE),
    };
  });
};

function Servers() {
  const navigate = useNavigate();
  const location = useLocation();
  const height = useCurrentHeight();
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const fallbackPlanId = sessionStorage.getItem("dvpn_selected_plan_id") || "";
  const planId =
    location?.state?.planId ||
    location?.state?.subscription?.plan_id ||
    fallbackPlanId;

  useEffect(() => {
    if (planId) {
      sessionStorage.setItem("dvpn_selected_plan_id", planId);
    }
  }, [planId]);

  useEffect(() => {
    let cancelled = false;
    const loadCountries = async () => {
      try {
        setLoading(true);
        if (!planId) {
          if (cancelled) return;
          setCountries([]);
          return;
        }
        const walletAddress = await getActiveWalletAddress();
        const payload = await getNodes(walletAddress, {
          limit: 10,
          page: 1,
          order: "DESC",
          reverse: false,
          plan_id: planId,
          protocol: "wireguard",
        });
        if (cancelled) return;
        setCountries(toCountryItems(payload));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCountries();
    return () => {
      cancelled = true;
    };
  }, [planId]);

  const countryList = useMemo(() => {
    if (activeTab === "Wireguard") return countries;
    return countries;
  }, [activeTab, countries]);

  const filteredCountries = useMemo(() => {
    const q = String(searchTerm || "").trim().toLowerCase();
    if (!q) return countryList;
    return countryList.filter((item) =>
      String(item?.country || "").toLowerCase().includes(q)
    );
  }, [countryList, searchTerm]);
  return (
    <div className={`scrollableCont`} style={{ hight: "auto" }}>
      <div className="searchBarFixed">
        <MenuRestofHeaders title={"Servers"} backTo={"/service-provider"} />
        <div className="search">
          <InputField
            placeholder={"Search country /city"}
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
                  alt=""
                />
              </span>
            }
          />
        </div>
      </div>
      <div className={`${'recent-servers'} ${
      height <= 600 ? 'heightExtServers' : ''
    }`}>
        <div className="tabs">
          <button 
            className={`tab ${activeTab === "All" ? "active" : ""}`}
            onClick={() => setActiveTab("All")}
          >
            All
          </button>
          <button 
            className={`tab ${activeTab === "Wireguard" ? "active" : ""}`}
            onClick={() => setActiveTab("Wireguard")}
          >
            Wireguard
          </button>
        </div>

        <div className="server-list">
          {loading &&
            Array.from({ length: 3 }).map((_, index) => (
              <div className="server-item" key={`country-skeleton-${index}`}>
                <Skeleton className="dvpn-skeleton-wave" active paragraph={{ rows: 1 }} title={false} />
              </div>
            ))}
          {!loading &&
            filteredCountries.map((countryItem, index) => (
            <div
              className="server-item"
              key={index}
              onClick={() =>
                navigate("/serversDetails", {
                  state: {
                    country: countryItem.country,
                    planId,
                    flag: countryItem.flag,
                  },
                })
              }
            >
              <div className="info">
                <span className="flag">
                  <img src={countryItem.flag} alt={countryItem.country} />
                </span>
                <div style={{ textAlign: "left" }}>
                  <div className="country">{countryItem.country}</div>
                  <div className="locations">{countryItem.locations} Location</div>
                </div>
              </div>
              {/* <span className="link-icon">🔗</span> */}
            </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default Servers;
