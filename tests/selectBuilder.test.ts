import { select, type Table, tableRef } from "../src";

type Users = Table<
  "users",
  {
    id: number;
    name: string;
    active: boolean;
  }
>;

const UsersTable = tableRef<Users>("users");

describe("Select builder", () => {
  it("builds a basic select statement", () => {
    const sql = select(UsersTable)
      .columns("id", "name")
      .where((cols) => cols.active.eq(true))
      .orderBy("name")
      .limit(10)
      .offset(5)
      .build();

    expect(sql).toBe(
      "SELECT id, name FROM users WHERE active = true ORDER BY name LIMIT 10 OFFSET 5",
    );
  });
});
