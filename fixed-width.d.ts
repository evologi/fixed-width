import { Transform } from "stream";

export interface Options {
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
   * Starting line to parse.
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
   * If `true`, partial lines (total width is less than expected) will not throw any error.
   *
   * @default false
   */
  relax?: boolean;
  /**
   * Ending line to parse.
   *
   * @default Infinity
   */
  to?: number;
  /**
   * String trimming for parsed values.
   * - `true`: trim the string
   * - `false`: do not trim the string
   * - `"left"`: trim the left of the string
   * - `"right"`: trim the righe of the string
   *
   * @default true
   */
  trim?: boolean | "left" | "right";
}

export interface Field {
  /**
   * Field value alignment used by the stringifier.
   *
   * @default "left"
   */
  align?: "left" | "right";
  /**
   * Field's column number. This is 1-based. First column is 1.
   */
  column?: number;
  /**
   * Name (or symbol) of matching property for this field.
   *
   * When parsing, this is the name of the property where the value will be saved. When serializing, this is the property name to read.
   *
   * If not specified, the parsed will output an array of values, and the stringifier will expect an array of values as input.
   */
  property?: string | Symbol;
  /**
   * Field width (chars). Required.
   */
  width: number;
}

export class Parser<T = unknown> {
  /**
   * Get a [Transform](https://nodejs.org/api/stream.html#class-streamtransform) stream (Node.js).
   */
  static stream(options: Options): Transform;
  /**
   * @constructor
   */
  constructor(options: Options);
  end(): Iterable<T>;
  write(input: string | Buffer): Iterable<T>;
}

export class Stringifier {
  /**
   * Get a [Transform](https://nodejs.org/api/stream.html#class-streamtransform) stream (Node.js).
   */
  static stream(options: Options): Transform;
  /**
   * @constructor
   */
  constructor(options: Options);
  end(): Buffer;
  write(iterable: Iterable<any>): Buffer;
}

export declare function parse<T = unknown>(
  input: string | Buffer,
  options: Options
): T[];

export declare function stringify(
  iterable: Iterable<any>,
  options: Options
): string;
