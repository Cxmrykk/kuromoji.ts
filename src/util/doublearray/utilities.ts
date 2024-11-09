import type { ArrayBuffer } from "./types";

// Array utility functions

export const newArrayBuffer = (
  signed: boolean,
  bytes: number,
  size: number
): ArrayBuffer => {
  if (signed) {
    switch (bytes) {
      case 1:
        return new Int8Array(size);
      case 2:
        return new Int16Array(size);
      case 4:
        return new Int32Array(size);
      default:
        throw new RangeError(`Invalid newArray parameter element_bytes: ${bytes}`);
    }
  } else {
    switch (bytes) {
      case 1:
        return new Uint8Array(size);
      case 2:
        return new Uint16Array(size);
      case 4:
        return new Uint32Array(size);
      default:
        throw new RangeError(`Invalid newArray parameter element_bytes: ${bytes}`);
    }
  }
};

export const arrayCopy = (
  src: ArrayBuffer,
  srcOffset: number,
  length: number
): Uint8Array => {
  const buffer = new ArrayBuffer(length);
  const dstU8 = new Uint8Array(buffer, 0, length);
  const srcU8 = src.subarray(srcOffset, srcOffset + length); // Fix: Correct subarray usage
  dstU8.set(srcU8);
  return dstU8;
};

/**
 * Convert String (UTF-16) to UTF-8 ArrayBuffer
 *
 * @param {String} str UTF-16 string to convert
 * @return {Uint8Array} Byte sequence encoded by UTF-8
 */
export const stringToUtf8Bytes = (str: string): Uint8Array | null => {
  // Max size of 1 character is 4 bytes
  const bytes = new Uint8Array(new ArrayBuffer(str.length * 4));

  let i = 0;
  let j = 0;

  while (i < str.length) {
    let unicodeCode: number;

    const utf16Code = str.charCodeAt(i++);
    if (utf16Code >= 0xd800 && utf16Code <= 0xdbff) {
      // surrogate pair
      const upper = utf16Code; // high surrogate
      const lower = str.charCodeAt(i++); // low surrogate

      if (lower >= 0xdc00 && lower <= 0xdfff) {
        unicodeCode =
          (upper - 0xd800) * (1 << 10) + (1 << 16) + (lower - 0xdc00);
      } else {
        // malformed surrogate pair
        return null;
      }
    } else {
      // not surrogate code
      unicodeCode = utf16Code;
    }

    if (unicodeCode < 0x80) {
      // 1-byte
      bytes[j++] = unicodeCode;
    } else if (unicodeCode < 1 << 11) {
      // 2-byte
      bytes[j++] = (unicodeCode >>> 6) | 0xc0;
      bytes[j++] = (unicodeCode & 0x3f) | 0x80;
    } else if (unicodeCode < 1 << 16) {
      // 3-byte
      bytes[j++] = (unicodeCode >>> 12) | 0xe0;
      bytes[j++] = ((unicodeCode >> 6) & 0x3f) | 0x80;
      bytes[j++] = (unicodeCode & 0x3f) | 0x80;
    } else if (unicodeCode < 1 << 21) {
      // 4-byte
      bytes[j++] = (unicodeCode >>> 18) | 0xf0;
      bytes[j++] = ((unicodeCode >> 12) & 0x3f) | 0x80;
      bytes[j++] = ((unicodeCode >> 6) & 0x3f) | 0x80;
      bytes[j++] = (unicodeCode & 0x3f) | 0x80;
    } else {
      // malformed UCS4 code
      return null; // Explicitly handle malformed code
    }
  }

  return bytes.subarray(0, j);
};

/**
 * Convert UTF-8 ArrayBuffer to String (UTF-16)
 *
 * @param {Uint8Array} bytes UTF-8 byte sequence to convert
 * @return {String} String encoded by UTF-16
 */
export const utf8BytesToString = (bytes: Uint8Array): string => {
  let str = "";
  let code: number;
  let b1: number;
  let b2: number;
  let b3: number;
  let b4: number;
  let upper: number;
  let lower: number;
  let i = 0;

  while (i < bytes.length) {
    b1 = bytes[i++];

    if (b1 < 0x80) {
      // 1 byte
      code = b1;
    } else if ((b1 >> 5) === 0x06) {
      // 2 bytes
      b2 = bytes[i++];
      code = ((b1 & 0x1f) << 6) | (b2 & 0x3f);
    } else if ((b1 >> 4) === 0x0e) {
      // 3 bytes
      b2 = bytes[i++];
      b3 = bytes[i++];
      code = ((b1 & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
    } else {
      // 4 bytes
      b2 = bytes[i++];
      b3 = bytes[i++];
      b4 = bytes[i++];
      code =
        ((b1 & 0x07) << 18) |
        ((b2 & 0x3f) << 12) |
        ((b3 & 0x3f) << 6) |
        (b4 & 0x3f);
    }

    if (code < 0x10000) {
      str += String.fromCharCode(code);
    } else {
      // surrogate pair
      code -= 0x10000;
      upper = 0xd800 | (code >> 10);
      lower = 0xdc00 | (code & 0x3ff);
      str += String.fromCharCode(upper, lower);
    }
  }

  return str;
};
