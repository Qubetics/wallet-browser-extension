import React, { useEffect, useMemo, useState } from "react";
import MenuRestofHeaders from "../BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import useCurrentHeight from "../../CustomHooks/useCurrentHeight";
import "./ServiceProvider.scss";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "antd";
import {
  getActiveWalletAddress,
  getAllProviders,
  getUserSubscriptions,
} from "../../services/dvpn";

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.providers)) return value.providers;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.list)) return value.list;
  return [];
};

const getProviderAddress = (provider) =>
  provider?.address || provider?.provider_address || provider?.prov_address || provider?.id || "";

const getProviderName = (provider) =>
  provider?.name || provider?.provider_name || provider?.identity || "Unknown Provider";

const getCountryCount = (provider) =>
  provider?.countries_count || provider?.countriesCount || provider?.country_count || 0;

function ServiceProvider() {
  const height = useCurrentHeight();
  const navigateTo = useNavigate();
  const [providers, setProviders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadProviders = async () => {
      try {
        setLoading(true);
        const walletAddress = await getActiveWalletAddress();
        const [providersPayload, subscriptionsPayload] = await Promise.all([
          getAllProviders(walletAddress),
          getUserSubscriptions(walletAddress, { limit: 5, order: "DESC" }),
        ]);
        if (cancelled) return;
        setProviders(asArray(providersPayload?.data || providersPayload));
        setSubscriptions(
          asArray(subscriptionsPayload?.data?.subscriptions || subscriptionsPayload?.data || subscriptionsPayload)
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProviders();
    return () => {
      cancelled = true;
    };
  }, []);

  const subscriptionByProvider = useMemo(() => {
    const map = new Map();
    (subscriptions || []).forEach((subscription) => {
      const providerAddress =
        subscription?.plans?.provider_address ||
        subscription?.provider_address ||
        subscription?.providerAddress;
      if (!providerAddress) return;
      if (!map.has(providerAddress)) {
        map.set(providerAddress, subscription);
      }
    });
    return map;
  }, [subscriptions]);

  const providerCards = useMemo(() => {
    return (providers || []).map((provider) => {
      const providerAddress = getProviderAddress(provider);
      const subscription = subscriptionByProvider.get(providerAddress);
      const hasPlan =
        !!subscription &&
        !String(subscription?.status || "").toLowerCase().includes("inactive");
      return {
        provider,
        providerAddress,
        providerName: getProviderName(provider),
        countries: getCountryCount(provider),
        hasPlan,
        selected: hasPlan,
        subscription,
      };
    });
  }, [providers, subscriptionByProvider]);

  return (
    <div className="scrollableCont service-provider-page" style={{ height: "auto" }}>
      <div className="searchBarFixed">
        <MenuRestofHeaders title={"Service Provider"} backTo={"/dvpn"} />
      </div>

      <div className={`${"service-provider-list"} ${height <= 600 ? "heightExtServiceProvider" : ""}`}>
        {loading &&
          Array.from({ length: 3 }).map((_, index) => (
            <div className="provider-card" key={`provider-skeleton-${index}`}>
              <Skeleton className="dvpn-skeleton-wave" active paragraph={{ rows: 1 }} title={false} />
            </div>
          ))}

        {!loading &&
          providerCards.map((providerItem, index) => (
            <div
              className={`provider-card ${providerItem.selected ? "selected" : ""}`}
              key={`${providerItem.providerAddress}-${index}`}
              onClick={() =>
                navigateTo(providerItem.hasPlan ? "/servers" : "/accountTopUp", {
                  state: {
                    providerAddress: providerItem.providerAddress,
                    providerName: providerItem.providerName,
                    planId: providerItem.subscription?.plan_id,
                    subscription: providerItem.subscription || null,
                  },
                })
              }
            >
              <div className="provider-avatar">{providerItem.providerName.charAt(0)}</div>
              <div className="provider-details">
                <h3>{providerItem.providerName}</h3>
                <p>{providerItem.providerAddress}</p>
                {providerItem.countries ? <small>{providerItem.countries} Country</small> : null}
              </div>
              {providerItem.selected ? (
                <span className="selected-pill">Selected</span>
              ) : null}
            </div>
          ))}
      </div>
    </div>
  );
}

export default ServiceProvider;
