/** Helpers for working with runtime table handles. */

import type { Table, TableName } from "../types";

/** Lightweight runtime reference to a compile-time `Table`. */
export type TableHandle<TTable extends Table<string, any>> = {
  readonly name: TableName<TTable>;
};

/** Creates a runtime table handle bound to the provided literal name. */
export const tableRef = <TTable extends Table<string, any>>(
  name: TableName<TTable>
): TableHandle<TTable> => ({ name } as const);
