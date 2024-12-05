const nftBackDataReducer = (state = null, action) => {
  switch (action.type) {
    case 'SET_NFT_BACK_DATA':
      return action.payload;
    default:
      return state;
  }
};

export default nftBackDataReducer;
