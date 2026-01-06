import {
  column,
  createTable,
  defineDatabase,
  defineTableSchema,
  type Table,
  tableRef,
} from "../src";

type Users = Table<
  "users",
  {
    id: number;
    email: string;
  }
>;

type Posts = Table<
  "posts",
  {
    id: number;
    user_id: number;
  }
>;

const UsersHandle = tableRef<Users>("users");
const PostsHandle = tableRef<Posts>("posts");

const UsersSchema = defineTableSchema(UsersHandle, {
  id: column.integer({ primaryKey: true, autoIncrement: true }),
  email: column.varchar(255, { unique: true }),
});

const PostsSchema = defineTableSchema(PostsHandle, {
  id: column.integer({ primaryKey: true, autoIncrement: true }),
  user_id: column.integer({ references: { table: "users", column: "id" } }),
});

describe("DDL helpers", () => {
  it("builds CREATE TABLE statements", () => {
    const sql = createTable(UsersSchema).ifNotExists().build();

    expect(sql).toBe(
      "CREATE TABLE IF NOT EXISTS users (\n  id INTEGER AUTOINCREMENT NOT NULL PRIMARY KEY,\n  email VARCHAR(255) NOT NULL UNIQUE\n)",
    );
  });

  it("plans migrations for missing tables", () => {
    const database = defineDatabase(UsersSchema, PostsSchema);

    const plan = database.plan({ existingTables: ["users"] });

    expect(plan.skipped).toEqual(["users"]);
    expect(plan.pending).toHaveLength(1);
    expect(plan.pending[0].table).toBe("posts");
    expect(plan.pending[0].statement).toContain("CREATE TABLE IF NOT EXISTS posts");
  });
});
