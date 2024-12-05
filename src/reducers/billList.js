

const billListReducer = (state = false, action) => {
    switch (action.type) {
      case "SET_BILL_LIST":
        return action.payload;
      default:
        return state;
    }
  };
  
  export default billListReducer;
  