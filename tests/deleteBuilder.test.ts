import { deleteFrom, type Table, tableRef } from "../src";

type Posts = Table<
  "posts",
  {
    id: number;
    published: boolean;
  }
>;

const PostsTable = tableRef<Posts>("posts");

describe("Delete builder", () => {
  it("builds delete statements", () => {
    const sql = deleteFrom(PostsTable)
      .where((cols) => cols.published.eq(false))
      .build();

    expect(sql).toBe("DELETE FROM posts WHERE published = false");
  });
});
