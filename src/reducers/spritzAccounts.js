const spritzBankReducer = (state = [], action) => {
  switch (action.type) {
    case "SPRITZ_ACCOUNTS":
      return action.payload;
    default:
      return state;
  }
};

export default spritzBankReducer;
