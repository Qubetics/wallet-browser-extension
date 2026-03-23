const spritzReducer = (state = null, action) => {
  switch (action.type) {
    case 'SPRITZ_LOGIN':
      return action.payload;
    default:
      return state;
  }
};

export default spritzReducer;
