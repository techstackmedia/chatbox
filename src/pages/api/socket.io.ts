import { Server as IoServer } from "socket.io";
import { Server as HttpServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

interface CustomSocket extends NodeJS.Socket {
  server: HttpServer & { io?: IoServer };
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponse): void => {
  if (!res.socket) {
    console.error("Socket is not defined on the response object.");
    res.status(500).json({ message: "Server error: socket not available." });
    return;
  }

  const socket = res.socket as unknown as CustomSocket;

  if (socket.server.io) {
    console.log("Socket.IO is already running");
  } else {
    console.log("Initializing Socket.IO server");
    const io = new IoServer(socket.server, {
      path: "/api/socket.io",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("User connected");

      const token =
        socket.handshake.query.token || socket.handshake.headers["authorization"];
      if (!token) {
        socket.emit("error", "Authentication required");
        socket.disconnect();
        return;
      }

      jwt.verify(
        token as string,
        process.env.JWT_SECRET || "defaultsecret",
        (err, decoded) => {
          if (err) {
            socket.emit("error", "Invalid or expired token");
            socket.disconnect();
            return;
          }

          console.log("User authenticated", decoded);

          socket.on("sendMessage", (message) => {
            socket.broadcast.emit("receiveMessage", message);
          });

          socket.on("disconnect", () => {
            console.log("User disconnected");
          });
        }
      );
    });
  }

  res.end();
};

export default SocketHandler;
