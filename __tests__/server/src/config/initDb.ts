// just test the table creation code
import initDatabase from "@/server/src/config/initDb";
import pool from "@/server/src/config/db";
import mysql, { RowDataPacket } from "mysql2/promise";

describe("check init-db.ts", () => {
  
  it("naive test", () => {
    expect(true).toBe(true);
  });

  it("init database", async () => {
    await initDatabase();
    const conn = await pool.getConnection();
    const [cuisines] = await conn.execute<mysql.RowDataPacket[]>(
      "SHOW COLUMNS FROM user_favorites"
    );
    expect(cuisines.length).toBe(3);
  });

  afterAll(async () => {
    await pool.end();
  });
});

