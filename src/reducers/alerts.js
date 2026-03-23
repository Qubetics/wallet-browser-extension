const alertsReducer = (state = [], action) => {
  switch (action.type) {
    case "SET_ALERTS":
      return action.payload;
    default:
      return state;
  }
};

export default alertsReducer