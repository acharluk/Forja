import type { TableHandle } from "./table";
import type {
  Column,
  ConditionExpression,
  Select,
  SelectOptions,
  Table,
  TableName,
} from "../types";
import type { ColumnProxy } from "./conditions";
import { createColumnProxy } from "./conditions";
import { conditionToSql } from "./sqlStrings";

type QueryConfig<TTable extends Table<string, any>> = {
  tableName: TableName<TTable>;
  columns?: Column<TTable>[];
  where?: ConditionExpression<TTable>;
  orderBy?: { column: Column<TTable>; direction?: "ASC" | "DESC" };
  limit?: number;
  offset?: number;
};

type Simplify<T> = { [K in keyof T]: T[K] };

type MergeSelectOptions<
  TTable extends Table<string, any>,
  Base extends SelectOptions<TTable>,
  Update extends Partial<SelectOptions<TTable>>
> = Simplify<{
  columns: Update extends { columns: infer C } ? C : Base["columns"];
  where: Update extends { where: infer W } ? W : Base["where"];
  orderBy: Update extends { orderBy: infer O } ? O : Base["orderBy"];
  limit: Update extends { limit: infer L } ? L : Base["limit"];
  offset: Update extends { offset: infer Off } ? Off : Base["offset"];
}>;

type OrderTuple<
  Col extends string,
  Dir extends "ASC" | "DESC" | undefined
> = Dir extends "ASC" | "DESC" ? readonly [Col, Dir] : readonly [Col];

/** Serializes the accumulated builder configuration into a SELECT statement. */
const buildSelectSql = <TTable extends Table<string, any>>(
  config: QueryConfig<TTable>
): string => {
  const columns = config.columns?.length ? config.columns.join(", ") : "*";
  const wherePart = config.where
    ? ` WHERE ${conditionToSql(config.where)}`
    : "";

  let orderPart = "";
  if (config.orderBy) {
    orderPart = ` ORDER BY ${config.orderBy.column}`;
    if (config.orderBy.direction) {
      orderPart += ` ${config.orderBy.direction}`;
    }
  }

  const limitPart =
    typeof config.limit === "number" ? ` LIMIT ${config.limit}` : "";
  const offsetPart =
    typeof config.offset === "number" ? ` OFFSET ${config.offset}` : "";
  return `SELECT ${columns} FROM ${config.tableName}${wherePart}${orderPart}${limitPart}${offsetPart}`;
};

/** Builder for composing schema-aware SELECT statements at runtime. */
export class SelectBuilder<
  TTable extends Table<string, any>,
  TOpts extends SelectOptions<TTable> = {}
> {
  private constructor(private readonly config: QueryConfig<TTable>) {}

  /** Creates a builder initialized for the provided table name. */
  static create<TTable extends Table<string, any>>(
    tableName: TableName<TTable>
  ): SelectBuilder<TTable, {}> {
    return new SelectBuilder<TTable, {}>({ tableName });
  }

  private next<NextOpts extends SelectOptions<TTable>>(
    patch: Partial<QueryConfig<TTable>>
  ): SelectBuilder<TTable, NextOpts> {
    return new SelectBuilder<TTable, NextOpts>({ ...this.config, ...patch });
  }

  /** Limits the SELECT statement to the provided set of columns. */
  columns<Cols extends readonly [Column<TTable>, ...Column<TTable>[]]>(
    ...cols: Cols
  ): SelectBuilder<
    TTable,
    MergeSelectOptions<TTable, TOpts, { columns: Cols }>
  > {
    const nextColumns = [...cols];
    return this.next<MergeSelectOptions<TTable, TOpts, { columns: Cols }>>({
      columns: nextColumns,
    });
  }

  /** Applies a schema-aware WHERE clause through literals or a column proxy. */
  where<Where extends ConditionExpression<TTable>>(
    input: Where | ((cols: ColumnProxy<TTable>) => Where)
  ): SelectBuilder<
    TTable,
    MergeSelectOptions<TTable, TOpts, { where: Where }>
  > {
    const condition =
      typeof input === "function" ? input(createColumnProxy<TTable>()) : input;
    return this.next<MergeSelectOptions<TTable, TOpts, { where: Where }>>({
      where: condition,
    });
  }

  /** Sets the ORDER BY clause using a column plus optional direction. */
  orderBy<
    Col extends Column<TTable>,
    Dir extends "ASC" | "DESC" | undefined = undefined
  >(
    column: Col,
    direction?: Dir
  ): SelectBuilder<
    TTable,
    MergeSelectOptions<TTable, TOpts, { orderBy: OrderTuple<Col, Dir> }>
  > {
    return this.next<
      MergeSelectOptions<TTable, TOpts, { orderBy: OrderTuple<Col, Dir> }>
    >({
      orderBy: { column, direction },
    });
  }

  /** Adds a LIMIT clause to the statement. */
  limit<Value extends number>(
    value: Value
  ): SelectBuilder<
    TTable,
    MergeSelectOptions<TTable, TOpts, { limit: Value }>
  > {
    return this.next<MergeSelectOptions<TTable, TOpts, { limit: Value }>>({
      limit: value,
    });
  }

  /** Adds an OFFSET clause to the statement. */
  offset<Value extends number>(
    value: Value
  ): SelectBuilder<
    TTable,
    MergeSelectOptions<TTable, TOpts, { offset: Value }>
  > {
    return this.next<MergeSelectOptions<TTable, TOpts, { offset: Value }>>({
      offset: value,
    });
  }

  /** Materializes the SELECT statement as a typed SQL string. */
  build(): Select<TTable, TOpts> {
    return buildSelectSql(this.config) as Select<TTable, TOpts>;
  }

  /** Alias for `build()` so builders stringify cleanly. */
  toString(): Select<TTable, TOpts> {
    return this.build();
  }

  [Symbol.toPrimitive](): Select<TTable, TOpts> {
    return this.build();
  }
}

/** Normalizes table handle inputs down to a string literal name. */
const resolveTableName = <TTable extends Table<string, any>>(
  input: TableHandle<TTable> | TableName<TTable>
): TableName<TTable> => (typeof input === "string" ? input : input.name);

/** Entry point for constructing a schema-aware SELECT statement. */
export const select = <TTable extends Table<string, any>>(
  input: TableHandle<TTable> | TableName<TTable>
): SelectBuilder<TTable> =>
  SelectBuilder.create<TTable>(resolveTableName(input));
