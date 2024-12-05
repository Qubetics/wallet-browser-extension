const buyReducer = (state = false, action) => {
  switch (action.type) {
    case "SET_BUY":
      return action.payload;
    default:
      return state;
  }
};

export default buyReducer