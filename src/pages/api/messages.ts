import { connectToDatabase } from "@/lib/db";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connectToDatabase();

  if (req.method === "GET") {
    const messages = await db.collection("messages").find({}).toArray();
    res.status(200).json({ messages });
  } else if (req.method === "POST") {
    const { text, user } = req.body;

    if (!text || !user) {
      return res.status(400).json({ error: "Missing text or user" });
    }

    const result = await db.collection("messages").insertOne({ 
      text, 
      user, 
      createdAt: new Date() 
    });
    res.status(201).json({ message: "Message saved", id: result.insertedId });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
