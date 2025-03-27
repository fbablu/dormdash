import pool from "@/server/src/config/db";

describe("check db.ts", () => {
  it("test pool connection", async () => {
    try {
      const [rows] = await pool.query('SELECT * FROM user_favorites');
      expect(rows).toBeDefined();
    } finally {
      await pool.end();
    }
  });
});

