import type { Column, ConditionExpression, Table, TableSchema } from "../types";

/** Runtime proxy that exposes type-safe predicate helpers for every column. */
export type ColumnProxy<TTable extends Table<string, any>> = {
  [K in Column<TTable>]: ColumnPredicateOps<TTable, K>;
};

type ColumnPredicateOps<
  TTable extends Table<string, any>,
  K extends Column<TTable>
> = {
  eq<V extends TableSchema<TTable>[K]>(
    value: V
  ): {
    kind: "eq";
    col: K;
    val: V;
  };
  ne<V extends TableSchema<TTable>[K]>(
    value: V
  ): {
    kind: "ne";
    col: K;
    val: V;
  };
  gt<V extends TableSchema<TTable>[K]>(
    value: V
  ): {
    kind: "gt";
    col: K;
    val: V;
  };
  gte<V extends TableSchema<TTable>[K]>(
    value: V
  ): {
    kind: "gte";
    col: K;
    val: V;
  };
  lt<V extends TableSchema<TTable>[K]>(
    value: V
  ): {
    kind: "lt";
    col: K;
    val: V;
  };
  lte<V extends TableSchema<TTable>[K]>(
    value: V
  ): {
    kind: "lte";
    col: K;
    val: V;
  };
};

/** Creates the suite of predicate helpers for a single column name. */
const createColumnOps = <
  TTable extends Table<string, any>,
  K extends Column<TTable>
>(
  column: K
): ColumnPredicateOps<TTable, K> => ({
  eq: (value) => ({ kind: "eq", col: column, val: value }),
  ne: (value) => ({ kind: "ne", col: column, val: value }),
  gt: (value) => ({ kind: "gt", col: column, val: value }),
  gte: (value) => ({ kind: "gte", col: column, val: value }),
  lt: (value) => ({ kind: "lt", col: column, val: value }),
  lte: (value) => ({ kind: "lte", col: column, val: value }),
});

/** Lazily builds a memoized proxy object whose properties map to column predicates. */
export const createColumnProxy = <
  TTable extends Table<string, any>
>(): ColumnProxy<TTable> => {
  const cache = new Map<string, any>();
  return new Proxy(
    {},
    {
      get: (_, prop: PropertyKey) => {
        if (typeof prop !== "string") return undefined;
        if (!cache.has(prop)) {
          cache.set(
            prop,
            createColumnOps<TTable, Column<TTable>>(prop as Column<TTable>)
          );
        }
        return cache.get(prop);
      },
    }
  ) as ColumnProxy<TTable>;
};

/** Combines two condition expressions with an AND logical operator. */
export const and = <TTable extends Table<string, any>>(
  left: ConditionExpression<TTable>,
  right: ConditionExpression<TTable>
): ConditionExpression<TTable> => ({ kind: "and", left, right });

/** Combines two condition expressions with an OR logical operator. */
export const or = <TTable extends Table<string, any>>(
  left: ConditionExpression<TTable>,
  right: ConditionExpression<TTable>
): ConditionExpression<TTable> => ({ kind: "or", left, right });
