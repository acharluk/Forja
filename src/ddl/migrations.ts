import type { CreateTableBuilder } from "./createTable";
import { createTable } from "./createTable";
import type { TableDefinition } from "./schema";

/** Runtime configuration for planning table-creation migrations. */
export type MigrationPlannerOptions = {
  /** Tables already present in the database. */
  existingTables?: readonly string[];

  /** Whether generated CREATE TABLE statements should include IF NOT EXISTS (default true). */
  ifNotExists?: boolean;
};

/** Represents a CREATE TABLE statement that still needs to run. */
export type PendingMigration = {
  table: string;
  statement: string;
  builder: CreateTableBuilder<TableDefinition<string, any>>;
};

/**
 * Summary of which tables already exist, which were skipped, and which require
 * CREATE TABLE statements.
 */
export type MigrationPlan<TDefs extends readonly TableDefinition<any, any>[]> =
  {
    pending: PendingMigration[];
    skipped: string[];
    existing: string[];
    tables: TDefs;
  };

const normalizeTableName = (name: string) => name.toLowerCase();

/** Determines which CREATE TABLE statements are needed for the supplied schema. */
export const planMigrations = <
  TDefs extends readonly TableDefinition<any, any>[]
>(
  definitions: TDefs,
  options: MigrationPlannerOptions = {}
): MigrationPlan<TDefs> => {
  const existing = new Set(
    (options.existingTables ?? []).map((table) => normalizeTableName(table))
  );
  const pending: PendingMigration[] = [];
  const skipped: string[] = [];

  for (const definition of definitions) {
    if (existing.has(normalizeTableName(definition.name))) {
      skipped.push(definition.name);
      continue;
    }

    const builder = createTable(definition);
    if (options.ifNotExists ?? true) builder.ifNotExists();
    pending.push({
      table: definition.name,
      statement: builder.build(),
      builder,
    });
  }

  return {
    pending,
    skipped,
    existing: [...existing],
    tables: definitions,
  };
};

/** Convenience helper that captures table definitions and exposes `.plan()`. */
export const defineDatabase = <
  TDefs extends readonly TableDefinition<any, any>[]
>(
  ...tables: TDefs
) => ({
  tables,
  plan: (options?: MigrationPlannerOptions) => planMigrations(tables, options),
});
