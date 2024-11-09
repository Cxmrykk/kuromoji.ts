import BC from "./bc";
import { NOT_FOUND, ROOT_ID, TERM_CHAR, TERM_CODE } from "./properties";
import type { BCCalc, Key } from "./types";
import {
  arrayCopy,
  stringToUtf8Bytes,
  utf8BytesToString,
} from "./utilities";

export default class DoubleArray {
  bc: BC;

  /**
   * Factory method of double array
   */
  constructor(bc: BC) {
    this.bc = bc; // BASE and CHECK
    this.bc.shrink();
  }

  /**
   * Look up a given key in this trie
   *
   * @param {String} key
   * @return {Boolean} True if this trie contains a given key
   */
  contain(key: string): boolean {
    const bc = this.bc;

    key += TERM_CHAR;
    const buffer = stringToUtf8Bytes(key);
    if (buffer === null) return false;

    let parent = ROOT_ID;
    let child = NOT_FOUND;

    for (let i = 0; i < buffer.length; i++) {
      const code = buffer[i];

      child = this.traverse(parent, code);
      if (child === NOT_FOUND) {
        return false;
      }

      if (bc.getBase(child) <= 0) {
        // leaf node
        return true;
      } else {
        // not leaf
        parent = child;
        continue;
      }
    }
    return false;
  }

  /**
   * Look up a given key in this trie
   *
   * @param {String} key
   * @return {Number} Record value assgned to this key, -1 if this key does not contain
   */
  lookup(key: string): number {
    key += TERM_CHAR;
    const buffer = stringToUtf8Bytes(key);
    if (buffer === null) return NOT_FOUND;

    let parent = ROOT_ID;
    let child = NOT_FOUND;

    for (let i = 0; i < buffer.length; i++) {
      const code = buffer[i];
      child = this.traverse(parent, code);
      if (child === NOT_FOUND) {
        return NOT_FOUND;
      }
      parent = child;
    }

    const base = this.bc.getBase(child);
    if (base <= 0) {
      // leaf node
      return -base - 1;
    } else {
      // not leaf
      return NOT_FOUND;
    }
  }

  /**
   * Common prefix search
   *
   * @param {String} key
   * @return {Array} Each result object has 'k' and 'v' (key and record,
   * respectively) properties assigned to matched string
   */
  commonPrefixSearch(key: string): Key[] {
    const buffer = stringToUtf8Bytes(key);
    if (buffer === null) return [];

    let parent = ROOT_ID;
    let child = NOT_FOUND;

    const result: Key[] = [];

    for (let i = 0; i < buffer.length; i++) {
      const code = buffer[i];

      child = this.traverse(parent, code);

      if (child !== NOT_FOUND) {
        parent = child;

        // look forward by terminal character code to check this node is a leaf or not
        const grandChild = this.traverse(child, TERM_CODE);

        if (grandChild !== NOT_FOUND) {
          const base = this.bc.getBase(grandChild);

          const r: Partial<Key> = {};

          if (base <= 0) {
            // If child is a leaf node, add record to result
            r.v = -base - 1;
          }

          // If child is a leaf node, add word to result
          r.k = utf8BytesToString(arrayCopy(buffer, 0, i + 1));

          result.push(r as Key); // Type assertion to satisfy return type
        }
        continue;
      } else {
        break;
      }
    }

    return result;
  }

  traverse(parent: number, code: number): number {
    const child = this.bc.getBase(parent) + code;
    if (this.bc.getCheck(child) === parent) {
      return child;
    } else {
      return NOT_FOUND;
    }
  }

  size(): number {
    return this.bc.size();
  }

  calc(): BCCalc {
    return this.bc.calc();
  }

  dump(): string {
    return this.bc.dump();
  }
}
