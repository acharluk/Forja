# Forja

Forja is a schema-aware SQL toolkit for TypeScript and Bun projects. It keeps your table definitions, DDL, and CRUD statements in sync while still shipping plain SQL strings that work with any driver.

## Disclaimer

This project is an experiment I built to learn about TypeScript meta-programming. It is not intended for production use.


## Why Forja?

- **Typed tables end-to-end** – declare tables once with `Table` and reuse the types across inserts, selects, updates, and deletes.
- **Ergonomic builders** – fluent helpers (`select()`, `insert()`, `update()`, `deleteFrom()`) emit SQL strings while keeping predicates, column names, and payloads type-safe.
- **DDL primitives** – `defineTableSchema()` plus `createTable()` turn the same metadata into CREATE TABLE statements and migration plans.
- **Driver-agnostic output** – the builders return strings, so you can drop them into `bun:sqlite`, `postgres`, Drizzle, or any HTTP API that expects SQL.
- **Bun-first DX** – runs on Bun’s runtime with zero transpiler gymnastics and pairs nicely with `bun build` when you’re ready to publish.

<!-- Not yet published -->
<!-- ## Installation

```bash
bun add @forja/sql
``` -->

## Quick start

```ts
import { column, createTable, defineTableSchema, insert, select, tableRef, type Table } from "@forja/sql";

type Users = Table<
 "users",
 {
  id: number;
  email: string;
  name: string;
  active: boolean;
 }
>;

const Users = tableRef<Users>("users");

// Describe the schema once
const UsersSchema = defineTableSchema(Users, {
 id: column.integer({ primaryKey: true, autoIncrement: true }),
 email: column.varchar(255, { unique: true }),
 name: column.varchar(255),
 active: column.boolean({ default: true }),
});

// Emit DDL
const createUsersTable = createTable(UsersSchema).ifNotExists().build();

// Compose data builders
const insertUser = insert(Users)
 .columns("email", "name")
 .values("dev@example.com", "Dev Person")
 .build();

const activeUsers = select(Users)
 .columns("id", "email", "name")
 .where((user) => user.active.eq(true))
 .orderBy("id", "DESC")
 .build();
```

Every call to `build()` (or simple string coercion) produces SQL such as:

```
CREATE TABLE IF NOT EXISTS users (
 id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
 email VARCHAR(255) NOT NULL UNIQUE,
 name VARCHAR(255) NOT NULL,
 active BOOLEAN NOT NULL DEFAULT false
)

INSERT INTO users (email, name) VALUES ('dev@example.com', 'Dev Person')

SELECT id, email, name FROM users WHERE active = true ORDER BY id DESC
```

## Working with mutations

```ts
import { deleteFrom, update } from "@forja/sql";

const deactivateUser = update(Users)
 .set({ active: false })
 .where((user) => user.id.eq(42))
 .build();

const purgeDormant = deleteFrom(Users)
 .where((user) => user.active.eq(false))
 .build();
```

Because the builders understand the table schema, the compiler guards against missing columns, mismatched data types, or forgotten WHERE clauses.

## DDL & migration planning

```ts
import { column, defineDatabase, defineTableSchema } from "@forja/sql";

const Posts = tableRef<Table<"posts", { id: number; user_id: number; title: string }>>("posts");

const PostsSchema = defineTableSchema(Posts, {
 id: column.integer({ primaryKey: true, autoIncrement: true }),
 user_id: column.integer({ references: { table: "users", column: "id" } }),
 title: column.text(),
});

const db = defineDatabase(UsersSchema, PostsSchema);
const plan = db.plan({ existingTables: ["users"] });

plan.pending.forEach(({ table, statement }) => {
 console.log(`Run migration for ${table}:`);
 console.log(statement);
});
```

`plan.pending` only includes tables that aren’t listed in `existingTables`, making it easy to drive your own migrator.

## Type-only helpers

Need compile-time validation without touching the builders? Use the exported helper types:

```ts
import type { Insert, Select, Update, Delete } from "@forja/sql";

type InsertUser = Insert<Users, { columns: ["email", "name"]; values: [string, string] }>;
type ActiveUsers = Select<Users, { columns: ["id", "email"]; where: { col: "active"; kind: "eq"; val: true } }>;
type UpdateFlags = Update<Users, { set: { active: boolean }; where: { col: "id"; kind: "eq"; val: number } }>;
type Purge = Delete<Users, { col: "active"; kind: "eq"; val: false }>;
```

Assigning raw SQL strings to these aliases forces you (or your tests) to keep statements aligned with the table shape.

## Local scripts

- `bun run examples` – prints the sample statements found under `examples/`.
- `bun run node:build` – emits `dist/` with ESM + declaration files.
