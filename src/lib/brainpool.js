/**
 * Brainpool P-512 ECC implementation using elliptic library (pure JS fallback)
 * since Web Crypto API does not natively support Brainpool curves.
 *
 * We use the 'elliptic' approach via forge-like manual ASN.1 + a custom EC implementation.
 * To keep this dependency-free, we implement Brainpool P-512 on top of raw BigInt math.
 */

// Brainpool P-512 curve parameters (RFC 5639)
const BRAINPOOL_P512 = {
  name: "brainpoolP512r1",
  p: BigInt("0xAADD9DB8DBE9C48B3FD4E6AE33C9FC07CB308DB3B3C9D20ED6639CCA703308717D4D9B009BC66842AECDA12AE6A380E62881FF2F2D82C68528AA6056583A48F3"),
  a: BigInt("0x7830A3318B603B89E2327145AC234CC594CBDD8D3DF91610A83441CAEA9863BC2DED5D5AA8253AA10A2EF1C98B9AC8B57F1117A72BF2C7B9E7C1AC4D77FC94CA"),
  b: BigInt("0x3DF91610A83441CAEA9863BC2DED5D5AA8253AA10A2EF1C98B9AC8B57F1117A72BF2C7B9E7C1AC4D77FC94CADC083E67984050B75EBAE5DD2809BD638016F723"),
  Gx: BigInt("0x81AEE4BDD82ED9645A21322E9C4C6A9385ED9F70B5D916C1B43B62EEF4D0098EFF3B1F78E2D0D48D50D1687B93B97D5F7C6D5047406A5E688B352209BCB9F822"),
  Gy: BigInt("0x7DDE385D566332ECC0EABFA9CF7822FDF209F70024A57B1AA000C55B881F8111B2DCDE494A5F485E5BCA4BD88A2763AED1CA2B2FA8F0540678CD1E0F3AD80892"),
  n: BigInt("0xAADD9DB8DBE9C48B3FD4E6AE33C9FC07CB308DB3B3C9D20ED6639CCA70330870553E5C414CA92619418661197FAC10471DB1D381085DDADDB58796829CA90069"),
  h: BigInt("1"),
};

// ---- BigInt modular arithmetic ----

function mod(a, p) {
  const r = a % p;
  return r < 0n ? r + p : r;
}

function modPow(base, exp, mod_) {
  let result = 1n;
  base = mod(base, mod_);
  while (exp > 0n) {
    if (exp % 2n === 1n) result = mod(result * base, mod_);
    exp = exp / 2n;
    base = mod(base * base, mod_);
  }
  return result;
}

function modInv(a, p) {
  return modPow(mod(a, p), p - 2n, p);
}

// ---- Elliptic curve point arithmetic ----

function pointDouble(P, curve) {
  if (P === null) return null;
  const { p, a } = curve;
  const lam = mod(3n * P.x * P.x + a, p) * modInv(2n * P.y, p);
  const lamMod = mod(lam, p);
  const x3 = mod(lamMod * lamMod - 2n * P.x, p);
  const y3 = mod(lamMod * (P.x - x3) - P.y, p);
  return { x: x3, y: y3 };
}

function pointAdd(P, Q, curve) {
  if (P === null) return Q;
  if (Q === null) return P;
  const { p } = curve;
  if (P.x === Q.x) {
    if (P.y !== Q.y) return null;
    return pointDouble(P, curve);
  }
  const lam = mod((Q.y - P.y) * modInv(Q.x - P.x, p), p);
  const x3 = mod(lam * lam - P.x - Q.x, p);
  const y3 = mod(lam * (P.x - x3) - P.y, p);
  return { x: x3, y: y3 };
}

function pointMul(k, P, curve) {
  let result = null;
  let addend = P;
  let scalar = k;
  while (scalar > 0n) {
    if (scalar & 1n) result = pointAdd(result, addend, curve);
    addend = pointDouble(addend, curve);
    scalar >>= 1n;
  }
  return result;
}

// ---- Key generation ----

function randomBigInt(bits) {
  const bytes = Math.ceil(bits / 8);
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  let hex = "";
  for (const b of arr) hex += b.toString(16).padStart(2, "0");
  return BigInt("0x" + hex);
}

function generateKeyPair() {
  const curve = BRAINPOOL_P512;
  const G = { x: curve.Gx, y: curve.Gy };
  let d;
  do {
    d = randomBigInt(512) % (curve.n - 1n) + 1n;
  } while (d === 0n);
  const Q = pointMul(d, G, curve);
  return { privateKey: d, publicKey: Q };
}

// ---- Encoding helpers ----

