import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io("https://api.awakeverse.com", {
      transports: ["websocket"],
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("✅ WebSocket connected:", newSocket.id);
      // 👇 join the per-user room so only this user's UI gets ticks
      try {
        newSocket.emit("join_for_you");
      } catch (e) {
        console.log("join_for_you emit failed:", e);
      }
    });

    newSocket.on("disconnect", () => {
      console.log("🔴 WebSocket disconnected");
    });

    // Update the state so Provider re-renders with the socket
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={socket}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useSocket = () => useContext(WebSocketContext);