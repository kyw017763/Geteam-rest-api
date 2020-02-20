import crypto from 'crypto';

export default function createKey() {
  const firstKey = crypto.randomBytes(256).toString('hex').substr(100, 5);
  const secondKey = crypto.randomBytes(256).toString('base64').substr(50, 5);
  return firstKey + secondKey;
}