function bigIntToBytes(n, length) {
  let hex = n.toString(16);
  if (hex.length % 2 !== 0) hex = "0" + hex;
  while (hex.length < length * 2) hex = "00" + hex;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToBigInt(bytes) {
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return BigInt("0x" + hex);
}

function uint8ArrayToBase64(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  // Use URL-safe base64 to avoid + and / being corrupted on copy-paste
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64Normalize(b64) {
  // Convert URL-safe back to standard base64 before atob
  return b64.replace(/-/g, "+").replace(/_/g, "/");
}

function base64ToUint8Array(b64) {
  // Remove all whitespace/newlines, normalize URL-safe chars, restore padding
  let cleaned = base64Normalize(b64.replace(/\s/g, ""));
  const rem = cleaned.length % 4;
  if (rem === 2) cleaned += "==";
  else if (rem === 3) cleaned += "=";
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Uncompressed point: 0x04 || x || y
function encodePublicKey(Q) {
  const x = bigIntToBytes(Q.x, 64);
  const y = bigIntToBytes(Q.y, 64);
  const bytes = new Uint8Array(129);
  bytes[0] = 0x04;
  bytes.set(x, 1);
  bytes.set(y, 65);
  return bytes;
}

function decodePublicKey(bytes) {
  if (bytes[0] !== 0x04) throw new Error("Only uncompressed public keys supported");
  const x = bytesToBigInt(bytes.slice(1, 65));
  const y = bytesToBigInt(bytes.slice(65, 129));
  return { x, y };
}

// Simple PEM-like encoding (base64 wrapped)
function toPEM(label, bytes) {
  const b64 = uint8ArrayToBase64(bytes);
  const lines = b64.match(/.{1,64}/g).join("\n");
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
}

function fromPEM(label, pem) {
  const header = `-----BEGIN ${label}-----`;
  const footer = `-----END ${label}-----`;
  const b64 = pem.replace(header, "").replace(footer, "").replace(/\s/g, "");
  return base64ToUint8Array(b64);
}

export function generateAndExportKeyPair() {
  const { privateKey, publicKey } = generateKeyPair();
  const privBytes = bigIntToBytes(privateKey, 64);
  const pubBytes = encodePublicKey(publicKey);
  return {
    privateKeyPem: toPEM("BRAINPOOL P512 PRIVATE KEY", privBytes),
    publicKeyPem: toPEM("BRAINPOOL P512 PUBLIC KEY", pubBytes),
  };
}

// ---- SHA-512 hash ----

async function sha512(data) {
  let bytes;
  if (typeof data === "string") {
    bytes = new TextEncoder().encode(data);
  } else if (data instanceof Uint8Array) {
    bytes = data;
  } else if (data instanceof ArrayBuffer) {
    bytes = new Uint8Array(data);
  } else {
    bytes = new TextEncoder().encode(String(data));
  }
  const hashBuffer = await crypto.subtle.digest("SHA-512", bytes);
  return new Uint8Array(hashBuffer);
}

// ---- ECDSA Sign (RFC 6979 deterministic k or random) ----

async function sign(message, privateKeyPem) {
  const privBytes = fromPEM("BRAINPOOL P512 PRIVATE KEY", privateKeyPem);
  const d = bytesToBigInt(privBytes);
  const curve = BRAINPOOL_P512;
  const G = { x: curve.Gx, y: curve.Gy };
  const hash = await sha512(message);
  const e = bytesToBigInt(hash) % curve.n;

  let r = 0n, s = 0n;
  while (r === 0n || s === 0n) {
    let k;
    do {
      k = randomBigInt(512) % (curve.n - 1n) + 1n;
    } while (k === 0n);
    const kG = pointMul(k, G, curve);
    r = mod(kG.x, curve.n);
    if (r === 0n) continue;
    s = mod(modInv(k, curve.n) * (e + r * d), curve.n);
  }

  const rBytes = bigIntToBytes(r, 64);
  const sBytes = bigIntToBytes(s, 64);
  const sigBytes = new Uint8Array(128);
  sigBytes.set(rBytes, 0);
  sigBytes.set(sBytes, 64);
  return uint8ArrayToBase64(sigBytes);
}

async function verify(message, signatureB64, publicKeyPem) {
  const pubBytes = fromPEM("BRAINPOOL P512 PUBLIC KEY", publicKeyPem);
  const Q = decodePublicKey(pubBytes);
  const curve = BRAINPOOL_P512;
  const G = { x: curve.Gx, y: curve.Gy };

  const sigBytes = base64ToUint8Array(signatureB64);
  if (sigBytes.length !== 128) return false;
  const r = bytesToBigInt(sigBytes.slice(0, 64));
  const s = bytesToBigInt(sigBytes.slice(64, 128));

  if (r <= 0n || r >= curve.n || s <= 0n || s >= curve.n) return false;

  const hash = await sha512(message);
  const e = bytesToBigInt(hash) % curve.n;

  const w = modInv(s, curve.n);
  const u1 = mod(e * w, curve.n);
  const u2 = mod(r * w, curve.n);

  const P1 = pointMul(u1, G, curve);
  const P2 = pointMul(u2, Q, curve);
  const X = pointAdd(P1, P2, curve);
  if (X === null) return false;
  return mod(X.x, curve.n) === r;
}

async function computeFingerprint(publicKeyPem) {
  const pubBytes = fromPEM("BRAINPOOL P512 PUBLIC KEY", publicKeyPem);
  const hash = await crypto.subtle.digest("SHA-256", pubBytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(":")
    .toUpperCase();
}

// ---- ECIES Encrypt / Decrypt ----

/**
 * ECIES encrypt:
 * 1. Generate ephemeral key pair (r, R)
 * 2. Shared secret S = r * Q  (Q = recipient public key)
 * 3. Derive AES-256-CBC key + HMAC key via SHA-512(S.x)
 * 4. Encrypt plaintext with AES-256-CBC
 * 5. Output: R || IV || ciphertext || HMAC-SHA256(IV||ciphertext)
 * All encoded as base64.
 */
async function encrypt(plaintext, publicKeyPem) {
  const pubBytes = fromPEM("BRAINPOOL P512 PUBLIC KEY", publicKeyPem);
  const Q = decodePublicKey(pubBytes);
  const curve = BRAINPOOL_P512;
  const G = { x: curve.Gx, y: curve.Gy };

  // Ephemeral key
  let r;
  do { r = randomBigInt(512) % (curve.n - 1n) + 1n; } while (r === 0n);
  const R = pointMul(r, G, curve);
  const S = pointMul(r, Q, curve);

  // Derive keys from shared secret x-coordinate
  const sxBytes = bigIntToBytes(S.x, 64);
  const derived = await crypto.subtle.digest("SHA-512", sxBytes);
  const derivedArr = new Uint8Array(derived);
  const encKey = derivedArr.slice(0, 32); // AES-256 key
  const macKey = derivedArr.slice(32, 64); // HMAC key

  // Encrypt with AES-256-CBC
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const aesKey = await crypto.subtle.importKey("raw", encKey, { name: "AES-CBC" }, false, ["encrypt"]);
  const msgBytes = new TextEncoder().encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, aesKey, msgBytes);
  const cipherBytes = new Uint8Array(cipherBuf);

  // HMAC-SHA256 over IV || ciphertext
  const hmacKey = await crypto.subtle.importKey("raw", macKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const macData = new Uint8Array(iv.length + cipherBytes.length);
  macData.set(iv, 0);
  macData.set(cipherBytes, iv.length);
  const macBuf = await crypto.subtle.sign("HMAC", hmacKey, macData);
  const macBytes = new Uint8Array(macBuf);

  // Encode R (129 bytes) || IV (16) || cipher || MAC (32)
  const rBytes = encodePublicKey(R);
  const output = new Uint8Array(rBytes.length + iv.length + cipherBytes.length + macBytes.length);
  let off = 0;
  output.set(rBytes, off); off += rBytes.length;
  output.set(iv, off); off += iv.length;
  output.set(cipherBytes, off); off += cipherBytes.length;
  output.set(macBytes, off);

  return uint8ArrayToBase64(output);
}

async function decrypt(ciphertextB64, privateKeyPem) {
  const privBytes = fromPEM("BRAINPOOL P512 PRIVATE KEY", privateKeyPem);
  const d = bytesToBigInt(privBytes);
  const curve = BRAINPOOL_P512;

  const data = base64ToUint8Array(ciphertextB64);
  if (data.length < 129 + 16 + 32) throw new Error("Ciphertext too short");

  let off = 0;
  const rBytes = data.slice(off, off + 129); off += 129;
  const iv = data.slice(off, off + 16); off += 16;
  const macBytes = data.slice(data.length - 32);
  const cipherBytes = data.slice(off, data.length - 32);

  // Recover shared secret
  const R = decodePublicKey(rBytes);
  const G = { x: curve.Gx, y: curve.Gy };
  const S = pointMul(d, R, curve);

  // Derive keys
  const sxBytes = bigIntToBytes(S.x, 64);
  const derived = await crypto.subtle.digest("SHA-512", sxBytes);
  const derivedArr = new Uint8Array(derived);
  const encKey = derivedArr.slice(0, 32);
  const macKey = derivedArr.slice(32, 64);

  // Verify HMAC
  const hmacKey = await crypto.subtle.importKey("raw", macKey, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const macData = new Uint8Array(iv.length + cipherBytes.length);
  macData.set(iv, 0);
  macData.set(cipherBytes, iv.length);
  const valid = await crypto.subtle.verify("HMAC", hmacKey, macBytes, macData);
  if (!valid) throw new Error("MAC verification failed — ciphertext may be tampered");

  // Decrypt AES-256-CBC
  const aesKey = await crypto.subtle.importKey("raw", encKey, { name: "AES-CBC" }, false, ["decrypt"]);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, aesKey, cipherBytes);
  return new TextDecoder().decode(plainBuf);
}

// ECIES encrypt raw bytes → base64 ciphertext
async function encryptBytes(inputBytes, publicKeyPem) {
  const pubBytes = fromPEM("BRAINPOOL P512 PUBLIC KEY", publicKeyPem);
  const Q = decodePublicKey(pubBytes);
  const curve = BRAINPOOL_P512;
  const G = { x: curve.Gx, y: curve.Gy };

  let r;
  do { r = randomBigInt(512) % (curve.n - 1n) + 1n; } while (r === 0n);
  const R = pointMul(r, G, curve);
  const S = pointMul(r, Q, curve);

  const sxBytes = bigIntToBytes(S.x, 64);
  const derived = await crypto.subtle.digest("SHA-512", sxBytes);
  const derivedArr = new Uint8Array(derived);
  const encKey = derivedArr.slice(0, 32);
  const macKey = derivedArr.slice(32, 64);

  const iv = crypto.getRandomValues(new Uint8Array(16));
  const aesKey = await crypto.subtle.importKey("raw", encKey, { name: "AES-CBC" }, false, ["encrypt"]);
  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, aesKey, inputBytes);
  const cipherBytes = new Uint8Array(cipherBuf);

  const hmacKey = await crypto.subtle.importKey("raw", macKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const macData = new Uint8Array(iv.length + cipherBytes.length);
  macData.set(iv, 0);
  macData.set(cipherBytes, iv.length);
  const macBuf = await crypto.subtle.sign("HMAC", hmacKey, macData);
  const macBytes = new Uint8Array(macBuf);

  const rBytes = encodePublicKey(R);
  const output = new Uint8Array(rBytes.length + iv.length + cipherBytes.length + macBytes.length);
  let off = 0;
  output.set(rBytes, off); off += rBytes.length;
  output.set(iv, off); off += iv.length;
  output.set(cipherBytes, off); off += cipherBytes.length;
  output.set(macBytes, off);

  return uint8ArrayToBase64(output);
}

// ECIES decrypt base64 ciphertext → raw Uint8Array
async function decryptToBytes(ciphertextB64, privateKeyPem) {
  const privBytes = fromPEM("BRAINPOOL P512 PRIVATE KEY", privateKeyPem);
  const d = bytesToBigInt(privBytes);
  const curve = BRAINPOOL_P512;

  const data = base64ToUint8Array(ciphertextB64);
  if (data.length < 129 + 16 + 32) throw new Error("Ciphertext too short");

  let off = 0;
  const rBytes = data.slice(off, off + 129); off += 129;
  const iv = data.slice(off, off + 16); off += 16;
  const macBytes = data.slice(data.length - 32);
  const cipherBytes = data.slice(off, data.length - 32);

  const R = decodePublicKey(rBytes);
  const G = { x: curve.Gx, y: curve.Gy };
  const S = pointMul(d, R, curve);

  const sxBytes = bigIntToBytes(S.x, 64);
  const derived = await crypto.subtle.digest("SHA-512", sxBytes);
  const derivedArr = new Uint8Array(derived);
  const encKey = derivedArr.slice(0, 32);
  const macKey = derivedArr.slice(32, 64);

  const hmacKey = await crypto.subtle.importKey("raw", macKey, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const macData = new Uint8Array(iv.length + cipherBytes.length);
  macData.set(iv, 0);
  macData.set(cipherBytes, iv.length);
  const valid = await crypto.subtle.verify("HMAC", hmacKey, macBytes, macData);
  if (!valid) throw new Error("MAC verification failed — ciphertext may be tampered");

  const aesKey = await crypto.subtle.importKey("raw", encKey, { name: "AES-CBC" }, false, ["decrypt"]);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, aesKey, cipherBytes);
  return new Uint8Array(plainBuf);
}

export { sign, verify, computeFingerprint, encrypt, encryptBytes, decrypt, decryptToBytes };