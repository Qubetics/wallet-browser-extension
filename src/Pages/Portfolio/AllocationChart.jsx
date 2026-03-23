import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { useSelector } from 'react-redux';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import { server } from '../../server';

const stringToColour = function (name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const r = (hash & 0x3f) + 96;
  const g = ((hash >> 5) & 0x3f) + 96;
  const b = ((hash >> 10) & 0x7f) + 160;

  return `#${('00' + r.toString(16)).slice(-2)}${('00' + g.toString(16)).slice(
    -2
  )}${('00' + b.toString(16)).slice(-2)}`;
};

const getTokenTypeLabel = (coinFamily) => {
  switch (coinFamily) {
    case 1:
      return 'BEP20';
    case 5:
      return 'SPL';
    case 2:
    case 4:
    case 7:
      return 'ERC20';
    default:
      return '';
  }
};

const AllocationChart = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [portfolioBalance, setPortfolioBalance] = useState(0);
  const [labels, setLabels] = useState([]);
  const [chartSeries, setChartSeries] = useState([]);
  const { account, currency, balanceIn, loading } = useSelector(
    (state) => state
  );
  const [namesWithPercentages, setNamesWithPercentages] = useState([]);

  const [chartOptions, setChartOptions] = useState({
    chart: {
      type: 'donut',
    },
    stroke: {
      show: true,
      curve: 'straight',
      lineCap: 'butt',
      colors: ['#000'],
      width: 1,
    },
    labels: [],
    plotOptions: {
      pie: {
        donut: {
          size: '55%',
          labels: {
            total: {
              label: 'Total',
              formatter: () =>
                `${currency?.symbol || ''} ${portfolioBalance.toFixed(2)}`,
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: 'right',
      labels: {
        colors: '#fff',
        fontSize: '12px',
        // useSeriesColors: true, // Use series colors for legend items
      },
      formatter: function (seriesName, opts) {
        const index = opts.w.globals.seriesNames.indexOf(seriesName);
        return namesWithPercentages[index]; // Show names with percentages
      },
    },
    tooltip: {
      y: {
        formatter: (val) => `${val.toFixed(2)}%`,
      },
    },
  });

  const fetchPortfolio = async () => {
    try {
      store.dispatch(setLoading(true));
      const { data } = await server.post(
        `/wallet/portfolio`,
        {
          page: 1,
          limit: 100,
          coin_family: account?.coinFamilies,
          search: '',
          addressListKeys: account?.addressLists?.slice(0, 6),
          fiat_type: currency?.name,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      const portfolioData = data?.data || [];

      const filteredPortfolio = portfolioData.filter(
        (item) => item.balance > 0
      );

      setPortfolio(filteredPortfolio);

      const totalBalance = portfolioData.reduce(
        (acc, obj) =>
          acc +
          parseFloat(obj?.balance) *
            parseFloat(obj?.coin?.fiat_price_data?.value || 0),
        0
      );

      if (totalBalance === 0) {
        setPortfolioBalance(0);
        setChartSeries([]);
        setLabels([]);
        store.dispatch(setLoading(false));
        return;
      }

      const percentages = portfolioData
        .filter((obj) => parseFloat(obj?.balance) > 0 && obj?.balance !== null)
        .map((obj) => ({
          name: obj?.coin?.coin_name || 'Unknown',
          symbol: obj?.coin?.coin_symbol || 'Unknown',
          percentage:
            ((parseFloat(obj?.balance) *
              parseFloat(obj?.coin?.fiat_price_data?.value || 0)) /
              totalBalance) *
            100,
        }));

      const names = percentages.map((item) => item.name);
      const series = percentages.map((item) => parseFloat(item.percentage));
      const namesWithPercentages = percentages.map(
        (item) =>
          `${
            item.name.length > 6 ? item.name.slice(0, 6) + `...` : item.name
          } ${item.percentage.toFixed(2)}%`
      );

      setNamesWithPercentages(namesWithPercentages);

      setLabels(names);
      setChartSeries(series);
      setPortfolioBalance(totalBalance);

      const chartColors = percentages.map((_, index) =>
        stringToColour(_?.name)
      );

      setChartOptions((prev) => {
        return {
          ...prev,
          labels: names,
          colors: chartColors,
          legend: {
            ...prev.legend,
            labels: {
              ...prev.legend.labels,
              fontSize: '12px',
            },
            formatter: function (seriesName, opts) {
              const index = opts.seriesIndex;
              return namesWithPercentages[index]; // Use namesWithPercentages for the legend
            },
          },
        };
      });

      store.dispatch(setLoading(false));
    } catch (error) {
      // console.error('Portfolio fetch error:', error);
      store.dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  useEffect(() => {
    if (!chartSeries.length || chartSeries.every((val) => val === 0)) {
      setChartOptions((prev) => ({
        ...prev,
        colors: ['#1413132e'],
        labels: ['No Data'],
      }));
      setChartSeries([100]);
    }
  }, [chartSeries]);

  return (
    <div
      className="allocation-chart"
      style={{
        color: '#fff',
        margin: '0 auto',
      }}
    >
      <div className="chartBalance">
        <h3>
          <span>Total Balance:</span>
        </h3>
        <h1>
          {balanceIn ? currency?.symbol : ''}{' '}
          {balanceIn ? portfolioBalance.toFixed(2) : '****'}
        </h1>
      </div>
      <div
        style={{
          position: 'relative',
          overflow: 'visible',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {portfolioBalance > 0 && (
          <Chart
            options={chartOptions}
            series={chartSeries}
            type="donut"
            width="380"
            height=""
          />
        )}
      </div>
      <div className="cryptoSec">
        <h4>Crypto's</h4>
        {/* <img style={{ cursor: "pointer" }} src={CryptoS} alt="SearchIcon" /> */}
      </div>
      <ul className="portfolio__tableOuter ">
        {portfolioBalance > 0 ? (
          portfolio.map((itm, idx) => (
            <li key={idx} className="coinsTable1 flex-item">
              <div className="coinsTable1__left">
                <div className="coinsTable1__left__icon">
                  {itm?.coin?.coin_image ? (
                    <img
                      style={{ height: 35, width: 35, borderRadius: 50 }}
                      src={itm?.coin?.coin_image}
                      alt=""
                    />
                  ) : (
                    <div
                      className="randb extra borderDarkLight"
                      style={{
                        color: 'black',
                        height: '30px',
                        width: '30px',
                        background: 'rgb(202, 201, 201)',
                        borderRadius: '50%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        border: '1px solid',
                        fontWeight: 'bold',
                      }}
                    >
                      {itm?.coin?.coin_symbol.split('')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="coinsTable1__left__textSec">
                  <div className="coinsTable1__textTop">
                    <span
                      className="coinNname"
                      style={{
                        width: '100%',
                        maxWidth: '190px',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {`${itm?.coin?.coin_name || itm?.coin?.coin_symbol?.toUpperCase() || 'Unknown'}${
                        itm?.coin?.token_address
                          ? ` /${getTokenTypeLabel(itm?.coin?.coin_family)}`
                          : ''
                      }`}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: '#98969B' }}>Percentage</span>
                    <span style={{ color: '#7DB0FF', marginLeft: '5px' }}>
                      {portfolioBalance &&
                        (
                          ((parseFloat(itm?.balance) *
                            parseFloat(
                              itm?.coin?.fiat_price_data?.value || 0
                            )) /
                            portfolioBalance) *
                          100
                        ).toFixed(2)}
                      %
                    </span>
                  </div>
                </div>
              </div>
              <div className="coinsTable1__right">
                <span style={{ color: '#FFFFFF' }}>
                  {balanceIn ? currency?.symbol : ''}
                  {balanceIn
                    ? (
                        parseFloat(itm?.balance) *
                        parseFloat(itm?.coin?.fiat_price_data?.value || 0)
                      ).toFixed(2)
                    : '****'}
                </span>

                <span>
                  <span style={{ color: '#98969B', marginLeft: '5px' }}>
                    Amount
                  </span>
                </span>
              </div>
            </li>
          ))
        ) : (
          <>
            {loading ? (
              <p
                className="noAddress"
                style={{
                  marginTop: '50%',
                  fontWeight: 'bold',
                  fontSize: '17px',
                }}
              >
                Loading...
              </p>
            ) : (
              <p
                className="noAddress"
                style={{
                  marginTop: '50%',
                  fontWeight: 'bold',
                  fontSize: '17px',
                }}
              >
                No Assets Found
              </p>
            )}
          </>
        )}
      </ul>
    </div>
  );
};

export default AllocationChart;
