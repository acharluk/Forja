import {
  column,
  createTable,
  defineTableSchema,
  deleteFrom,
  insert,
  type Table,
  tableRef,
  update,
} from "../src";

console.log("\n=== Posts Example ===");

type Posts = Table<
  "posts",
  {
    id: number;
    user_id: number;
    title: string;
    body: string;
    published: boolean;
  }
>;

const PostsHandle = tableRef<Posts>("posts");

const PostsSchemaDefinition = defineTableSchema(PostsHandle, {
  id: column.integer({ primaryKey: true, autoIncrement: true }),
  user_id: column.integer({ references: { table: "users", column: "id" } }),
  title: column.varchar(255),
  body: column.text({ nullable: true }),
  published: column.boolean({ default: false }),
});

const createPostsTableSQL = createTable(PostsSchemaDefinition)
  .ifNotExists()
  .build();
console.log(`Create Posts Table SQL:`, createPostsTableSQL);

const createPostSQL = insert(PostsHandle)
  .columns("user_id", "title", "body")
  .values(1, "My First Post", "This is the body of my first post.")
  .build();
console.log(`Insert New Post SQL:`, createPostSQL);

const publishPostSQL = update(PostsHandle)
  .set({ published: true })
  .where((post) => post.id.eq(1))
  .build();
console.log(`Publish Post SQL:`, publishPostSQL);

const draftPostSQL = insert(PostsHandle)
  .columns("user_id", "title", "body", "published")
  .values(1, "My Draft Post", "This is a draft post.", false)
  .build();
console.log(`Insert Draft Post SQL:`, draftPostSQL);

const deleteDraftPostsSQL = deleteFrom(PostsHandle)
  .where((post) => post.published.eq(false))
  .build();
console.log(`Delete Draft Posts SQL:`, deleteDraftPostsSQL);
