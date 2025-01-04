"use client"

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import io, { Socket } from "socket.io-client";
import Link from "next/link";
import { format } from "date-fns";

interface UserProfile {
  username: string;
  email: string;
  createdAt: Date;
}

const Chat = () => {
  const [messages, setMessages] = useState<
    {
      createdAt: string | number | Date;
      text: string;
      user: string;
    }[]
  >([]);
  const [message, setMessage] = useState<string>("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = useRef<Socket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const logout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        localStorage.removeItem("token");
        router.push("/login");
      } else {
        alert("Failed to log out. Please try again.");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
  
    const fetchMessages = async () => {
      const res = await fetch("/api/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      } else {
        console.error("Failed to fetch messages");
      }
    };
  
    fetchMessages();
  
    socket.current = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  
    socket.current.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
  
    socket.current.on("connect", () => {
      console.log("Connected to WebSocket");
    });
  
    socket.current.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
    });
  
    socket.current.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });
  
    socket.current.on("error", (error) => {
      console.error("Socket.IO error:", error);
    });
  
    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, [router]);

  const fetchUserProfile = async () => {
    setProfileLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setProfileError("No token found. Please log in.");
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch profile.");
      }

      const data = await res.json();
      setProfile(data);
    } catch (error) {
      if (error instanceof Error) {
        setProfileError(error.message);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const user = profile ? profile.username : "";

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const sendMessage = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to send a message.");
      router.push("/login");
      return;
    }
  
    const newMessage = {
      text: message,
      user,
      createdAt: new Date().toISOString(),
    };
  
    if (socket.current) {
      socket.current.emit("sendMessage", newMessage);
    }
  
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newMessage),
      });
      if (!res.ok) throw new Error("Failed to save message");
    } catch (error) {
      if (error instanceof Error) {
        setProfileError(error.message);
      }
    }
  
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
  };

  if (profileError)
    return (
      <div className="flex justify-center items-center w-dvw h-dvh text-red-500 text-2xl">
        <p>
          <Link href="/login" className="underline">
            Login,
          </Link>
        </p>
        no token or token expired (1 hr)
      </div>
    );
  if (profileLoading)
    return (
      <div className="flex justify-center items-center w-dvw h-dvh text-black text-2xl">
        User data loading
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 text-center flex justify-between items-center">
        <div className="flex gap-3">
          <div className="border rounded-full w-10 h-10 flex justify-center items-center bg-background text-foreground">
            {profile?.username[0].toUpperCase()}
          </div>
          <div className="flex flex-col items-start">
            <div>
              {profile?.username[0].toUpperCase()}
              {profile?.username.substring(1)}
            </div>
            <small>{profile?.email}</small>
          </div>
        </div>
        <h3 className="text-lg font-bold">Chat App</h3>
        <button
          onClick={logout}
          className="bg-red-500 px-4 py-2 rounded text-sm"
        >
          Logout
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.user === profile?.username ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs p-2 rounded-lg ${
                msg.user === profile?.username
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              <p>{msg.text}</p>
              <small className="text-xs text-gray-500">
                {format(new Date(msg.createdAt), "yyyy-MM-dd HH:mm:ss")}
              </small>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-gray-200 flex justify-between">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 border rounded-lg"
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Send
        </button>
      </footer>
    </div>
  );
};

export default Chat;
