import { createTable, type Table, type TableDefinition, tableRef, update } from "../src";

type Users = Table<
  "users",
  {
    id: number;
    active: boolean;
  }
>;

const UsersTable = tableRef<Users>("users");

describe("Error paths", () => {
  it("throws if UPDATE has an empty set", () => {
    const builder = update(UsersTable).set({} as any);

    expect(() => builder.build()).toThrow(
      "UPDATE statements require at least one column in set().",
    );
  });

  it("throws if CREATE TABLE has no columns", () => {
    const invalidDefinition: TableDefinition<"empty", Record<string, any>> = {
      name: "empty",
      columns: {} as any,
    };

    expect(() => createTable(invalidDefinition).build()).toThrow(
      'Table "empty" must define at least one column.',
    );
  });
});
