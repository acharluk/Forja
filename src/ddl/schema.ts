import type { TableHandle } from "../runtime/table";
import type { Column, Table, TableName } from "../types";

/** Represents a raw SQL default expression (e.g. CURRENT_TIMESTAMP). */
export type RawDefault = { raw: string };

/** Supported literal default values for a column definition. */
export type ColumnDefault = string | number | boolean | RawDefault;

/** Options for defining a foreign-key reference constraint. */
export type ReferenceOptions = {
  table: string;
  column: string;
};

/** Declarative flags that customize column constraints and metadata. */
export type ColumnOptions = {
  /** Whether the column may be NULL. Defaults to false. */
  nullable?: boolean;

  /** Default value for the column. */
  default?: ColumnDefault;

  /** Marks the column as part of the primary key. */
  primaryKey?: boolean;

  /** Adds a UNIQUE constraint. */
  unique?: boolean;

  /** Adds AUTOINCREMENT (vendor support may vary). */
  autoIncrement?: boolean;

  /** Adds a foreign-key reference. */
  references?: ReferenceOptions;
};

/** Fully normalized column configuration emitted by the column helpers. */
export type ColumnDefinition = ColumnOptions & {
  sqlType: string;
  nullable: boolean;
};

const normalizeColumn = (
  sqlType: string,
  options: ColumnOptions = {}
): ColumnDefinition => {
  const { nullable, ...rest } = options;
  return {
    sqlType,
    nullable: nullable ?? false,
    ...rest,
  };
};

/** Convenience helpers for defining strongly typed column schemas. */
export const column = {
  integer: (options?: ColumnOptions) => normalizeColumn("INTEGER", options),
  bigInteger: (options?: ColumnOptions) => normalizeColumn("BIGINT", options),
  text: (options?: ColumnOptions) => normalizeColumn("TEXT", options),
  boolean: (options?: ColumnOptions) => normalizeColumn("BOOLEAN", options),
  timestamp: (options?: ColumnOptions) => normalizeColumn("TIMESTAMP", options),
  json: (options?: ColumnOptions) => normalizeColumn("JSON", options),
  uuid: (options?: ColumnOptions) => normalizeColumn("UUID", options),
  varchar: (length: number, options?: ColumnOptions) =>
    normalizeColumn(`VARCHAR(${length})`, options),
  custom: (sqlType: string, options?: ColumnOptions) =>
    normalizeColumn(sqlType, options),
};

/** Maps every column from a `Table` to its DDL column definition. */
export type SchemaColumnsForTable<
  TTable extends Table<string, Record<string, any>>
> = {
  [K in Column<TTable>]: ColumnDefinition;
};

/** Represents the DDL schema for a table including its columns. */
export type TableDefinition<
  Name extends string = string,
  Columns extends Record<string, ColumnDefinition> = Record<
    string,
    ColumnDefinition
  >
> = {
  name: Name;
  columns: Columns;
};

type AnyTable = Table<string, Record<string, any>>;

/** Creates a table schema tied to an existing typed table handle. */
export function defineTableSchema<
  TTable extends AnyTable,
  Columns extends SchemaColumnsForTable<TTable>
>(
  table: TableHandle<TTable>,
  columns: Columns
): TableDefinition<TableName<TTable>, Columns>;

/** Creates a table schema based on an explicit string literal name. */
export function defineTableSchema<
  TTable extends AnyTable,
  Columns extends SchemaColumnsForTable<TTable>
>(
  name: TableName<TTable>,
  columns: Columns
): TableDefinition<TableName<TTable>, Columns>;

/** Implementation signature shared by both overloads above. */
export function defineTableSchema<
  Name extends string,
  Columns extends Record<string, ColumnDefinition>
>(
  nameOrHandle: Name | TableHandle<Table<Name, Record<string, any>>>,
  columns: Columns
): TableDefinition<Name, Columns> {
  const name =
    typeof nameOrHandle === "string" ? nameOrHandle : nameOrHandle.name;
  return {
    name,
    columns,
  };
}
