const billPaySpritzFilterReducer = (state = null, action) => {
    switch (action.type) {
      case "SET_BILL_PAY_SPRITZ_FILTER":
        return action.payload;
      default:
        return state;
    }
  };
  
  export default billPaySpritzFilterReducer;
  