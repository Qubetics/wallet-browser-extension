import crypto from 'crypto-browserify';
const CryptoJS = require('crypto-js');
const Buffer = require('safe-buffer').Buffer;


export class SecurityHelper {
  static KEY_SIZE = 32; // 256-bit key
  static IV_SIZE = 12; // 96-bit IV for GCM
  static TAG_SIZE = 16; // 128-bit Auth Tag
  static PBKDF2_ITERATIONS = 100000;

  /**
   * Encrypts data using AES-256-GCM with PBKDF2 key derivation
   * @param {any} payload - Data to encrypt
   * @param {string} password - Encryption password
   * @returns {string} Base64-encoded string of: salt + iv + ciphertext + authTag
   */
  static encrypt(payload, password) {
    const salt = Buffer.from(
      CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex),
      'hex'
    );
    const iv = crypto.randomBytes(this.IV_SIZE);
    const key = crypto.pbkdf2Sync(password, salt, this.PBKDF2_ITERATIONS, this.KEY_SIZE, 'sha256');
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const data = Buffer.from(JSON.stringify(payload));
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const result = Buffer.concat([salt, iv, encrypted, authTag]);
    return result.toString('base64');
  }

  /**
   * Decrypts data encrypted with AES-256-GCM
   * @param {string} payload - Base64-encoded encrypted data
   * @param {string} password - Decryption password
   * @returns {any|boolean} Decrypted JSON string or false on failure
   */
  static decrypt(payload, password) {
    try {
      const rawData = Buffer.from(payload, 'base64');

      const salt = rawData.slice(0, 16);
      const iv = rawData.slice(16, 28);
      const authTag = rawData.slice(rawData.length - this.TAG_SIZE);
      const ciphertext = rawData.slice(28, rawData.length - this.TAG_SIZE);

      const key = crypto.pbkdf2Sync(password, salt, this.PBKDF2_ITERATIONS, this.KEY_SIZE, 'sha256');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return decrypted.toString();
    } catch (err) {
      return false;
    }
  }
}