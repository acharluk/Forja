/** Describes a database table with a string literal name and column schema. */
export type Table<Name extends string, Schema extends Record<string, any>> = {
  name: Name;
  schema: Schema;
};

/** Extracts the string literal table name from a `Table` type. */
export type TableName<T> = T extends Table<infer N, any> ? N : never;

/** Extracts the column definition map from a `Table` type. */
export type TableSchema<T> = T extends Table<any, infer S> ? S : never;

/** Narrows the set of valid column keys to string literals only. */
export type ColumnName<S> = Extract<keyof S, string>;

/** Returns the union of valid column names for a given `Table`. */
export type Column<T> = ColumnName<TableSchema<T>>;

/** Converts primitive values into interpolated string literal segments. */
export type Str<V> = V extends string | number | bigint | boolean
  ? `${V}`
  : never;

/** Quotes string literal values while preserving other primitive representations. */
export type Quote<V> = V extends string ? `'${V}'` : Str<V>;

/** Utility that joins string literal tuples using a separator. */
export type Join<
  T extends readonly string[],
  Sep extends string = ", "
> = T extends []
  ? ""
  : T extends readonly [infer H extends string]
  ? H
  : T extends readonly [
      infer H extends string,
      ...infer R extends readonly string[]
    ]
  ? `${H}${Sep}${Join<R, Sep>}`
  : string;
