const nftsReducer = (state = [], action) => {
  switch (action.type) {
    case 'NFTS':
      return action.payload;
    default:
      return state;
  }
};

export default nftsReducer;
