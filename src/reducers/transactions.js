const transactionsReducer = (state = null, action) => {
  switch (action.type) {
    case "SET_TRANSACTIONS":
      return action.payload;
    default:
      return state;
  }
};

export default transactionsReducer