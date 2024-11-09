export type ArrayBuffer = IntArrayBuffer | UintArrayBuffer;
export type IntArrayBuffer = Int8Array | Int16Array | Int32Array;
export type UintArrayBuffer = Uint8Array | Uint16Array | Uint32Array;

export interface BCCalc {
  all: number;
  unused: number;
  efficiency: number;
}

export interface BCValue {
  signed: boolean;
  bytes: number;
  array: ArrayBuffer;
}

export interface Key {
  k: Uint8Array | string | null;
  v: number;
}
