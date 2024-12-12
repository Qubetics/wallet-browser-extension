import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { useSelector } from "react-redux";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { server } from "../../server";

const AllocationChart = () => {
    const [portfolio, setPortfolio] = useState([]);
    const [portfolioBalace, setPortfolioBalace] = useState(0);
    const [labels, setLabels] = useState(['ETH', 'BNB', 'SOL', 'BTC', 'POL']);
    const [chartSeries, setChartSeries] = useState([10, 15, 25, 20, 30]);
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
                    search: '',
                    addressListKeys: account?.addressLists,
                    fiat_type: currency?.name,
                },
                {
                    headers: {
                        Authorization: account.jwtToken,
                    }
                }
            );

            const totalBalance = data?.data.reduce((acc, obj) => acc + obj?.balance, 0);

            // Check if totalBalance is valid
            if (totalBalance == 0) {
                console.error('Total balance is zero. Cannot calculate percentages.');
                setPortfolioBalace(0);
                store.dispatch(setLoading(false));
                return;
            }
             
            const percentages = data?.data.map(obj => {
                return {
                    name: obj?.coin?.coin_symbol,
                    percentage: ((obj?.balance / totalBalance == 0 ? 1 : totalBalance) * 100).toFixed(2),
                };
            });

            const names = percentages.map(item => item.name.toUpperCase());
            const percentagesArr = percentages.map(item => parseFloat(item.percentage));
 
            // Update labels and series dynamically
            setLabels(names);
            setChartSeries(percentagesArr);
            setPortfolioBalace(totalBalance);
            setPortfolio(data?.data);

            // Update chart options with new labels
            setChartOptions((prevOptions) => ({
                ...prevOptions,
                labels: names
            }));

            store.dispatch(setLoading(false));

        } catch (error) {
            console.log('Portfolio error: ', error);
            store.dispatch(setLoading(false));
        }
    };

    useEffect(() => {
        init();
    }, []);

    return (
        <div className="allocation-chart" style={{ position: "relative", color: "#fff", maxWidth: "400px", margin: "0 auto" }}>
            <Chart options={chartOptions} series={chartSeries} type="donut" height={150} />

            {/* Custom text in the center of the chart */}
            <div
                style={{
                    position: "absolute",
                    top: "29%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                }}
            >
                <span style={{ fontSize: "14px", fontWeight: "400", color: "#b0b0b0" }}>Assets</span>
                <br />
                <span style={{ fontSize: "16px", fontWeight: "bold", color: "#b0b0b0" }}>Allocation</span>
            </div>

            {/* Total Invested Amount */}
            <div style={{ textAlign: "center", marginTop: "20px", color: "#fff" }}>
                <h3 style={{ fontWeight: "500", fontSize: "18px" }}>
                    <span style={{ color: "#2ec4b6" }}> Total Invested Amount:</span> <span style={{ color: "#2ec4b6" }}>
                        {currency?.symbol} {portfolioBalace.toFixed(2)}
                    </span>
                </h3>
            </div>

            {/* Asset details */}
            <div style={{ display: "flex", flexDirection: "column", marginTop: "20px", color: "#fff" }}>
                {portfolio && portfolio.map((itm, idx) => (
                    <div key={idx} style={{ color: "#FF9900", display: "flex", justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', margin: "20px 5px" }}>
                            <span>{itm?.coin?.coin_symbol?.toUpperCase()}</span>
                            <span>{((itm?.balance / (portfolioBalace === 0 ? 1 : portfolioBalace)) * 100).toFixed(2)}%</span>
                        </div>
                        <div>{itm?.balance}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AllocationChart;