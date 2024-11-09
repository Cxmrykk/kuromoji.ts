import BC from "./bc";
import DoubleArrayBuilder from "./doubleArrayBuilder";
import DoubleArray from "./doubleArrayClass";
import type { ArrayBuffer } from "./types";

// public methods
const doublearray = {
  builder: (initialSize?: number): DoubleArrayBuilder => {
    return new DoubleArrayBuilder(initialSize);
  },
  load: (baseBuffer: ArrayBuffer, checkBuffer: ArrayBuffer): DoubleArray => {
    const bc = new BC(0);
    bc.loadBaseBuffer(baseBuffer);
    bc.loadCheckBuffer(checkBuffer);
    return new DoubleArray(bc);
  },
};

// Export for browser and other environments
export default doublearray;

// Browser specific export
if (typeof window !== "undefined") {
  // @ts-ignore
  window.doublearray = doublearray;
}
