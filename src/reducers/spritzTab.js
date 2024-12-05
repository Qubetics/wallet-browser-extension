const spritzTabReducer = (state = "billpay", action) => {
  switch (action.type) {
    case "SPRITZ_SELECTED_TAB":
      return action?.payload;
    default:
      return state;
  }
};

export default spritzTabReducer;
