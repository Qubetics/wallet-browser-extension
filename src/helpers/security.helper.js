import * as AES from 'crypto-js/aes';
import * as UTF8 from 'crypto-js/enc-utf8';
import * as CryptoJS from 'crypto-js';

export class SecurityHelper {
  static encrypt = (payload, password) => {
    const iv = CryptoJS.lib.WordArray.random(16);
    const encryptedData = AES.encrypt(JSON.stringify(payload), password, {
      iv,
    });
    const combinedData = iv.toString() + encryptedData.toString();
    return combinedData;
  };

  static decrypt = (payload, password) => {
    try {
      // Extract the IV from the combined data
      const iv = CryptoJS.enc.Hex.parse(payload.substring(0, 32));

      // Extract the actual encrypted data
      const encryptedPayload = payload.substring(32);

      // Decrypt the payload using AES and the extracted IV
      const decryptedData = AES.decrypt(encryptedPayload, password, { iv });

      // Convert the decrypted data back to a string and parse as JSON
      const decryptedPayload = decryptedData.toString(CryptoJS.enc.Utf8)

      return decryptedPayload;
    } catch (error) {
      return false;
    }
  };
}
