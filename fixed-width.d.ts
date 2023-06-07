import { Transform } from "node:stream";

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
   * Custom casting applied while parsing.
   */
  cast?: (
    value: string,
    context: { column: number; line: number; width: number }
  ) => any;
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
  end(): Iterable<T>;
  write(input: string | Buffer): Iterable<T>;
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
  end(): Iterable<string>;
  write(iterable: Iterable<any>): Iterable<string>;
}

export declare function parse<T = unknown>(
  input: string | Buffer,
  options: Options
): T[];

export declare function stringify(
  iterable: Iterable<any>,
  options: Options
): string;
