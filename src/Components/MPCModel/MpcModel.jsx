import { useEffect, useState } from "react";
import { message } from "antd";
import Cross from "../../Assets/PNG/Cross.png";
import Tick from "../../Assets/PNG/TickImg.png";
import InputFieldSimple from "../InputField/InputFieldSimple";
import ButtonComp from "../ButtonComp/ButtonComp";
import ModalCustom from "../ModalCustom/ModalCustom";
import { ensureMpcAddresses, getStoredMpcAddresses } from "../../helpers/mpc.helper";
import { WalletHelper } from "../../helpers/wallet.helper";
import { store } from "../..";
import { setLoading } from "../../actions/loading";

export default function MpcModel({ showModal = true, onClose, currentEthAddress }) {
  const [showAbstraction, setShowAbstraction] = useState(showModal); // show based on prop
  const [showCongrats, setShowCongrats] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [addresses, setAddresses] = useState({ eth: null, btc: null });
  const [sessionPassword, setSessionPassword] = useState(null);
  const [isModalOpen, setConfirmModal] = useState(false);
  const [messageApi, contextHolder] = message.useMessage({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await getStoredMpcAddresses();
        if (!mounted) return;
        if (stored?.eth || stored?.btc) {
          setAddresses({ eth: stored.eth || null, btc: stored.btc || null });
        }
      } catch (e) {
        // ignore; will be populated after generation
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(()=>{
    (async () => {
      try {
        const stored = await getStoredMpcAddresses();
        // console.log('[MPC:UI] useEffect - stored addresses:', stored);
        if (stored?.eth || stored?.btc) {
          setAddresses({ eth: stored.eth || null, btc: stored.btc || null });
        }
      } catch (e) {
        // console.error('[MPC:UI] useEffect error:', e);
        // ignore; will be populated after generation
      }
    })();
  },[showCongrats])

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerateAddresses = async (password) => {
    try {
      // console.log('[MPC:UI] Generating addresses with password');
      const ensured = await ensureMpcAddresses(currentEthAddress, password);
      // console.log('[MPC:UI] Ensured addresses (modal):', ensured);
      
      // Wait a bit for storage to be updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stored = await getStoredMpcAddresses();
      // console.log('[MPC:UI] Stored addresses (modal):', stored);
      
      // Use ensured addresses if stored is empty, otherwise use stored
      const finalAddresses = stored?.eth || stored?.btc ? stored : ensured;
      // console.log('[MPC:UI] Final addresses to set:', finalAddresses);
      
      setAddresses({ 
        eth: finalAddresses?.eth || null, 
        btc: finalAddresses?.btc || null 
      });
      
      setShowCongrats(true);
    } catch (e) {
      // console.error('[MPC:UI] Generation failed:', e?.message || e);
      messageApi.error('Failed to generate addresses. Please try again.');
      setAddresses({ eth: null, btc: null });
    }
  };

  return (
    <>
      {/* Chain Abstraction Modal */}
      {showAbstraction && (
        <div
          style={{
            position: "fixed", // fixed to viewport
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // zIndex: 9999 ,              // very high to overlay everything
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1e1e3f 0%, #2a2a4e 100%)",
              borderRadius: "20px",
              padding: "30px",
              maxWidth: "380px",
              width: "79%",
              maxHeight: "90vh",
              position: "relative",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5 )",
              overflow: "auto",
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowAbstraction(false);
                if (onClose) onClose(false);
              }}
              style={{
                position: "absolute",
                top: "4px",
                right: "20px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "white",
              }}
            >
              <img src={Cross} alt="Close" style={{ width: 18, height: 18 }} />
            </button>

            <h2
              style={{
                color: "white",
                fontSize: "24px",
                fontWeight: "700",
                textAlign: "center",
                marginBottom: "12px",
              }}
            >
              Chain Abstraction Protocol
            </h2>

            <p
              style={{
                color: "#a0a0c0",
                fontSize: "14px",
                textAlign: "center",
                marginBottom: "30px",
                lineHeight: "1.6",
              }}
            >
              Your abstracted wallet isn't set up yet. Generate your addresses now to unlock seamless cross-chain transfers.
            </p>

            <button
              onClick={() => {
                // console.log('[MPC:UI] Generate Addresses clicked');
                setShowAbstraction(false);
                setSessionPassword('');
                setConfirmModal(true);
              }}
              style={{
                width: "100%",
                padding: "16px",
                background:
                  "linear-gradient(90deg, #73c9e2, #6c8dc5 25.37%, #6456b2 76.11%, #6145ea 101.48%)",
                border: "none",
                borderRadius: "12px",
                color: "white",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(79, 172, 254, 0.4)",
              }}
            >
              Generate Addresses
            </button>
          </div>
        </div>
      )}

      {/* Congratulations Modal */}
      {showCongrats && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1e1e3f 0%, #2a2a4e 100%)",
              borderRadius: "20px",
              padding: "30px",
              maxWidth: "380px",
              width: "90%",
              maxHeight: "91vh",
              position: "relative",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
              overflow: "auto",
            }}
          >
            <button
              onClick={() => {
                setShowCongrats(false);
                if (onClose) onClose(true);
              }}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "white",
              }}
            >
              <img src={Cross} alt="Close" style={{ width: 18, height: 18 }} />
            </button>

            {/* Success Icon - Tick image */}
            <div style={{ display: "flex", justifyContent: "center", margin: "0 auto 30px" }}>
              <img src={Tick} alt="Success" style={{ width: 111, height: 111, objectFit: "contain" }} />
            </div>

            <h2
              style={{
                color: "white",
                fontSize: "24px",
                fontWeight: "700",
                textAlign: "center",
                marginBottom: "12px",
              }}
            >
              Congratulations
            </h2>

            <p
              style={{
                color: "#e0e0f0",
                fontSize: "15px",
                textAlign: "center",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              Your abstraction wallet address was created successfully and is now ready for use
            </p>

            <p
              style={{
                color: "#a0a0c0",
                fontSize: "13px",
                textAlign: "center",
                marginBottom: "30px",
                lineHeight: "1.5",
              }}
            >
              To begin seamless cross-chain transfers, fund the following wallet addressed from the Qubetics wallet or an external wallet.
            </p>

            {/* Addresses */}
            {["eth", "btc"].map((key) => (
              <div key={key} style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    color: "#a0a0c0",
                    fontSize: "12px",
                    fontWeight: "600",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  {key.toUpperCase() === "ETH" ?  "TICS" : "BTC"} Address
                </label>
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      color: "white",
                      fontSize: "13px",
                      fontFamily: "monospace",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}
                  >
                    {addresses?.[key] || "Not available yet"}
                  </span>
                  <button
                    onClick={() => addresses?.[key] && copyToClipboard(addresses[key], key)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      marginLeft: "12px",
                      color: copiedField === key ? "#4facfe" : "#a0a0c0",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect
                        x="9"
                        y="9"
                        width="13"
                        height="13"
                        rx="2"
                        ry="2"
                      ></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            <button
              className="continue-btn"
              style={{
                width: "100%",
                padding: "16px",
                background:
                  "linear-gradient(90deg, #73c9e2, #6c8dc5 25.37%, #6456b2 76.11%, #6145ea 101.48%)",
                border: "none",
                borderRadius: "12px",
                color: "white",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(79, 172, 254, 0.4)",
              }}
              onClick={() => {
                // console.log('[MPC:UI] Continue clicked, closing modal');
                setShowCongrats(false);
                if (onClose) onClose(true);
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {contextHolder}
      <ModalCustom
        title={'Verify Password'}
        handleCancel={() => {
          setConfirmModal(!isModalOpen);
          if (onClose) onClose(false);
        }}
        isModalOpen={isModalOpen}
        customClass="customClassModal"
      >
        <div className="viewphrases">
          <InputFieldSimple
            placeholder="Enter Password"
            value={sessionPassword}
            getData={(value) => {
              const hasEmoji = /[\p{Extended_Pictographic}]/u.test(value);
              if (value.length <= 100 && !hasEmoji) {
                setSessionPassword(value);
              }
            }}
            customFunction={async () => {
              if (!sessionPassword) {
                return messageApi.error('Please enter password.');
              }
              const res = await WalletHelper.verifyPassword(sessionPassword);
              if (!res) {
                return messageApi.error(
                  'Please enter valid password to proceed.'
                );
              }
              setConfirmModal(!isModalOpen);
              store.dispatch(setLoading(true));
              await handleGenerateAddresses(sessionPassword);
              store.dispatch(setLoading(false));
            }}
          />
          <div style={{ marginTop: '10px' }}></div>
          <ButtonComp
            text={'Submit'}
            maxWidth={'100%'}
            onClick={async () => {
              if (!sessionPassword) {
                return messageApi.error('Please enter password.');
              }
              const res = await WalletHelper.verifyPassword(sessionPassword);
              if (!res) {
                return messageApi.error(
                  'Please enter valid password to proceed.'
                );
              }
              setConfirmModal(!isModalOpen);
              store.dispatch(setLoading(true));
              await handleGenerateAddresses(sessionPassword);
              store.dispatch(setLoading(false));
            }}
          />
        </div>
      </ModalCustom>
    </>
  );
}
