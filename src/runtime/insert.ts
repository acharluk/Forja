import type { TableHandle } from "./table";
import type {
  Insert,
  InsertColumnsTuple,
  InsertOptions,
  Table,
  TableName,
  TableSchema,
  ValueTuple,
} from "../types";
import { buildInsertSql } from "./sqlStrings";

type InsertConfig<
  TTable extends Table<string, any>,
  TOpts extends InsertOptions<TTable>
> = {
  tableName: TableName<TTable>;
  columns: TOpts["columns"];
  values: TOpts["values"];
};

/** Terminal builder that can render an INSERT statement string. */
export class InsertStatementBuilder<
  TTable extends Table<string, any>,
  TOpts extends InsertOptions<TTable>
> {
  private constructor(private readonly config: InsertConfig<TTable, TOpts>) {}

  /** Factory used internally by the builders to create statements. */
  static create<
    TTable extends Table<string, any>,
    TOpts extends InsertOptions<TTable>
  >(
    tableName: TableName<TTable>,
    options: TOpts
  ): InsertStatementBuilder<TTable, TOpts> {
    return new InsertStatementBuilder<TTable, TOpts>({
      tableName,
      columns: options.columns,
      values: options.values,
    });
  }

  /** Materializes the INSERT statement as a typed SQL string. */
  build(): Insert<TTable, TOpts> {
    return buildInsertSql(
      this.config.tableName,
      this.config.columns,
      this.config.values
    ) as Insert<TTable, TOpts>;
  }

  /** Alias for `build()` to support string coercion. */
  toString(): Insert<TTable, TOpts> {
    return this.build();
  }

  [Symbol.toPrimitive](): Insert<TTable, TOpts> {
    return this.build();
  }
}

/** Builder responsible for capturing the ordered column list. */
export class InsertColumnsBuilder<TTable extends Table<string, any>> {
  constructor(private readonly tableName: TableName<TTable>) {}

  /** Captures the columns that will appear in the INSERT statement. */
  columns<Cols extends InsertColumnsTuple<TTable>>(
    ...cols: Cols
  ): InsertValuesBuilder<TTable, Cols> {
    return new InsertValuesBuilder<TTable, Cols>(this.tableName, cols);
  }
}

/** Builder that binds concrete values to the previously declared columns. */
export class InsertValuesBuilder<
  TTable extends Table<string, any>,
  Cols extends InsertColumnsTuple<TTable>
> {
  constructor(
    private readonly tableName: TableName<TTable>,
    private readonly columns: Cols
  ) {}

  /** Provides the row values, returning a statement builder ready to render. */
  values(
    ...values: ValueTuple<TableSchema<TTable>, Cols>
  ): InsertStatementBuilder<TTable, InsertOptions<TTable, Cols>> {
    return InsertStatementBuilder.create<TTable, InsertOptions<TTable, Cols>>(
      this.tableName,
      {
        columns: this.columns,
        values,
      }
    );
  }
}

/** Normalizes table references to plain string names. */
const resolveTableName = <TTable extends Table<string, any>>(
  input: TableHandle<TTable> | TableName<TTable>
): TableName<TTable> => (typeof input === "string" ? input : input.name);

/** Entry point for creating schema-aware INSERT statements. */
export const insert = <TTable extends Table<string, any>>(
  input: TableHandle<TTable> | TableName<TTable>
): InsertColumnsBuilder<TTable> =>
  new InsertColumnsBuilder<TTable>(resolveTableName(input));
