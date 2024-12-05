/*global chrome*/

import { MESSAGE_TYPE } from "../constants/app";

const handle = (method, data) => {
  switch (method) {
    case MESSAGE_TYPE.ETH_ACCOUNTS:
      break;

    default:
      return false;
  }
};
