const chainReducer = (state = null, action) => {
  
  switch (action.type) {
    case "SET_CHAIN":
      return action.payload;
    default:
      return state;
  }
};

export default chainReducer