const accountReducer = (state = null, action) => {
  switch (action.type) {
    case "ACCOUNT":
      return action.payload;
    default:
      return state;
  }
};

export default accountReducer