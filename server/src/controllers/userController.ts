import { Request, Response } from "express";
import pool from "../config/db";
import { RowDataPacket } from "mysql2";

interface AuthenticatedRequest extends Request {
  user?: any;
}

interface UserRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  image: string;
  created_at: Date;
}

export const getUserFavorites = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.params.userId;
    const connection = await pool.getConnection();

    try {
      const [favorites] = await connection.execute(
        "SELECT restaurant_name FROM user_favorites WHERE user_id = ?",
        [userId],
      );
      res.json(favorites);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const toggleFavorite = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { userId, restaurantName, action } = req.body;
    const connection = await pool.getConnection();

    try {
      if (action === "add") {
        await connection.execute(
          "INSERT INTO user_favorites (user_id, restaurant_name) VALUES (?, ?)",
          [userId, restaurantName],
        );
      } else {
        await connection.execute(
          "DELETE FROM user_favorites WHERE user_id = ? AND restaurant_name = ?",
          [userId, restaurantName],
        );
      }
      res.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error updating favorites:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.params.userId;
    const connection = await pool.getConnection();

    try {
      const [users] = await connection.execute<UserRow[]>(
        "SELECT id, name, email, image, created_at FROM users WHERE id = ?",
        [userId],
      );

      if (!users || users.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(users[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
