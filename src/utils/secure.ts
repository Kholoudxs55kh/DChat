import * as crypto from 'crypto';

/**
 * Encrypts a message and signs it.
 * @param message - The message to encrypt.
 * @param receiverPublicKey - The receiver's public key in PEM format.
 * @param senderPrivateKey - The sender's private key in PEM format.
 * @returns An object containing the encrypted message and signature.
 */
export function encryptAndSignMessage(
  message: string,
  receiverPublicKey: string,
  senderPrivateKey: string
): { encryptedMessage: string; signature: string } {
  // Encrypt the message
  const bufferMessage = Buffer.from(message, 'utf-8');
  const encrypted = crypto.publicEncrypt(
    {
      key: receiverPublicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    bufferMessage
  );
  const encryptedMessage = encrypted.toString('base64');

  // Sign the message
  const signer = crypto.createSign('sha256');
  signer.update(bufferMessage);
  const signature = signer.sign(
    {
      key: senderPrivateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    },
    'base64'
  );

  return { encryptedMessage, signature };
}

/**
 * Decrypts a message and verifies its signature.
 * @param encryptedMessage - The encrypted message in base64 format.
 * @param receiverPrivateKey - The receiver's private key in PEM format.
 * @param senderPublicKey - The sender's public key in PEM format.
 * @param signature - The signature of the original message.
 * @returns The decrypted message if the signature is valid.
 * @throws Error if the signature is invalid.
 */
export function decryptAndVerifyMessage(
  encryptedMessage: string,
  receiverPrivateKey: string,
  senderPublicKey: string,
  signature: string
): string {
  // Decrypt the message
  const bufferEncrypted = Buffer.from(encryptedMessage, 'base64');
  const decrypted = crypto.privateDecrypt(
    {
      key: receiverPrivateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    bufferEncrypted
  );
  const decryptedMessage = decrypted.toString('utf-8');

  // Verify the signature
  const verifier = crypto.createVerify('sha256');
  verifier.update(decrypted);
  const isVerified = verifier.verify(
    {
      key: senderPublicKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    },
    signature,
    'base64'
  );

  if (!isVerified) {
    throw new Error(
      'Signature verification failed: The message may have been tampered with.'
    );
  }

  return decryptedMessage;
}
