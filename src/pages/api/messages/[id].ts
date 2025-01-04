import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connectToDatabase();

  if (req.method === "PATCH") {
    const { id } = req.query;
    const { text } = req.body;

    if (!text || !id) {
      return res.status(400).json({ error: "Missing text or id" });
    }

    const objectId = Array.isArray(id) ? id[0] : id;

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
      if (!decoded?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const message = await db.collection("messages").findOne({ _id: new ObjectId(objectId) });
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      if (message.user !== decoded.userId) {
        return res.status(403).json({ message: "You can only edit your own messages" });
      }

      await db.collection("messages").updateOne(
        { _id: new ObjectId(objectId) },
        { $set: { text } }
      );

      return res.status(200).json({ message: "Message updated successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to update message" });
    }
  }

  if (req.method === "DELETE") {
    const { id } = req.query;

    const objectId = Array.isArray(id) ? id[0] : id;

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
      if (!decoded?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const message = await db.collection("messages").findOne({ _id: new ObjectId(objectId) });
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      if (message.user !== decoded.userId) {
        return res.status(403).json({ message: "You can only delete your own messages" });
      }

      await db.collection("messages").deleteOne({ _id: new ObjectId(objectId) });
      return res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to delete message" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
