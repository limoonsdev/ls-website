import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.NEXT_PUBLIC_CRYPTO_SECRET || "PRIMEGEN_SECURE_PAYLOAD_2026";

export const encryptPayload = (data) => {
  const stringified = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(stringified, SECRET_KEY).toString();
};

export const decryptPayload = (encryptedText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    try {
      return JSON.parse(decryptedData);
    } catch (e) {
      return decryptedData;
    }
  } catch (error) {
    throw new Error("Failed to decrypt payload.");
  }
};

export const secureFetch = async (url, method = 'GET', data = null) => {
  const payload = {
    targetUrl: url,
    method: method,
    body: data
  };

  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: encryptPayload(payload)
  };

  const res = await fetch('/api/proxy', options);
  if (!res.ok) {
    // If it's an HTTP error from Next.js, we still want to return a Response to not crash logic
    return res; 
  }
  
  const encryptedRes = await res.text();
  if (!encryptedRes) return new Response(null, { status: res.status });
  
  const decryptedData = decryptPayload(encryptedRes);
  return new Response(typeof decryptedData === 'string' ? decryptedData : JSON.stringify(decryptedData), { status: res.status, headers: { 'Content-Type': 'application/json' } });
};
