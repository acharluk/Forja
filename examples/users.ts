import {
  column,
  createTable,
  defineTableSchema,
  insert,
  select,
  type Table,
  tableRef,
  update,
} from "../src";

console.log("\n=== Users Example ===");

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

const UsersHandle = tableRef<Users>("users");

const UsersSchemaDefinition = defineTableSchema(UsersHandle, {
  id: column.integer({ primaryKey: true, autoIncrement: true }),
  name: column.varchar(255),
  email: column.varchar(255, { unique: true }),
  active: column.boolean({ default: true }),
  created_at: column.timestamp({ default: { raw: "CURRENT_TIMESTAMP" } }),
});

const createUserTableSQL = createTable(UsersSchemaDefinition).build();
console.log(`Create Users Table SQL:`, createUserTableSQL);

const insertNewUserSQL = insert(UsersHandle)
  .columns("name", "email")
  .values("John Doe", "john.doe@example.com")
  .build();
console.log(`Insert New User SQL:`, insertNewUserSQL);

const selectActiveUsersSQL = select(UsersHandle)
  .columns("id", "name", "email")
  .where((user) => user.active.eq(true))
  .orderBy("created_at", "DESC")
  .build();
console.log(`Select Active Users SQL:`, selectActiveUsersSQL);

const deactivateUserSql = update(UsersHandle)
  .set({ active: false })
  .where((user) => user.id.eq(1))
  .build();
console.log(`Deactivate User SQL:`, deactivateUserSql);
