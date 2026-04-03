import React, { useEffect, useMemo, useState } from "react";
import "./AccountTopUp.scss";
import MenuRestofHeaders from "../../BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import SmallLogo from "../../../Assets/DarkLogo.svg";
import ButtonComp from "../../ButtonComp/ButtonComp";
import ModalCustom from "../../ModalCustom/ModalCustom";
import { useLocation, useNavigate } from "react-router-dom";
import { Drawer, Skeleton, message } from "antd";
import ModalCloseIcon from "../../../Assets/ModalCloseIcon.svg";
import useCurrentHeight from "../../../CustomHooks/useCurrentHeight";
import {
  getActiveWalletAddress,
  getProviderPlans,
  getTicsBalance,
  purchasePlan,
} from "../../../services/dvpn";
import InputFieldSimple from "../../InputField/InputFieldSimple";
import { WalletHelper } from "../../../helpers/wallet.helper";

const getPlanPrice = (plan) => {
  const firstPrice = Array.isArray(plan?.prices) ? plan.prices[0] : null;
  const raw =
    firstPrice?.base_value ??
    firstPrice?.quote_value ??
    plan?.price?.base_value ??
    plan?.price ??
    0;
  return Number(raw || 0);
};

const getPlanDenom = (plan) => {
  const firstPrice = Array.isArray(plan?.prices) ? plan.prices[0] : null;
  return String(firstPrice?.denom || plan?.price?.denom || "TICS").toUpperCase();
};

const getPlanDays = (plan) => {
  const totalHours = Number(plan?.hours || 0);
  if (!totalHours) return 0;
  return Math.max(1, Math.round(totalHours / 24));
};

const getPlanFiatUsd = (plan) => Number(plan?.prices_in_usd || plan?.price_usd || 0);

const formatUsd = (value) => {
  const amount = Number(value || 0);
  return `$${amount.toFixed(2)}`;
};

const shortenTextMiddle = (value, start = 12, end = 10) => {
  const text = String(value || "");
  if (!text) return "";
  if (text.length <= start + end + 3) return text;
  return `${text.slice(0, start)}...${text.slice(-end)}`;
};

