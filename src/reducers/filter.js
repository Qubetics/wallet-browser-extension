const filterReducer = (
  state = {
    coinId: "all",
    status: "all",
    fromDate: null,
    toDate: null,
    type: "all",
  },
  action
) => {
  switch (action.type) {
    case "SET_FILTER":
      return action.payload;
    default:
      return state;
  }
};

export default filterReducer;
