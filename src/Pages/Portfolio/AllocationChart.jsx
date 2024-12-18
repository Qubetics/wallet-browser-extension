import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { useSelector } from "react-redux";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { server } from "../../server";
import BTC from "../../Assets/Coins/BTC.png";
const AllocationChart = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [portfolioBalace, setPortfolioBalace] = useState(0);
  const [labels, setLabels] = useState(["ETH", "BNB", "SOL", "BTC", "POL"]);
  const [chartSeries, setChartSeries] = useState([0, 0, 0, 0, 0]);
  const { account, currency, tokens, balanceIn, theme } = useSelector(
    (state) => state
  );

  const [chartOptions, setChartOptions] = useState({
    chart: {
      type: "donut",
    },
    labels: labels, // Initial empty array, will update later
    plotOptions: {
      pie: {
        donut: {
          size: "85%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "",
              formatter: () => "",
              fontSize: "18px",
              color: "#fff",
              fontWeight: 500,
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    colors: ["#00E396", "#FEB019", "#FF4560", "#775DD0", "#00D9E9"],
    legend: {
      show: false,
    },
    stroke: {
      show: false,
    },
    tooltip: {
      enabled: true,
      style: {
        fontSize: "14px",
      },
    },
  });

  const init = async () => {
    try {
      store.dispatch(setLoading(true));

      const { data } = await server.post(
        `/wallet/portfolio`,
        {
          page: 1,
          limit: 100,
          coin_family: account?.coinFamilies,
          search: "",
          addressListKeys: account?.addressLists,
          fiat_type: currency?.name,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      setPortfolio(data?.data);
      const totalBalance = data?.data.reduce(
        (acc, obj) => acc + obj?.balance,
        0
      );

      // Check if totalBalance is valid
      if (totalBalance == 0) {
        console.error("Total balance is zero. Cannot calculate percentages.");
        setPortfolioBalace(0);
        setChartSeries([0, 0, 0, 0, 0]);
        store.dispatch(setLoading(false));
        return;
      }

      const percentages = data?.data.map((obj) => {
        return {
          name: obj?.coin?.coin_symbol,
          percentage: (
            (obj?.balance / totalBalance == 0 ? 1 : totalBalance) * 100
          ).toFixed(2),
        };
      });

      const names = percentages.map((item) => item.name.toUpperCase());
      const percentagesArr = percentages.map((item) =>
        parseFloat(item.percentage)
      );

      // Update labels and series dynamically
      setLabels(names);
      setChartSeries(percentagesArr);
      console.log("TTTTTTTTTTTTTTTTT ", totalBalance);

      setPortfolioBalace(totalBalance);

      // Update chart options with new labels
      setChartOptions((prevOptions) => ({
        ...prevOptions,
        labels: names,
      }));

      store.dispatch(setLoading(false));
    } catch (error) {
      console.log("Portfolio error: ", error);
      store.dispatch(setLoading(false));
    }
  };
  //gospel rally radio hole win naive mystery pudding pride scene cousin hawk
  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    // Check if the chartSeries is empty or all values are zero
    const isEmpty =
      chartSeries.length === 0 || chartSeries.every((val) => val === 0);

    if (isEmpty) {
      setChartSeries([100]); // Show a full dark section when no data
      setChartOptions((prevOptions) => ({
        ...prevOptions,
        colors: ["#1413132e"], // Dark color for empty state
        labels: ["No Data"], // Label for empty state
      }));
    } else {
      setChartOptions((prevOptions) => ({
        ...prevOptions,
        colors: ["#00E396", "#FEB019", "#FF4560", "#775DD0", "#00D9E9"], // Restore original colors
      }));
    }
  }, [chartSeries]);
  const currencies = ["Bitcoin", "Ethereum", "Solana", "Tether"];
  return (
    <div
      className="allocation-chart"
      style={{
        color: "#fff",
        maxWidth: "400px",
        margin: "0 auto",
      }}
    >
      <div style={{ position: "relative" }}>
        <Chart
          options={chartOptions}
          series={chartSeries}
          type="donut"
          height={200}
        />

        {/* Custom text in the center of the chart */}
        <div className="assetsAllocation">
          <span
            style={{ fontSize: "14px", fontWeight: "400", color: "#98969B" }}
          >
            Assets
          </span>
          <span
            style={{ fontSize: "16px", fontWeight: "700", color: "#FFFFFF" }}
          >
            Allocation
          </span>
        </div>
      </div>

      {/* Total Invested Amount */}
      <div style={{ textAlign: "center", marginTop: "0", color: "#fff" }}>
        <h3 style={{ fontSize: "18px" }}>
          <span
            style={{ color: "#98969B", fontWeight: "400", paddingRight: "5px" }}
          >
            Total Invested Amount:
          </span>
          <span style={{ color: "#FFFFFF", fontWeight: "600" }}>
            {currency?.symbol} {portfolioBalace.toFixed(2)}
          </span>
        </h3>
      </div>
      <div className="investedAmountShow">
        {currencies.map((currency, index) => (
          <div
            key={index}
            className={`investedCurrency ${currency.toLowerCase()}`}
          >
            <p>{currency}</p>
          </div>
        ))}
      </div>

      {/* Asset details */}
      <ul className="portfolio__tableOuter ">
        {portfolio &&
          portfolio.map((itm, idx) => (
            <li key={idx} className="coinsTable1 flex-item">
              <div className="coinsTable1__left">
                <div className="coinsTable1__left__icon">
                  <img src={BTC} alt="" />
                </div>
                <div className="coinsTable1__left__textSec">
                  <div className="coinsTable1__textTop">
                    <span className="coinNname">
                      {itm?.coin?.coin_symbol?.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: "#98969B" }}>Percentage</span>
                    <span style={{ color: "#7DB0FF", marginLeft: "5px" }}>
                      {(
                        (itm?.balance /
                          (portfolioBalace === 0 ? 1 : portfolioBalace)) *
                        100
                      ).toFixed(2)}
                      %
                    </span>
                  </div>
                </div>
              </div>
              <div className="coinsTable1__right">
                <span> {itm?.balance}</span>

                <span>
                  <span style={{ color: "#98969B", marginLeft: "5px" }}>
                    Amount
                  </span>
                </span>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default AllocationChart;
