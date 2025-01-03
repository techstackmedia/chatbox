import { connectToDatabase } from "@/lib/db";
import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === "POST") {
    const { email, password } = req.body;

    const { db } = await connectToDatabase();
    const user = await db?.collection("users").findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: "Invalid credentials!" });
      return;
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "defaultsecret", {
      expiresIn: "1h",
    });

    res.status(200).json({ token, username: user.username });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
