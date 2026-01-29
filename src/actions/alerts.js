export const setAlerts = (alerts) => {
  // console.log(alerts)
  return {
    type: "SET_ALERTS",
    payload: alerts,
  };
};
