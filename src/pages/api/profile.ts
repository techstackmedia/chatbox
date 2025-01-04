import { connectToDatabase } from "@/lib/db";
import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb"; // Import ObjectId

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === "GET") {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token is missing or invalid" });
    }

    const token = authorization.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
      if (!decoded?.userId) {
        throw new Error("Invalid token payload.");
      }

      const { db } = await connectToDatabase();
      const user = await db?.collection("users").findOne({ _id: new ObjectId(decoded.userId) });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { _id, username, email } = user;
      res.status(200).json({ _id, username, email });
    } catch (error: any) {
      console.error("Error verifying token:", error.message);
      return res.status(401).json({ message: "Unauthorized" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