function AccountTopUp() {
  const location = useLocation();
  const providerAddress = location?.state?.providerAddress || "";
  const isProviderTopupFlow = Boolean(providerAddress);
  const backRoute =
    location?.state?.backTo || (isProviderTopupFlow ? "/service-provider" : "/dvpnSetting");
  const [selectedPackage, setSelectedPackage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [sessionPassword, setSessionPassword] = useState("");
  const [availableBalance, setAvailableBalance] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [lastPurchase, setLastPurchase] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [providerPlans, setProviderPlans] = useState([]);
  const navigate = useNavigate();
  const height = useCurrentHeight();

  const creditPackages = [
    {
      id: 1,
      credits: 5000,
      price: 1400,
    },
    {
      id: 2,
      credits: 10000,
      price: 2900,
    },
    {
      id: 3,
      credits: 15000,
      price: 4900,
    },
  ];

  const loadPlansData = async () => {
    if (!providerAddress) return;
    try {
      setLoadingPlans(true);
      const walletAddress = await getActiveWalletAddress();
      const payload = await getProviderPlans(walletAddress, { providerAddress });
      const data = payload?.data || payload || {};
      const plans = Array.isArray(data?.plans)
        ? data.plans
        : Array.isArray(data)
          ? data
          : [];
      setProviderPlans(plans);
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    loadPlansData();
  }, [providerAddress]);

  const displayPackages = useMemo(() => {
    if (isProviderTopupFlow) {
      return providerPlans.map((plan, index) => ({
        id: Number(plan?.plan_id || plan?.id || index + 1),
        credits: Number(plan?.credits || plan?.duration_days || plan?.plan_days || 0),
        hours: Number(plan?.hours || 0),
        days: getPlanDays(plan),
        price: getPlanPrice(plan),
        denom: getPlanDenom(plan),
        fiatUsd: getPlanFiatUsd(plan),
        label: plan?.name || plan?.plan_name || "",
      }));
    }
    if (!providerPlans.length) return creditPackages;
    return providerPlans.map((plan, index) => ({
      id: Number(plan?.plan_id || plan?.id || index + 1),
      credits: Number(plan?.credits || plan?.duration_days || plan?.plan_days || 0),
      hours: Number(plan?.hours || 0),
      days: getPlanDays(plan),
      price: getPlanPrice(plan),
      denom: getPlanDenom(plan),
      fiatUsd: getPlanFiatUsd(plan),
      label:
        plan?.name ||
        plan?.plan_name ||
        `Plan ${plan?.plan_id || plan?.id || index + 1}`,
    }));
  }, [creditPackages, isProviderTopupFlow, providerPlans]);
  const hasNoProviderPlans =
    isProviderTopupFlow && !loadingPlans && displayPackages.length === 0;
  const selectedPlan = useMemo(
    () => displayPackages.find((pkg) => pkg.id === selectedPackage) || null,
    [displayPackages, selectedPackage]
  );

  useEffect(() => {
    if (!displayPackages.length) {
      setSelectedPackage(null);
      return;
    }
    const exists = displayPackages.some((pkg) => pkg.id === selectedPackage);
    if (!exists) {
      setSelectedPackage(displayPackages[0].id);
    }
  }, [displayPackages, selectedPackage]);

  const handlePackageSelect = (packageId) => {
    setSelectedPackage(packageId);
  };

  const handleBuyNow = () => {
    if (!selectedPackage || isPurchasing) return;
    setIsPasswordModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleGoToHome = () => {
    setIsModalOpen(false);
    navigate("/dvpn");
  };

  const handleCopyText = async (value, label = "Value") => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      message.destroy();
      message.success(`${label} copied`);
    } catch {
      message.destroy();
      message.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const handlePurchaseWithPassword = async () => {
    if (!selectedPlan?.id) {
      message.error("Please select a plan to continue.");
      return;
    }
    if (!sessionPassword) {
      message.error("Please enter password.");
      return;
    }
    const verified = await WalletHelper.verifyPassword(sessionPassword);
    if (!verified) {
      message.error("Please enter valid password to proceed.");
      return;
    }
    try {
      setIsPurchasing(true);
      const walletAddress = await getActiveWalletAddress();
      const result = await purchasePlan({
        planId: selectedPlan.id,
        walletAddress,
        providerAddress,
        sessionPassword,
        verifyOnBackend: true,
      });
      setLastPurchase(result || null);
      setIsPasswordModalOpen(false);
      setSessionPassword("");
      setIsModalOpen(true);
      message.success("Plan purchased successfully.");
    } catch (error) {
      // Purchase errors are already surfaced via dVPN error handler.
    } finally {
      setIsPurchasing(false);
    }
  };

  const handlePasswordCancel = () => {
    setSessionPassword("");
    setIsPasswordModalOpen(false);
  };

  useEffect(() => {
    let cancelled = false;
    const loadAvailableBalance = async () => {
      if (!isPasswordModalOpen) return;
      try {
        const walletAddress = await getActiveWalletAddress();
        const balance = await getTicsBalance({ walletAddress });
        if (!cancelled) {
          const amount = Number(balance?.amount || 0);
          const denom = String(balance?.denom || "TICS").toUpperCase();
          const divisor =
            denom === "QTICS" || denom === "QTIS"
              ? 1e18
              : denom === "UTICS"
                ? 1e6
                : 1;
          setAvailableBalance(`${(amount / divisor).toFixed(2)} TICS`);
        }
      } catch (error) {
        if (!cancelled) setAvailableBalance("0.00 TICS");
      }
    };
    loadAvailableBalance();
    return () => {
      cancelled = true;
    };
  }, [isPasswordModalOpen]);

  return (
    <div className={`scrollableCont`} style={{ height: "auto" }}>
      <div className="searchBarFixed">
        <MenuRestofHeaders title={"Account Top-Up"} backTo={backRoute} />
      </div>
      <div className={`account-topup ${
      height <= 600 ? 'heightExtAccountTopUp' : ''
    }`}>
        <div className="topup-header">
          <div className="header-title-row">
            <h2>Get Some Credits</h2>
          </div>
          <p>
            Purchase Credits and spend them on fast, secure & decentralized VPN
            service within Sentinel Blockchain.
          </p>
        </div>

        <div className="credit-packages">
          {loadingPlans &&
            Array.from({ length: 2 }).map((_, index) => (
              <div className="credit-package" key={`plan-skeleton-${index}`}>
                <Skeleton className="dvpn-skeleton-wave" active paragraph={{ rows: 1 }} title={false} />
              </div>
            ))}
          {!loadingPlans &&
            displayPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`credit-package ${
                selectedPackage === pkg.id ? "selected" : ""
              } `}
              onClick={() => handlePackageSelect(pkg.id)}
            >
              <div className="package-icon">
                <div className="coin-icon">
                  <img src={SmallLogo} alt="" />
                </div>
              </div>

              <div className="package-details">
                <div className="credits-amount">
                  <h4>
                    {isProviderTopupFlow
                      ? `${Number(pkg.days || 0).toLocaleString()} Days`
                      : `${pkg.label || ""}${pkg.credits ? ` (${pkg.credits.toLocaleString()} Credits)` : ""}`}
                  </h4>
                </div>
                <div className="price">
                  <h2>{pkg.price.toLocaleString()}</h2>
                  <span className="currency"> {pkg.denom || "TICS"}</span>
                </div>
                {isProviderTopupFlow ? (
                  <div className="fiat-price">{formatUsd(pkg.fiatUsd)} USD</div>
                ) : null}
              </div>
            </div>
            ))}
          {!loadingPlans && isProviderTopupFlow && displayPackages.length === 0 && (
            <div className="credit-package empty-plan-card">
              <p className="empty-plan-text">
                No plans available for this provider right now.
              </p>
            </div>
          )}
        </div>

        {!hasNoProviderPlans ? (
          <ButtonComp
            text={"Buy Now"}
            maxWidth={"100%"}
            onClick={handleBuyNow}
            disabled={!selectedPackage || (isProviderTopupFlow && displayPackages.length === 0)}
            className={`buy-now-btn ${selectedPackage ? "enabled" : "disabled"}`}
          />
        ) : null}

        <div className="purchase-info">
          <p>
            {selectedPackage && displayPackages.length > 0 && (
              <span>
                You're purchasing{" "}
                {isProviderTopupFlow
                  ? `${Number(selectedPlan?.days || 0).toLocaleString()} days`
                  : selectedPlan?.credits
                    ? `${selectedPlan.credits.toLocaleString()} credits`
                    : `${Number(selectedPlan?.hours || 0).toLocaleString()} hours`}{" "}
                for {`${selectedPlan?.price.toLocaleString()} TICS`} 
              </span>
            )}
          </p>
          <p>
            Payment will be charged to your Qubetics Account. This credits are for
            decentralized VPN services only.
            {/* <button
              type="button"
              className="link"
              onClick={() => console.log("Open Terms of Service")}
            >
              Terms of Service
            </button>{" "}
            and{" "}
            <button
              type="button"
              className="link"
              onClick={() => console.log("Open Privacy Policy")}
            >
              Privacy Policy
            </button> */}
            .
          </p>
        </div>
      </div>

      <Drawer
        // title="Select Token"
        placement="bottom"
        onClose={() => {
          setIsModalOpen(false);
        }}
        open={isModalOpen}
        closeIcon={<img src={ModalCloseIcon} alt="Close" />}
        height={460}
      >
        <div className="purchase-success-content">
          <div className="success-icon">
          <img
            src={require("../../../Assets/GreenCheck.gif")}
            style={{
              width: "200px",
            }}
            alt=""
          />
          </div>

          <h2>Purchase Successful!</h2>

          <div className="credit-info">
            <p className="credit-plan">
              <strong>Credit Plan:</strong> Premium{" "}
              {isProviderTopupFlow
                ? `${selectedPlan?.days || 0} Days`
                : `${selectedPlan?.credits || selectedPlan?.hours || 0} ${selectedPlan?.credits ? "Credits" : "Hours"}`}
            </p>
            <p className="purchase-details">
              You have successfully purchased{" "}
              {isProviderTopupFlow
                ? `${selectedPlan?.days || 0} days`
                : `${selectedPlan?.credits || selectedPlan?.hours || 0} ${selectedPlan?.credits ? "credits" : "hours"}`
              } for{" "}
              {`${selectedPlan?.price || 0}`} {String(selectedPlan?.denom || "TICS").toUpperCase()}. Enjoy your premium
              features!
            </p>
            {lastPurchase?.txHash ? (
              <div className="purchase-details hash-row">
                <span className="hash-label">Tx Hash:</span>
                <span className="hash-value" title={lastPurchase.txHash}>
                  {shortenTextMiddle(lastPurchase.txHash)}
                </span>
                <button
                  type="button"
                  className="copy-hash-btn"
                  onClick={() => handleCopyText(lastPurchase.txHash, "Tx hash")}
                >
                  Copy
                </button>
              </div>
            ) : null}
            {lastPurchase?.subscriptionId ? (
              <p className="purchase-details">
                Subscription ID: {String(lastPurchase.subscriptionId)}
              </p>
            ) : null}
          </div>

          <ButtonComp
            text="Go to Home"
            maxWidth="100%"
            onClick={handleGoToHome}
          />
        </div>
      </Drawer>

      <ModalCustom
        title={"Verify Password"}
        handleCancel={handlePasswordCancel}
        isModalOpen={isPasswordModalOpen}
        customClass="customClassModal"
      >
        <div className="purchase-password-form">
          <p className="purchase-balance-text">
            Available Balance: {availableBalance || "Loading..."}
          </p>
          <InputFieldSimple
            placeholder="Enter Password"
            value={sessionPassword}
            getData={(value) => {
              const hasEmoji = /[\p{Extended_Pictographic}]/u.test(value);
              if (value.length <= 100 && !hasEmoji) {
                setSessionPassword(value);
              }
            }}
            type={"password"}
          />
          <ButtonComp
            text={isPurchasing ? "Processing..." : "Continue"}
            maxWidth={"100%"}
            disabled={isPurchasing}
            onClick={handlePurchaseWithPassword}
          />
        </div>
      </ModalCustom>
    </div>
  );
}

export default AccountTopUp;
