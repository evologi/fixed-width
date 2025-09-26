import { Transform } from "node:stream";

export declare class FixedWidthError extends Error {
  code: string;
  [key: string]: any;
}

export interface Options {
  /**
   * Allow lines to be longer than the declared fields while parsing.
   *
   * @default true
   */
  allowLongerLines?: boolean;
  /**
   * Allow lines to be shorter than the declared fields while parsing.
   *
   * @default false
   */
  allowShorterLines?: boolean;
  /**
   * Encoding for both input or output data.
   *
   * @default "utf8"
   */
  encoding?: string;
  /**
   * If true, append at the End Of File an "End Of Line" string.
   *
   * @default true
   */
  eof?: boolean;
  /**
   * String that separe line records (End Of Line).
   */
  eol?: string;
  /**
   * List of fields.
   */
  fields: Field[];
  /**
   * The first line to consider while parsing (inclusive).
   * It is a **1-based** integer (`1` is the first line).
   *
   * @default 1
   */
  from?: number;
  /**
   * Padding value. Must be one char (byte).
   *
   * @default " "
   */
  pad?: string;
  /**
   * @deprecated Use `allowLongerLines` and `allowShorterLines` options.
   */
  relax?: boolean;
  /**
   * Completely ignore all empty lines. This options does **not** change the
   * behaviour of the `allowShorterLines` option.
   *
   * @default true
   */
  skipEmptyLines?: boolean;
  /**
   * The last line to consider while parsing (inclusive).
   * It is a **1-based** integer (`1` is the first line).
   *
   * @default Infinity
   */
  to?: number;
  /**
   * String trimming for parsed values.
   * - `true`: trim the string
   * - `false`: do not trim the string
   * - `"left"`: trim the left of the string
   * - `"right"`: trim the right of the string
   * - `"auto"`: guess trim by field's alignment
   *
   * @default true
   */
  trim?: boolean | "left" | "right" | "auto";
}

export interface Field {
  /**
   * Field value alignment used by the stringifier.
   *
   * @default "left"
   */
  align?: "left" | "right";
  /**
   * Custom casting applied while parsing.
   */
  cast?: (
    value: string,
    context: { column: number; line: number; width: number }
  ) => any;
  /**
   * Custom way of writing the value to the file
   */
  stringify?: (
    value: any
  ) => string;
  /**
   * Field's column number. This is 1-based. First column is 1.
   */
  column?: number;
  /**
   * Field-level padding value. Must be one char (byte).
   */
  pad?: string;
  /**
   * Name (or symbol) of matching property for this field.
   *
   * When parsing, this is the name of the property where the value will be saved. When serializing, this is the property name to read.
   *
   * If not specified, the parsed will output an array of values, and the stringifier will expect an array of values as input.
   */
  property?: string | Symbol;
  /**
   * String trimming when parsing.
   * - `true`: trim the field's value
   * - `false`: do not trim the field's value
   * - `"left"`: trim the left of the field's value
   * - `"right"`: trim the right of the field's value
   * - `"auto"`: guess trim by field's alignment
   * 
   * Defaults to global `trim` option.
   */
  trim?: boolean | "left" | "right" | "auto";
  /**
   * Field width (chars). Required.
   */
  width: number;
}

export declare class Parser<T = unknown> {
  /**
   * Get a [Transform](https://nodejs.org/api/stream.html#class-streamtransform) stream (Node.js).
   */
  static stream(options: Options): Transform;
  /**
   * @constructor
   */
  constructor(options: Options);
  /**
   * Push a chunk of text. Returns an iterable that yields the parsed objects.
   */
  write(chunk: string | Buffer): Iterable<T>;
  /**
   * Returns a final iterable that yields the remaining objects (if any).
   */
  end(): Iterable<T>;
}

export declare class Stringifier {
  /**
   * Get a [Transform](https://nodejs.org/api/stream.html#class-streamtransform) stream (Node.js).
   */
  static stream(options: Options): Transform;
  /**
   * @constructor
   */
  constructor(options: Options);
  /**
   * Push an object to serialize. Returns the serialized text of the passed object, including new line terminators.
   */
  write(obj: object): string;
  /**
   * Close the parsing and returns a final string.
   */
  end(): string;
}

/**
 * Parse objects from buffer or text.
 *
 * If the argument is string or buffer, the output will be an array. The whole conversion is performed at the moment and in-memory.
 *
 * If the argument is some kind of iterable (sync or async), the output will be the same kind of inputted iterable.
 */
export declare function parse<T = unknown>(
  input: string | Buffer,
  options: Options
): T[];
export declare function parse<T = unknown>(
  input: Iterable<string | Buffer>,
  options: Options
): Iterable<T>;
export declare function parse<T = unknown>(
  input: AsyncIterable<string | Buffer>,
  options: Options
): AsyncIterable<T>;

/**
 * Stringify objects to text.
 *
 * If the argument is an array, the output will be a string. The whole conversion is performed at the moment and in-memory.
 *
 * If the argument is some kind of iterable (sync or async), the output will be the same kind of inputted iterable.
 */
export declare function stringify(input: any[], options: Options): string;
export declare function stringify(
  input: Iterable<any>,
  options: Options
): Iterable<string>;
export declare function stringify(
  input: AsyncIterable<any>,
  options: Options
): AsyncIterable<string>;
