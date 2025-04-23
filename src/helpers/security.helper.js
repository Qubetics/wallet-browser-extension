const CryptoJS = require("crypto-js");

export class SecurityHelper {
  // Configuration constants
  static PBKDF2_ITERATIONS = 100000;
  static KEY_SIZE = 256 / 32; // 256-bit key
  static SALT_SIZE = 128 / 8; // 128-bit salt
  static IV_SIZE = 128 / 8; // 128-bit IV

  /**
   * Encrypts data using AES-256-CBC with PBKDF2 key derivation
   * @param {any} payload - Data to encrypt
   * @param {string} password - Encryption password
   * @returns {string} Encrypted data in format: salt:iv:ciphertext
   */
  static encrypt(payload, password) {
    // Generate random salt
    const salt = CryptoJS.lib.WordArray.random(this.SALT_SIZE);

    // Generate random IV
    const iv = CryptoJS.lib.WordArray.random(this.IV_SIZE);
    
    // Derive key using PBKDF2
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: this.KEY_SIZE,
      iterations: this.PBKDF2_ITERATIONS,
      hasher: CryptoJS.algo.SHA256
    });
    
    // Encrypt the data
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(payload), key, { 
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });
    
    // Combine salt, IV and ciphertext
    return salt.toString() + iv.toString() + encrypted.toString();
  }

  /**
   * Decrypts data encrypted with the above method
   * @param {string} payload - Encrypted data in format salt:iv:ciphertext
   * @param {string} password - Decryption password
   * @returns {any|boolean} Decrypted data or false if decryption fails
   */
  static decrypt(payload, password) {
    try {
      // Validate payload length (salt + iv = 64 hex chars)
      if (payload.length < 64) throw new Error('Invalid payload length');

      // Extract components from payload
      const salt = CryptoJS.enc.Hex.parse(payload.substring(0, 32));
      const iv = CryptoJS.enc.Hex.parse(payload.substring(32, 64));
      const ciphertext = payload.substring(64);
      
      // Derive key using same parameters
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: this.KEY_SIZE,
        iterations: this.PBKDF2_ITERATIONS,
        hasher: CryptoJS.algo.SHA256
      });
      
      // Decrypt the data
      const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
      });
      
      // Convert to UTF-8 and parse JSON
      const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
      if (!decryptedStr) throw new Error("Decryption failed - empty result");
      
      return decryptedStr;
    } catch (error) {
      return false;
    }
  }
}