import React, { useState } from "react";
import Chart from "react-apexcharts";

const AllocationChart = () => {
    const [chartOptions] = useState({
        chart: {
            type: "donut",
        },
        labels: ["BTC", "Ethereum", "Solana", "Tether"],
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
        colors: ["#FF9900", "#4E5CC4", "#6F56F9", "#23D196"],
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

    const [chartSeries] = useState([44, 25, 15, 16]);

    return (
        <div className="allocation-chart" style={{ position: "relative", color: "#fff", maxWidth: "400px", margin: "0 auto" }}>
            <Chart options={chartOptions} series={chartSeries} type="donut" height={150} />

            {/* Custom text in the center of the chart */}
            <div
                style={{
                    position: "absolute",
                    top: "20%",
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
                    <span style={{ color: "#2ec4b6" }}> Total Invested Amount:</span> <span style={{ color: "#2ec4b6" }}>$2,36,540.00</span>
                </h3>
            </div>

            {/* Asset Categories */}
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: "20px", color: "#fff" }}>
                <div style={{ color: "#FF9900", textAlign: "center" }}>
                    <div>BTC</div>
                </div>
                <div style={{ color: "#4E5CC4", textAlign: "center" }}>
                    <div>Ethereum</div>
                </div>
                <div style={{ color: "#6F56F9", textAlign: "center" }}>
                    <div>Solana</div>
                </div>
                <div style={{ color: "#23D196", textAlign: "center" }}>
                    <div>Tether</div>
                </div>
            </div>

            {/* Asset details */}
            <div style={{ display: "flex", flexDirection: "column", marginTop: "20px", color: "#fff" }}>
                <div style={{ color: "#FF9900", display:"flex", justifyContent:'space-between' }}>
                    <div>BTC</div>
                    <div>112</div>
                </div>
                <div style={{ color: "#4E5CC4", display:"flex", justifyContent:'space-between' }}
                >
                    <div>Ethereum</div>
                    <div>521</div>
                </div>
                <div style={{ color: "#6F56F9", display:"flex", justifyContent:'space-between' }}
                >
                    <div>Solana</div>
                    <div>1006265</div>
                </div>
                <div style={{ color: "#23D196", display:"flex", justifyContent:'space-between' }}
                >
                    <div>Tether</div>
                    <div>54654897</div>
                </div>
            </div>
        </div>
    );
};

export default AllocationChart;
