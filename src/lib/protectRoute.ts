import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const protectRoute = (handler: (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const token = req.headers["authorization"]?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "defaultsecret");
      req.user = decoded;
      return handler(req, res);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};
