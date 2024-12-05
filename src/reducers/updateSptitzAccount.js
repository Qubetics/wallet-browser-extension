const updateSpritzReducer = (state = null, action) => {
  switch (action.type) {
    case "UPDATE_SPRITZ_ACCOUNT":
      return action.payload;
    default:
      return state;
  }
};

export default updateSpritzReducer;
