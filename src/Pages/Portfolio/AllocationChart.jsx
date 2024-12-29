import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { useSelector } from "react-redux";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { server } from "../../server";
import BTC from "../../Assets/Coins/BTC.png";





const colors = [

  "#00e396", "#ff4560", "#775dd0", "#feb019", "#ff5733", "#8e44ad", "#2ecc71", "#f39c12", "#3498db", "#e74c3c"

];





const generateColors = (baseColors, count) => {

  const colors = [];

  for (let i = 0; i < count; i++) {

    colors.push(baseColors[i % baseColors.length]);

  }

  return colors;

};

const baseColors = generateColors(colors, 100);



const AllocationChart = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [portfolioBalance, setPortfolioBalance] = useState(0);

  const [labels, setLabels] = useState([]);

  const [chartSeries, setChartSeries] = useState([]);

  const { account, currency } = useSelector((state) => state);


  const [chartOptions, setChartOptions] = useState({
    chart: {
      type: "donut",
    },
    labels: [], // Initial empty array, will update later
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


      const portfolioData = data?.data || [];
      setPortfolio(portfolioData);

      const totalBalance = portfolioData.reduce(
        (acc, obj) => acc + parseFloat(obj?.balance) * parseFloat(obj?.coin?.fiat_price_data?.value || 0),
        0
      );
      if (totalBalance === 0) {
        setPortfolioBalance(0);
        setChartSeries([]);
        setLabels([]);
        store.dispatch(setLoading(false));
        return;
      }
      const percentages = portfolioData.map((obj) => {
        const symbol = obj?.coin?.coin_symbol;
        let type = null;
        if (symbol == 'USDT' || symbol == 'USDC') {
          switch (obj?.coin?.coin_family) {
            case 1: {
              type = 'BEP-20 '
              break;
            }
            case 2: {
              type = 'ERC-20 '
              break;
            }
            case 4: {
              type = 'ERC-20 '
              break;
            }
          }
        }
        return {
          name: type ? (type + obj?.coin?.coin_symbol) : obj?.coin?.coin_symbol,
          percentage:
            ((parseFloat(obj?.balance) * parseFloat(obj?.coin?.fiat_price_data?.value || 0)) / totalBalance) * 100,
        }
      });

      const names = percentages.map((item) => item.name?.toUpperCase() || "Unknown");
      const percentagesArr = percentages.map((item) => parseFloat(item.percentage.toFixed(2)));

      setLabels(names);
      setChartSeries(percentagesArr);
      setPortfolioBalance(totalBalance);

      const chartColors = percentagesArr.map((_, index) => baseColors[index % baseColors.length]);

      setChartOptions((prevOptions) => ({
        ...prevOptions,
        labels: names,
        colors: chartColors,
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
    if (!chartSeries.length || chartSeries.every((val) => val === 0)) {
      setChartSeries([100]);
      setChartOptions((prevOptions) => ({
        ...prevOptions,
        colors: ["#1413132e"],
        labels: ["No Data"],
      }));
    }
  }, [chartSeries]);

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
        {portfolioBalance > 0 && <Chart
          options={chartOptions}
          series={chartSeries}
          type="donut"
          height={200}
        />}

        {/* Custom text in the center of the chart */}
        {portfolioBalance > 0 && <div className="assetsAllocation">
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
        </div>}
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
            {currency?.symbol} {portfolioBalance.toFixed(2)}
          </span>
        </h3>
      </div>
      <div className="investedAmountShow">
        {Array.isArray(labels) && labels.map((currency, index) => (
          <div
            key={index}
            className={`investedCurrency`}

            style={{ borderLeft: `6px solid ${baseColors[index]}`, backgroundColor: '#141423' }}
          >
            <p style={{ textTransform: 'capitalize' }}>{currency}</p>
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
                  {itm?.coin?.coin_image ? <img style={{ height: 35, width: 35 }}

                    src={itm?.coin?.coin_image} alt="" /> : (
                    <div
                      className="randb extra borderDarkLight"
                      style={{
                        height: "30px",
                        width: "30px",
                        background: "rgb(202, 201, 201)",
                        borderRadius: "50%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        border: "1px solid",
                      }}
                    >
                      {itm?.coin?.coin_symbol.split("")[0].toUpperCase()}
                    </div>
                  )}
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
                      {/* {(
                        (itm?.balance /
                          (portfolioBalace === 0 ? 1 : portfolioBalace)) *
                        100
                      ).toFixed(2)}
                      % */}
                      {(((parseFloat(itm?.balance) * parseFloat(itm?.coin?.fiat_price_data?.value || 0)) / portfolioBalance) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="coinsTable1__right">
                <span style={{ color: "#FFFFFF" }}>
                  {currency?.symbol}{(parseFloat(itm?.balance) * parseFloat(itm?.coin?.fiat_price_data?.value || 0)).toFixed(2)}
                </span>



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
