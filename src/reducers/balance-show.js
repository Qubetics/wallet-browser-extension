const BalanceShowOutReducer = (state = true, action) => {
  switch (action.type) {
    case "SET_OUT":
      return action.payload;
    default:
      return state;
  }
};

export default BalanceShowOutReducer;
