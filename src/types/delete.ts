import type { Table, TableName } from "./core";
import type { ConditionExpression, WherePart } from "./conditions";

/** String-literal DELETE statement constrained by the table schema. */
export type Delete<
  TTable extends Table<string, any>,
  W extends ConditionExpression<TTable> | undefined = undefined
> = `DELETE FROM ${TableName<TTable>}${WherePart<W>}`;
