import type { TableHandle } from "./table";
import type { ConditionExpression, Delete, Table, TableName } from "../types";
import type { ColumnProxy } from "./conditions";
import { createColumnProxy } from "./conditions";
import { buildDeleteSql } from "./sqlStrings";

type DeleteConfig<TTable extends Table<string, any>> = {
  tableName: TableName<TTable>;
  where?: ConditionExpression<TTable>;
};

/** Builder for composing schema-aware DELETE statements. */
export class DeleteBuilder<
  TTable extends Table<string, any>,
  TWhere extends ConditionExpression<TTable> | undefined = undefined
> {
  private constructor(private readonly config: DeleteConfig<TTable>) {}

  /** Initializes the builder for a specific table. */
  static create<TTable extends Table<string, any>>(
    tableName: TableName<TTable>
  ): DeleteBuilder<TTable, undefined> {
    return new DeleteBuilder<TTable, undefined>({ tableName });
  }

  /** Adds a WHERE clause by providing a literal or proxy-based condition. */
  where<Where extends ConditionExpression<TTable>>(
    input: Where | ((cols: ColumnProxy<TTable>) => Where)
  ): DeleteBuilder<TTable, Where> {
    const condition =
      typeof input === "function" ? input(createColumnProxy<TTable>()) : input;
    return new DeleteBuilder<TTable, Where>({
      ...this.config,
      where: condition,
    });
  }

  /** Materializes the DELETE statement as a typed SQL string. */
  build(): Delete<TTable, TWhere> {
    return buildDeleteSql(this.config.tableName, this.config.where) as Delete<
      TTable,
      TWhere
    >;
  }

  /** Alias for `build()` to support string coercion. */
  toString(): Delete<TTable, TWhere> {
    return this.build();
  }

  [Symbol.toPrimitive](): Delete<TTable, TWhere> {
    return this.build();
  }
}

/** Normalizes table references down to literal names. */
const resolveTableName = <TTable extends Table<string, any>>(
  input: TableHandle<TTable> | TableName<TTable>
): TableName<TTable> => (typeof input === "string" ? input : input.name);

/** Entry point for creating schema-aware DELETE statements. */
export const deleteFrom = <TTable extends Table<string, any>>(
  input: TableHandle<TTable> | TableName<TTable>
): DeleteBuilder<TTable> =>
  DeleteBuilder.create<TTable>(resolveTableName(input));
