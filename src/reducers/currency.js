const currencyReducer = (state = null, action) => {
  switch (action.type) {
    case "SET_CURRENCY":
      return action.payload;
    default:
      return state;
  }
};

export default currencyReducer