const spritzFilterReducer = (state = null, action) => {
  switch (action.type) {
    case "SET_SPRITZ_FILTER":
      return action.payload;
    default:
      return state;
  }
};

export default spritzFilterReducer;
