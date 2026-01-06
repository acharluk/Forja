import { insert, type Table, tableRef } from "../src";

type Users = Table<
  "users",
  {
    id: number;
    name: string;
    email: string;
  }
>;

const UsersTable = tableRef<Users>("users");

describe("Insert builder", () => {
  it("builds insert statements with typed columns", () => {
    const sql = insert(UsersTable)
      .columns("name", "email")
      .values("alex", "alex@example.com")
      .build();

    expect(sql).toBe("INSERT INTO users (name, email) VALUES ('alex', 'alex@example.com')");
  });
});
