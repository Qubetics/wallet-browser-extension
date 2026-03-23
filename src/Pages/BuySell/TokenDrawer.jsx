import React from 'react';
import Drawer from 'antd/lib/drawer';
import { InputField } from '../../Components/InputField/InputFieldSimple';
import SearchIcon from '../../Assets/SearchIcon.svg';
import ModalCloseIcon from '../../Assets/ModalCloseIcon.svg';
import darkclose from '../../Assets/darkclose.svg';

const TokenDrawer = ({
    open,
    onClose,
    tokens,
    keyword,
    setKeyword,
    handleSearch,
    handleSelectToken,
    theme,
    sel,
    loading
}) => {
    // console.log(tokens, "Available Tokens");

    return (
        <Drawer
            title="Select Token"
            placement="bottom"
            onClose={() => {
                onClose();
                setKeyword('');
            }}
            open={open}
            closeIcon={
                theme === 'darkTheme' ? (
                    <img src={darkclose} alt="Close Icon" />
                ) : (
                    <img src={darkclose} alt="Close Icon" />
                )
            }
            height={500}
        >
            <div
                className="contain"
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Search Input Field */}
                <div className="search" style={{ marginBottom: '30px' }}>
                    <InputField
                        placeholder="Search..."
                        coloredBg="#eef3f9"
                        value={keyword}
                        checkForSymbols
                        getData={handleSearch}
                        addonBefore={
                            <span>
                                <img
                                    src={SearchIcon}
                                    style={{ width: '17px' }}
                                    alt="Search Icon"
                                />
                            </span>
                        }
                    />
                </div>

                {/* Token List */}
                <div
                    className="right"
                    style={{
                        flex: 1,
                        overflow: 'scroll',
                    }}
                >
                    {tokens && tokens.length > 0 ? (
                        tokens.map((token) => (
                            <div
                                key={token.uuid || token.coin_id || token.currency_id}
                                className="design"
                                style={{
                                    width: '100%',
                                }}
                                onClick={() => { handleSelectToken(token); setKeyword(''); }}
                            >
                                <div
                                    className="token"
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'flex-start',
                                        alignItems: 'center',
                                        marginBottom: '20px',
                                        padding: '8px',
                                        borderRadius: '30px',
                                        marginLeft: '7px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {sel == 0 ?
                                        <>
                                            {token.coin_image || token.image ? (
                                                <img
                                                    style={{
                                                        width: '29px',
                                                        marginRight: '15px',
                                                    }}
                                                    src={token.coin_image || token.image}
                                                    alt={token.coin_name || token.currency_name}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        alignItems: 'center',
                                                        backgroundColor: 'rgba(98,126,234,.2)',
                                                        borderRadius: '49%',
                                                        display: 'flex',
                                                        height: '29px',
                                                        justifyContent: 'center',
                                                        width: '29px',
                                                        marginRight: '15px',
                                                    }}
                                                >
                                                    {(token.coin_name || token.currency_name)?.[0] || 'N/A'}
                                                </div>
                                            )}

                                            {/* Token Name and Symbol */}
                                            <p>
                                                <span
                                                    style={{ fontSize: '17px' }}
                                                    className="noAddress"
                                                >
                                                    {token.coin_name || token.currency_name}
                                                </span>
                                                <span
                                                    className="noAddress"
                                                    style={{
                                                        fontSize: '11px',
                                                        marginLeft: '5px',
                                                    }}
                                                >
                                                    {token.coin_symbol || token.currency_symbol
                                                        ? ` / ${token.coin_symbol || token.currency_symbol}`
                                                        : null}
                                                </span>
                                            </p>
                                        </> : <>




                                            {token?.coin?.coin_image ? (
                                                <img
                                                    style={{
                                                        width: '29px',
                                                        marginRight: '15px',
                                                    }}
                                                    src={token?.coin?.coin_image}
                                                    alt={token?.coin?.coin_name || token?.coin?.currency_name}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        alignItems: 'center',
                                                        backgroundColor: 'rgba(98,126,234,.2)',
                                                        borderRadius: '49%',
                                                        display: 'flex',
                                                        height: '29px',
                                                        justifyContent: 'center',
                                                        width: '29px',
                                                        marginRight: '15px',
                                                    }}
                                                >
                                                    {(token?.coin?.coin_name || token?.coin?.currency_name)?.[0] || 'N/A'}
                                                </div>
                                            )}

                                            {/* Token Name and Symbol */}
                                            <p>
                                                <span
                                                    style={{ fontSize: '17px' }}
                                                    className="noAddress"
                                                >
                                                    {token?.coin?.coin_name || token?.coin?.currency_name}
                                                </span>
                                                <span
                                                    className="noAddress"
                                                    style={{
                                                        fontSize: '11px',
                                                        marginLeft: '5px',
                                                    }}
                                                >
                                                    {token?.coin?.coin_symbol || token?.coin?.currency_symbol
                                                        ? ` / ${token?.coin?.coin_symbol || token?.coin?.currency_symbol}`
                                                        : null}
                                                </span>
                                            </p>


                                        </>}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div
                            style={{
                                textAlign: 'center',
                            }}
                        >
                            <p
                                className="noAddress"
                                style={{
                                    marginTop: '4%',
                                    marginBottom: '15px',
                                    fontWeight: 'bold',
                                    fontSize: '15px',
                                }}
                            >
                                {loading ? 'Loading...' : 'No assets found'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Drawer>
    );
};

export default TokenDrawer;
