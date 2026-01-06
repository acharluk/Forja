import { quoteValue } from "../runtime/sqlStrings";
import type {
  ColumnDefault,
  ColumnDefinition,
  TableDefinition,
} from "./schema";

type CreateTableOptions = {
  ifNotExists?: boolean;
};

const renderDefault = (value: ColumnDefault): string =>
  typeof value === "object" && value !== null && "raw" in value
    ? value.raw
    : quoteValue(value);

const renderColumnDefinition = (
  name: string,
  definition: ColumnDefinition
): string => {
  const parts: string[] = [name, definition.sqlType];

  if (definition.autoIncrement) parts.push("AUTOINCREMENT");
  if (!definition.nullable) parts.push("NOT NULL");
  if (definition.unique) parts.push("UNIQUE");
  if (definition.default !== undefined)
    parts.push(`DEFAULT ${renderDefault(definition.default)}`);
  if (definition.references) {
    parts.push(
      `REFERENCES ${definition.references.table}(${definition.references.column})`
    );
  }
  if (definition.primaryKey) parts.push("PRIMARY KEY");

  return parts.join(" ");
};

const buildCreateTableSql = <
  TDef extends TableDefinition<string, Record<string, ColumnDefinition>>
>(
  definition: TDef,
  options: CreateTableOptions
): string => {
  const columnEntries = Object.entries(definition.columns);
  if (!columnEntries.length) {
    throw new Error(
      `Table "${definition.name}" must define at least one column.`
    );
  }

  const body = columnEntries
    .map(
      ([columnName, columnDefinition]) =>
        `  ${renderColumnDefinition(columnName, columnDefinition)}`
    )
    .join(",\n");

  const ifNotExists = options.ifNotExists ? " IF NOT EXISTS" : "";
  return `CREATE TABLE${ifNotExists} ${definition.name} (\n${body}\n)`;
};

/** Builder for rendering CREATE TABLE statements from definitions. */
export class CreateTableBuilder<
  TDef extends TableDefinition<string, Record<string, ColumnDefinition>>
> {
  private readonly options: CreateTableOptions = {};

  constructor(private readonly definition: TDef) {}

  /** Adds an `IF NOT EXISTS` guard to the emitted CREATE TABLE statement. */
  ifNotExists(): this {
    this.options.ifNotExists = true;
    return this;
  }

  /** Materializes the CREATE TABLE statement as a SQL string. */
  build(): string {
    return buildCreateTableSql(this.definition, this.options);
  }

  /** Alias for `build()` to support string coercion. */
  toString(): string {
    return this.build();
  }

  [Symbol.toPrimitive](): string {
    return this.build();
  }
}

/** Entry point for turning a table definition into a CREATE TABLE builder. */
export const createTable = <
  TDef extends TableDefinition<string, Record<string, ColumnDefinition>>
>(
  definition: TDef
): CreateTableBuilder<TDef> => new CreateTableBuilder(definition);
