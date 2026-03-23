// import { useState, useEffect } from "react";
// import { useSelector } from "react-redux";

// const url = `${process.env.REACT_APP_BASE_URL}/wallet/check_app_maintenance`;

// export default async function useCheckMaintanace() {
//   const { deviceId } = await chrome.storage.local.get("deviceId");
//   const { account } = useSelector((state) => state);
//   const [isInMaintanace, setIsInMaintanace] = useState(false);

//   const checkStatus = async () => {
//     let response = await `fetch`(url, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: account.jwtToken,
//         device_id: deviceId,
//       },
//       //   body: JSON.stringify(data),
//     });
//     let json = await response.json();
//     console.log("JSONNNNNNNNNN ", json);
//     return json;
//   };

//   useEffect(() => {
//     checkStatus();
//     return () => {
//       setIsInMaintanace(false);
//     };
//   }, []);

//   return isInMaintanace;
// }
