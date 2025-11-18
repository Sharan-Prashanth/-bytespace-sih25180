// compute SHA-256 hash for a File/Blob/ArrayBuffer/string
// Uses Web Crypto API in browser and Node's crypto when available

export async function computeSHA256(input) {
  // Normalize input to ArrayBuffer
  let buffer;

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    if (input instanceof ArrayBuffer) buffer = input;
    else if (input instanceof Blob) buffer = await input.arrayBuffer();
    else if (typeof input === 'string') buffer = new TextEncoder().encode(input).buffer;
    else if (input instanceof Uint8Array) buffer = input.buffer;
    else throw new Error('Unsupported input type for computeSHA256');

    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    return bufferToHex(hashBuffer);
  }

  // Node fallback
  try {
    const crypto = await import('crypto');
    let data;
    if (input instanceof ArrayBuffer) data = Buffer.from(input);
    else if (input instanceof Blob) data = Buffer.from(await input.arrayBuffer());
    else if (typeof input === 'string') data = Buffer.from(input, 'utf8');
    else if (input instanceof Uint8Array) data = Buffer.from(input);
    else throw new Error('Unsupported input type for computeSHA256');

    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return '0x' + hash;
  } catch (err) {
    throw new Error('No crypto available for computeSHA256: ' + err.message);
  }
}

function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hex;
}
