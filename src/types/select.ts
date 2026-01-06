import type { Column, Join, Table, TableName } from "./core";
import type { ConditionExpression, WherePart } from "./conditions";

/** Options that describe a SELECT query at the type level. */
export type SelectOptions<TTable extends Table<string, any>> = {
  columns?: readonly Column<TTable>[];
  where?: ConditionExpression<TTable>;
  orderBy?:
    | readonly [Column<TTable>, "ASC" | "DESC"]
    | readonly [Column<TTable>];
  limit?: number;
  offset?: number;
};

type ColumnsPart<
  TTable,
  Cols extends readonly Column<TTable>[] | undefined
> = Cols extends readonly Column<TTable>[] ? Join<Cols> : "*";

type OrderPart<O> = O extends readonly [
  infer Col extends string,
  infer Dir extends "ASC" | "DESC"
]
  ? ` ORDER BY ${Col} ${Dir}`
  : O extends readonly [infer Col extends string]
  ? ` ORDER BY ${Col}`
  : "";

type LimitPart<L> = L extends number ? ` LIMIT ${L}` : "";
type OffsetPart<O> = O extends number ? ` OFFSET ${O}` : "";

/** String-literal SELECT statement tied to the supplied table and options. */
export type Select<
  TTable extends Table<string, any>,
  Opts extends SelectOptions<TTable> = {}
> = `SELECT ${ColumnsPart<
  TTable,
  Opts["columns"]
>} FROM ${TableName<TTable>}${WherePart<Opts["where"]>}${OrderPart<
  Opts["orderBy"]
>}${LimitPart<Opts["limit"]>}${OffsetPart<Opts["offset"]>}`;
