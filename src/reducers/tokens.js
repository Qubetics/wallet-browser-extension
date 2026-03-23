const tokensReducer = (state = [], action) => {
  switch (action.type) {
    case "TOKENS":
      return action.payload;
    default:
      return state;
  }
};

export default tokensReducer;
