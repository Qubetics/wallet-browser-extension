const pricesReducer = (state = null, action) => {
  switch (action.type) {
    case "SET_PRICES":
      return action.payload;
    default:
      return state;
  }
};

export default pricesReducer