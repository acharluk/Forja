import type {
  Column,
  ColumnName,
  Join,
  Quote,
  Table,
  TableName,
  TableSchema,
} from "./core";

/** Maps a tuple of columns to the appropriately typed tuple of literal values. */
export type ValueTuple<
  S extends Record<string, any>,
  Cols extends readonly ColumnName<S>[]
> = {
  [I in keyof Cols]: Cols[I] extends ColumnName<S> ? S[Cols[I]] : never;
};

type ValuesPart<Vals extends readonly unknown[]> = Vals extends []
  ? ""
  : Vals extends readonly [infer H]
  ? Quote<H>
  : Vals extends readonly [infer H, ...infer R]
  ? `${Quote<H>}, ${ValuesPart<R>}`
  : string;

/** Compile-time description of the columns and row inserted into a table. */
export type InsertOptions<
  TTable extends Table<string, any>,
  Cols extends readonly Column<TTable>[] = readonly Column<TTable>[]
> = {
  columns: Cols;
  values: ValueTuple<TableSchema<TTable>, Cols>;
};

/** String-literal INSERT statement constrained by table schema and values. */
export type Insert<
  TTable extends Table<string, any>,
  Opts extends InsertOptions<TTable>
> = `INSERT INTO ${TableName<TTable>} (${Join<
  Opts["columns"]
>}) VALUES (${ValuesPart<Opts["values"]>})`;

/** Helper ensuring at least one column is provided to INSERT statements. */
export type InsertColumnsTuple<TTable extends Table<string, any>> = readonly [
  Column<TTable>,
  ...Column<TTable>[]
];
