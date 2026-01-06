import { type Table, tableRef, update } from "../src";

type Users = Table<
  "users",
  {
    id: number;
    name: string;
    active: boolean;
  }
>;

const UsersTable = tableRef<Users>("users");

describe("Update builder", () => {
  it("builds update statements with where clause", () => {
    const sql = update(UsersTable)
      .set({ active: false })
      .where((cols) => cols.id.eq(1))
      .build();

    expect(sql).toBe("UPDATE users SET active = false WHERE id = 1");
  });
});
