import BC from "./bc";
import DoubleArray from "./doubleArrayClass";
import { ROOT_ID, TERM_CHAR, TERM_CODE } from "./properties";
import type { Key } from "./types";
import { stringToUtf8Bytes } from "./utilities";

export default class DoubleArrayBuilder {
  bc: BC;
  keys: Key[];

  /**
   * Factory method of double array
   */
  constructor(initialSize: number | null = null) {
    this.bc = new BC(initialSize); // BASE and CHECK
    this.keys = [];
  }

  /**
   * Append a key to initialize set
   * (This method should be called by dictionary ordered key)
   *
   * @param {String} key
   * @param {Number} value Integer value from 0 to max signed integer number - 1
   */
  append(key: string, record: number): this {
    this.keys.push({ k: key, v: record });
    return this;
  }

  /**
   * Build double array for given keys
   *
   * @param {Array} keys Array of keys. A key is a Object which has properties 'k', 'v'.
   * 'k' is a key string, 'v' is a record assigned to that key.
   * @return {DoubleArray} Compiled double array
   */
  build(keys: Key[] | null = null, sorted: boolean | null = null): DoubleArray {
    if (keys === null) {
      keys = this.keys;
    }

    if (keys === null) {
      return new DoubleArray(this.bc);
    }

    if (sorted === null) {
      sorted = false;
    }

    // Convert key string to ArrayBuffer
    const buffKeys = keys.map(function (k) {
      return {
        k: stringToUtf8Bytes(k.k + TERM_CHAR),
        v: k.v,
      };
    });

    // Sort keys by byte order
    if (sorted) {
      this.keys = buffKeys;
    } else {
      this.keys = buffKeys.sort((k1, k2) => {
        const b1 = k1.k;
        const b2 = k2.k;

        // Handle null values appropriately
        if (b1 === null && b2 === null) return 0;
        if (b1 === null) return -1;
        if (b2 === null) return 1;

        const minLength = Math.min(b1.length, b2.length);
        for (let pos = 0; pos < minLength; pos++) {
          if (b1[pos] === b2[pos]) {
            continue;
          }
          return b1[pos] - b2[pos];
        }
        return b1.length - b2.length;
      });
    }

    this._build(ROOT_ID, 0, 0, this.keys.length);
    return new DoubleArray(this.bc);
  }

  /**
   * Append nodes to BASE and CHECK array recursively
   */
  _build(
    parentIndex: number,
    position: number,
    start: number,
    length: number
  ): void {
    const childrenInfo = this.getChildrenInfo(position, start, length);
    const _base = this.findAllocatableBase(childrenInfo);

    this.setBC(parentIndex, childrenInfo, _base);

    for (let i = 0; i < childrenInfo.length; i = i + 3) {
      const childCode = childrenInfo[i];
      if (childCode === TERM_CODE) {
        continue;
      }
      const childStart = childrenInfo[i + 1];
      const childLen = childrenInfo[i + 2];
      const childIndex = _base + childCode;
      this._build(childIndex, position + 1, childStart, childLen);
    }
  }

  getChildrenInfo(
    position: number,
    start: number,
    length: number
  ): Int32Array {
    const startKey = this.keys[start];

    // Handle cases where startKey or its k property is null
    if (!startKey || startKey.k === null) return new Int32Array();

    const startKeyK = startKey.k[position];
    let currentChar =
      typeof startKeyK === "number" ? startKeyK.toString() : startKeyK;
    let i = 0;
    let childrenInfo = new Int32Array(length * 3);

    childrenInfo[i++] = parseInt(currentChar, 10); // char (current) - Use parseInt with radix
    childrenInfo[i++] = start; // start index (current)

    let nextPos = start;
    let startPos = start;
    for (; nextPos < start + length; nextPos++) {
      const nextKey = this.keys[nextPos];

      // Handle cases where nextKey or its k property is null
      if (!nextKey || nextKey.k === null) return new Int32Array();

      const nextKeyK = nextKey.k[position];
      const nextChar =
        typeof nextKeyK === "number" ? nextKeyK.toString() : nextKeyK;

      if (currentChar !== nextChar) {
        childrenInfo[i++] = nextPos - startPos; // length (current)

        childrenInfo[i++] = parseInt(nextChar, 10); // char (next) - Use parseInt with radix
        childrenInfo[i++] = nextPos; // start index (next)
        currentChar = nextChar;
        startPos = nextPos;
      }
    }
    childrenInfo[i++] = nextPos - startPos;
    childrenInfo = childrenInfo.subarray(0, i);

    return childrenInfo;
  }

  setBC(parentId: number, childrenInfo: Int32Array, _base: number): void {
    const bc = this.bc;

    bc.setBase(parentId, _base); // Update BASE of parent node

    for (let i = 0; i < childrenInfo.length; i = i + 3) {
      const code = childrenInfo[i];
      const childId = _base + code;

      // Update linked list of unused nodes
      const prevUnusedId = -bc.getBase(childId);
      const nextUnusedId = -bc.getCheck(childId);

      if (childId !== bc.getFirstUnusedNode()) {
        bc.setCheck(prevUnusedId, -nextUnusedId);
      } else {
        // Update firstUnusedNode
        bc.setFirstUnusedNode(nextUnusedId);
      }
      bc.setBase(nextUnusedId, -prevUnusedId);

      const check = parentId; // CHECK is parent node index
      bc.setCheck(childId, check); // Update CHECK of child node

      // Update record
      if (code === TERM_CODE) {
        const startPos = childrenInfo[i + 1];
        let value = this.keys[startPos].v;

        if (value === null || value === undefined) {
          value = 0;
        }

        const base = -value - 1; // BASE is inverted record value
        bc.setBase(childId, base); // Update BASE of child(leaf) node
      }
    }
  }

  /**
   * Find BASE value that all children are allocatable in double array's region
   */
  findAllocatableBase(childrenInfo: Int32Array): number {
    const bc = this.bc;

    // iterate linked list of unused nodes
    let _base: number;
    let curr: number = bc.getFirstUnusedNode(); // current index

    while (true) {
      _base = curr - childrenInfo[0];

      if (_base < 0) {
        curr = -bc.getCheck(curr); // next
        continue;
      }

      let emptyAreaFound = true;
      for (let i = 0; i < childrenInfo.length; i = i + 3) {
        const code = childrenInfo[i];
        const candidateId = _base + code;

        if (!this.isUnusedNode(candidateId)) {
          // candidateId is used node
          // next
          curr = -bc.getCheck(curr);
          emptyAreaFound = false;
          break;
        }
      }
      if (emptyAreaFound) {
        // Area is free
        return _base;
      }
    }
  }

  /**
   * Check this double array index is unused or not
   */
  isUnusedNode(index: number): boolean {
    const bc = this.bc;
    const check = bc.getCheck(index);

    if (index === ROOT_ID) {
      // root node
      return false;
    }
    if (check < 0) {
      // unused
      return true;
    }

    // used node (incl. leaf)
    return false;
  }
}
