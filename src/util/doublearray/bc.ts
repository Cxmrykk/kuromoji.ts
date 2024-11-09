import {
  BASE_BYTES,
  BASE_SIGNED,
  CHECK_BYTES,
  CHECK_SIGNED,
  MEMORY_EXPAND_RATIO,
  ROOT_ID,
} from "./properties";
import type { ArrayBuffer, BCCalc, BCValue } from "./types";
import { newArrayBuffer } from "./utilities";

export default class BC {
  initialSize: number;
  firstUnusedNode: number;
  base: BCValue;
  check: BCValue;

  constructor(initialSize: number | null = null) {
    if (initialSize === null) {
      this.initialSize = 1024;
    } else {
      this.initialSize = initialSize;
    }
    this.firstUnusedNode = ROOT_ID + 1;

    this.base = {
      signed: BASE_SIGNED,
      bytes: BASE_BYTES,
      array: newArrayBuffer(BASE_SIGNED, BASE_BYTES, this.initialSize),
    };

    this.check = {
      signed: CHECK_SIGNED,
      bytes: CHECK_BYTES,
      array: newArrayBuffer(CHECK_SIGNED, CHECK_BYTES, this.initialSize),
    };

    // init root node
    this.base.array[ROOT_ID] = 1;
    this.check.array[ROOT_ID] = ROOT_ID;

    // init BASE
    this.initBase(this.base.array, ROOT_ID + 1, this.base.array.length);

    // init CHECK
    this.initCheck(this.check.array, ROOT_ID + 1, this.check.array.length);
  }

  initBase(_base: ArrayBuffer, start: number, end: number): void {
    // 'end' index does not include
    for (let i = start; i < end; i++) {
      _base[i] = -i + 1; // inversed previous empty node index
    }
    if (0 < this.check.array[this.check.array.length - 1]) {
      let lastUsedId = this.check.array.length - 2;
      while (0 < this.check.array[lastUsedId]) {
        lastUsedId--;
      }
      _base[start] = -lastUsedId;
    }
  }

  initCheck(_check: ArrayBuffer, start: number, end: number): void {
    for (let i = start; i < end; i++) {
      _check[i] = -i - 1; // inversed next empty node index
    }
  }

  realloc(minSize: number): void {
    // expand arrays size by given ratio
    const newSize = minSize * MEMORY_EXPAND_RATIO;
    // console.log('re-allocate memory to ' + new_size);

    const baseNewArray = newArrayBuffer(
      this.base.signed,
      this.base.bytes,
      newSize
    );
    this.initBase(baseNewArray, this.base.array.length, newSize); // init this.base in new range
    baseNewArray.set(this.base.array);
    this.base.array = baseNewArray;

    const checkNewArray = newArrayBuffer(
      this.check.signed,
      this.check.bytes,
      newSize
    );
    this.initCheck(checkNewArray, this.check.array.length, newSize); // init this.check in new range
    checkNewArray.set(this.check.array);
    this.check.array = checkNewArray;
  }

  getBaseBuffer(): ArrayBuffer {
    return this.base.array;
  }

  getCheckBuffer(): ArrayBuffer {
    return this.check.array;
  }

  loadBaseBuffer(baseBuffer: ArrayBuffer): this {
    this.base.array = baseBuffer;
    return this;
  }

  loadCheckBuffer(checkBuffer: ArrayBuffer): this {
    this.check.array = checkBuffer;
    return this;
  }

  size(): number {
    return Math.max(this.base.array.length, this.check.array.length);
  }

  getBase(index: number): number {
    if (this.base.array.length - 1 < index) {
      return -index + 1;
      // realloc(index);
    }
    return this.base.array[index];
  }

  getCheck(index: number): number {
    if (this.check.array.length - 1 < index) {
      return -index - 1;
      // realloc(index);
    }
    return this.check.array[index];
  }

  setBase(index: number, baseValue: number): void {
    if (this.base.array.length - 1 < index) {
      this.realloc(index);
    }
    this.base.array[index] = baseValue;
  }

  setCheck(index: number, checkValue: number): void {
    if (this.check.array.length - 1 < index) {
      this.realloc(index);
    }
    this.check.array[index] = checkValue;
  }

  setFirstUnusedNode(index: number): void {
    this.firstUnusedNode = index;
  }

  getFirstUnusedNode(): number {
    return this.firstUnusedNode;
  }

  shrink(): void {
    let lastIndex = this.size() - 1;
    while (true) {
      if (0 <= this.check.array[lastIndex]) {
        break;
      }
      lastIndex--;
    }
    this.base.array = this.base.array.subarray(0, lastIndex + 2); // keep last unused node
    this.check.array = this.check.array.subarray(0, lastIndex + 2); // keep last unused node
  }

  calc(): BCCalc {
    let unusedCount = 0;
    const size = this.check.array.length;
    for (let i = 0; i < size; i++) {
      if (this.check.array[i] < 0) {
        unusedCount++;
      }
    }
    return {
      all: size,
      unused: unusedCount,
      efficiency: (size - unusedCount) / size,
    };
  }

  dump(): string {
    // for debug
    let dumpBase = "";
    let dumpCheck = "";

    for (let i = 0; i < this.base.array.length; i++) {
      dumpBase = dumpBase + " " + this.getBase(i);
    }
    for (let i = 0; i < this.check.array.length; i++) {
      dumpCheck = dumpCheck + " " + this.getCheck(i);
    }

    console.log("this.base:" + dumpBase);
    console.log("chck:" + dumpCheck);

    return "this.base:" + dumpBase + " chck:" + dumpCheck;
  }
}
