const swapDetailReducer = (state = null, action) => {
  switch (action.type) {
    case "SWAP_DETAIL_NAV": {
      return action.payload;
    }
    default:
      return state;
  }
};

export default swapDetailReducer;
