import { connectToDatabase } from "@/lib/db";
import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === "POST") {
    const { email, password, username } = req.body;

    const { db } = await connectToDatabase();
    const existingUser = await db.collection("users").findOne({ email });

    if (existingUser) {
      res.status(422).json({ message: "User already exists!" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = { email, username, password: hashedPassword };

    await db.collection("users").insertOne(newUser);

    res.status(201).json({ message: "User created successfully!" });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
