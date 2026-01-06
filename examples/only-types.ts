import type { Delete, Insert, Select, Table, Update } from "../src";

console.log("\n=== Only Types Example ===");

type Users = Table<
  "users",
  {
    id: number;
    name: string;
    email: string;
    active: boolean;
    created_at: string;
  }
>;

type InsertUserType = Insert<
  Users,
  {
    columns: ["name", "email"];
    values: ["John Doe", "john.doe@example.com"];
  }
>;
const insertUserSQL: InsertUserType = `INSERT INTO users (name, email) VALUES ('John Doe', 'john.doe@example.com')`;
console.log("Insert User SQL:", insertUserSQL);

type UpdateUserType = Update<
  Users,
  {
    set: {
      active: false;
    };
    where: {
      col: "id";
      kind: "eq";
      val: 1;
    };
  }
>;
const updateUserSQL: UpdateUserType = `UPDATE users SET active = false WHERE id = 1`;
console.log("Update User SQL:", updateUserSQL);

type SelectActiveUsersType = Select<
  Users,
  {
    columns: ["id", "name", "email"];
    where: {
      col: "active";
      kind: "eq";
      val: true;
    };
  }
>;
const selectActiveUsersSQL: SelectActiveUsersType = `SELECT id, name, email FROM users WHERE active = true`;
console.log("Select Active Users SQL:", selectActiveUsersSQL);

type DeleteInactiveUsersType = Delete<
  Users,
  {
    col: "active";
    kind: "eq";
    val: false;
  }
>;
const deleteInactiveUsersSQL: DeleteInactiveUsersType = `DELETE FROM users WHERE active = false`;
console.log("Delete Inactive Users SQL:", deleteInactiveUsersSQL);

type ComplexSelectType = Select<
  Users,
  {
    columns: ["id", "name", "email", "created_at"];
    where: {
      kind: "and";
      left: {
        col: "active";
        kind: "eq";
        val: true;
      };
      right: {
        kind: "or";
        left: {
          col: "email";
          kind: "eq";
          val: "vip@example.com";
        };
        right: {
          col: "name";
          kind: "eq";
          val: "Admin";
        };
      };
    };
    orderBy: ["created_at", "DESC"];
    limit: 10;
    offset: 20;
  }
>;

const complexSelectSQL: ComplexSelectType =
  "SELECT id, name, email, created_at FROM users WHERE (active = true) AND ((email = vip@example.com) OR (name = Admin)) ORDER BY created_at DESC LIMIT 10 OFFSET 20";
console.log("Complex Select SQL:", complexSelectSQL);
