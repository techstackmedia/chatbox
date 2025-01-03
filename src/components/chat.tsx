"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import io, { Socket } from "socket.io-client";

let socket: Socket;

const Chat = () => {
  const [messages, setMessages] = useState<{ text: string; user: string }[]>([]);
  const [message, setMessage] = useState<string>("");
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      router?.push("/login");
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

    socket = io();
    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [router]);

  const sendMessage = async () => {
    const token = localStorage.getItem("token");
    // const username = localStorage.getItem("user");
    if (!token) {
      alert("You must be logged in to send a message.");
      router?.push("/login");
      return;
    }

    const newMessage = { text: message, user: "You" };
    socket?.emit("sendMessage", newMessage);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newMessage),
      });
      if (!res.ok) console.error("Failed to save message");
    } catch (error) {
      console.error("Error saving message:", error);
    }

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
  };
  console.log(messages)

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 text-center">
        <button onClick={logout} className="bg-red-500 px-4 py-2 rounded text-sm">
          Logout
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.user === "You" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs p-2 rounded-lg ${
                msg.user === "You" ? "bg-blue-500 text-white" : "bg-gray-300"
              }`}
            >
              <strong>{msg.user}</strong>: {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-gray-200 fixed bottom-0 w-full flex items-center mt-20">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
        />
        <button
          onClick={sendMessage}
          className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Send
        </button>
      </footer>
    </div>
  );
};

export default Chat;
