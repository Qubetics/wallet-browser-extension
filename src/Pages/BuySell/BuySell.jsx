import React, { useState, useEffect } from 'react';
import Buy from './Buy';
import Sell from './Sell';
import 'react-tabs/style/react-tabs.css';
import './BuySell.scss';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import { useSelector } from 'react-redux';
import { Tabs, TabList, Tab } from 'react-tabs';
import { server } from '../../server';


const BuySell = () => {
    const {  account} = useSelector((state) => state);
    const [selectedTab, setSelectedTab] = useState(0);
    const [coins, setCoins] = useState([]);
    const [fiats, setFiats] = useState([]);
    const [loading, setLoading] = useState(false);


    const init = async () => {
        setLoading(true);
        try {
            const { data } = await server.post(
                `/wallet/buy-sell-coins`,
                { addresses: [account.address] },
                { headers: { Authorization: account.jwtToken } }
            );
            setCoins(data.coins || []); 
            setFiats(data.fiats || []); 
            console.log(data,"datadatadatadatadata");
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        init();
    }, []);
  

    return (
        <div className={`scrollableCont`}>
            <MenuRestofHeaders backTo={'/wallet'} title={'Buy Sell'} />
            <div className="flexedContent">
                <Tabs
                    selectedIndex={selectedTab}
                >
                    <TabList className="swapTabList"
                        style={{
                            border: 'none',
                            borderRadius: '30px',
                            display: 'flex',
                            justifyContent: 'space-evenly',
                            listStyle: 'none',
                        }}
                    >
                        <Tab
                            onClick={(e) => {
                                e.preventDefault();
                                setSelectedTab(0);
                            }}
                            style={{
                                backgroundColor: selectedTab === 0 ? '#4096ff' : 'transparent',
                                borderRadius: '30px',
                                padding: '16px 30px',
                                fontSize: '13px',
                                flex: 1,
                                borderColor: '#4096ff',
                                fontWeight: '700',
                            }}
                            className="swapTab"
                        >
                            Buy
                        </Tab>
                        <Tab
                            onClick={(e) => {
                                e.preventDefault();
                                setSelectedTab(1);
                            }}
                            className="swapTab"
                            style={{
                                backgroundColor: selectedTab === 1 ? '#4096ff' : 'transparent',
                                borderRadius: '30px',
                                padding: '16px 30px',
                                fontSize: '13px',
                                flex: 1,
                                borderColor: '#4096ff',
                                fontWeight: '700',
                            }}
                        >
                            Sell
                        </Tab>
                    </TabList>

                    <div className="tabContent">
                        {selectedTab === 0 && <Buy fiats={fiats} coins={coins} loading={loading} />}
                        {selectedTab === 1 && <Sell fiats={fiats} coins={coins} loading={loading} />}
                    </div>
                </Tabs>
            </div>
        </div>
    );
};

export default BuySell;
