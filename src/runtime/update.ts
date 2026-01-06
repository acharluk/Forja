import type { TableHandle } from "./table";
import type {
  Column,
  ConditionExpression,
  Table,
  TableName,
  TableSchema,
  Update,
  UpdateOptions,
} from "../types";
import type { ColumnProxy } from "./conditions";
import { createColumnProxy } from "./conditions";
import { buildUpdateSql } from "./sqlStrings";

type UpdateSetInput<TTable extends Table<string, any>> = Partial<
  Record<Column<TTable>, TableSchema<TTable>[Column<TTable>]>
>;

type EnsureNonEmpty<T> = keyof T extends never ? never : T;

type Simplify<T> = { [K in keyof T]: T[K] };

type MergeUpdateOptions<
  TTable extends Table<string, any>,
  Base extends UpdateOptions<TTable>,
  UpdateShape extends Partial<UpdateOptions<TTable>>
> = Simplify<{
  set: UpdateShape extends { set: infer S } ? S : Base["set"];
  where: UpdateShape extends { where: infer W } ? W : Base["where"];
}>;

type UpdateConfig<
  TTable extends Table<string, any>,
  TSet extends UpdateSetInput<TTable>
> = {
  tableName: TableName<TTable>;
  set: TSet;
  where?: ConditionExpression<TTable>;
};

/** Builder for composing schema-aware UPDATE statements. */
export class UpdateBuilder<
  TTable extends Table<string, any>,
  TOpts extends UpdateOptions<TTable>
> {
  private constructor(
    private readonly config: UpdateConfig<TTable, TOpts["set"]>
  ) {}

  /** Creates an update builder for a table with the initial SET payload. */
  static create<
    TTable extends Table<string, any>,
    TSet extends UpdateSetInput<TTable>
  >(
    tableName: TableName<TTable>,
    set: EnsureNonEmpty<TSet>
  ): UpdateBuilder<TTable, { set: TSet }> {
    return new UpdateBuilder<TTable, { set: TSet }>({ tableName, set });
  }

  /** Applies a WHERE clause via literal object or column proxy callback. */
  where<Where extends ConditionExpression<TTable>>(
    input: Where | ((cols: ColumnProxy<TTable>) => Where)
  ): UpdateBuilder<
    TTable,
    MergeUpdateOptions<TTable, TOpts, { where: Where }>
  > {
    const condition =
      typeof input === "function" ? input(createColumnProxy<TTable>()) : input;
    return new UpdateBuilder<
      TTable,
      MergeUpdateOptions<TTable, TOpts, { where: Where }>
    >({
      ...this.config,
      where: condition,
    });
  }

  /** Materializes the UPDATE statement and validates the SET payload. */
  build(): Update<TTable, TOpts> {
    const entries = Object.entries(this.config.set) as [string, unknown][];
    if (!entries.length) {
      throw new Error(
        "UPDATE statements require at least one column in set()."
      );
    }
    return buildUpdateSql(
      this.config.tableName,
      entries,
      this.config.where
    ) as Update<TTable, TOpts>;
  }

  /** Alias for `build()` to play nicely with template literals. */
  toString(): Update<TTable, TOpts> {
    return this.build();
  }

  [Symbol.toPrimitive](): Update<TTable, TOpts> {
    return this.build();
  }
}

/** Initial builder responsible for capturing the `set()` payload. */
export class UpdateSetBuilder<TTable extends Table<string, any>> {
  constructor(private readonly tableName: TableName<TTable>) {}

  /** Accepts the map of columns to update and returns the full builder. */
  set<Changes extends UpdateSetInput<TTable>>(
    changes: EnsureNonEmpty<Changes>
  ): UpdateBuilder<TTable, { set: Changes }> {
    return UpdateBuilder.create<TTable, Changes>(this.tableName, changes);
  }
}

/** Normalizes table handles down to their literal names. */
const resolveTableName = <TTable extends Table<string, any>>(
  input: TableHandle<TTable> | TableName<TTable>
): TableName<TTable> => (typeof input === "string" ? input : input.name);

/** Entry point for constructing schema-aware UPDATE statements. */
export const update = <TTable extends Table<string, any>>(
  input: TableHandle<TTable> | TableName<TTable>
): UpdateSetBuilder<TTable> =>
  new UpdateSetBuilder<TTable>(resolveTableName(input));
