const swapDetailReducer = (state = null, action) => {
  switch (action.type) {
    case "SWAP_DETAIL_NAV": {
      console.log("reducer payloaddddddd ", action);
      return action.payload;
    }
    default:
      return state;
  }
};

export default swapDetailReducer;
