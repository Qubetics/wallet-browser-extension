import axios from "axios";

export class UnstoppableDomainHelper {
  static findAddress = async (name, chainSymbol) => {
    try {
      const { data } = await axios.get(
        `https://resolve.unstoppabledomains.com/records?domains=${name}`,
        {
          headers: {
            Authorization: "Bearer REDACTED",
          },
        }
      );

      const records = data.data[0].records;
      const address = records[`crypto.${chainSymbol}.address`];

      if(!address) {
        throw new Error()
      }

      return {
        status: true,
        address: address,
      };
    } catch (error) {
      return {
        status: false,
        address: null,
      };
    }
  };
}
