const BalanceShowInReducer = (state = true, action) => {
  switch (action.type) {
    case "SET_IN":
      return action.payload;
    default:
      return state;
  }
};

export default BalanceShowInReducer;
