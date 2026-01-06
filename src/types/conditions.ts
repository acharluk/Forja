import type { Column, Str, Table, TableSchema } from "./core";

type CmpOperator<K> = K extends "eq"
  ? "="
  : K extends "ne"
  ? "!="
  : K extends "gt"
  ? ">"
  : K extends "gte"
  ? ">="
  : K extends "lt"
  ? "<"
  : K extends "lte"
  ? "<="
  : never;

/** Equality comparison between a column and literal value. */
export type Eq<
  TTable,
  Col extends Column<TTable>,
  Val extends TableSchema<TTable>[Col]
> = {
  kind: "eq";
  col: Col;
  val: Val;
};

/** Inequality comparison between a column and literal value. */
export type Ne<
  TTable,
  Col extends Column<TTable>,
  Val extends TableSchema<TTable>[Col]
> = {
  kind: "ne";
  col: Col;
  val: Val;
};

/** Greater-than comparison between a column and literal value. */
export type Gt<
  TTable,
  Col extends Column<TTable>,
  Val extends TableSchema<TTable>[Col]
> = {
  kind: "gt";
  col: Col;
  val: Val;
};

/** Greater-than-or-equal comparison between a column and literal value. */
export type Gte<
  TTable,
  Col extends Column<TTable>,
  Val extends TableSchema<TTable>[Col]
> = {
  kind: "gte";
  col: Col;
  val: Val;
};

/** Less-than comparison between a column and literal value. */
export type Lt<
  TTable,
  Col extends Column<TTable>,
  Val extends TableSchema<TTable>[Col]
> = {
  kind: "lt";
  col: Col;
  val: Val;
};

/** Less-than-or-equal comparison between a column and literal value. */
export type Lte<
  TTable,
  Col extends Column<TTable>,
  Val extends TableSchema<TTable>[Col]
> = {
  kind: "lte";
  col: Col;
  val: Val;
};

/** Logical AND between two condition expressions. */
export type And<A, B> = { kind: "and"; left: A; right: B };

/** Logical OR between two condition expressions. */
export type Or<A, B> = { kind: "or"; left: A; right: B };

/** Union of column-level primitive comparisons for a specific table. */
export type PrimitiveCondition<TTable extends Table<string, any>> = {
  [K in Column<TTable>]:
    | Eq<TTable, K, TableSchema<TTable>[K]>
    | Ne<TTable, K, TableSchema<TTable>[K]>
    | Gt<TTable, K, TableSchema<TTable>[K]>
    | Gte<TTable, K, TableSchema<TTable>[K]>
    | Lt<TTable, K, TableSchema<TTable>[K]>
    | Lte<TTable, K, TableSchema<TTable>[K]>;
}[Column<TTable>];

/** Structured logical node used to combine any condition expressions. */
export interface LogicalCondition<TTable extends Table<string, any>> {
  kind: "and" | "or";
  left: ConditionExpression<TTable>;
  right: ConditionExpression<TTable>;
}

/** Represents either a primitive comparison or nested logical node. */
export type ConditionExpression<TTable extends Table<string, any>> =
  | PrimitiveCondition<TTable>
  | LogicalCondition<TTable>;

/** Formats a condition expression into its SQL literal string representation. */
export type ConditionToString<C> = C extends {
  kind: infer K extends "eq" | "ne" | "gt" | "gte" | "lt" | "lte";
  col: infer Col extends string;
  val: infer V;
}
  ? `${Col} ${CmpOperator<K>} ${Str<V>}`
  : C extends { kind: "and"; left: infer L; right: infer R }
  ? `(${ConditionToString<L>}) AND (${ConditionToString<R>})`
  : C extends { kind: "or"; left: infer L; right: infer R }
  ? `(${ConditionToString<L>}) OR (${ConditionToString<R>})`
  : never;

/** Produces a prefixed WHERE clause string for an optional condition expression. */
export type WherePart<W> = [W] extends [undefined | null]
  ? ""
  : ConditionToString<W> extends never
  ? ""
  : ConditionToString<W> extends string
  ? ` WHERE ${ConditionToString<W>}`
  : "";
