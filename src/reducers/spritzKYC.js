const spritzKycReducer = (state = null, action) => {
  switch (action.type) {
    case 'SPRITZ_KYC':
      return action.payload;
    default:
      return state;
  }
};

export default spritzKycReducer;
