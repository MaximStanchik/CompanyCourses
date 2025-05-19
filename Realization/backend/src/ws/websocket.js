const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let IO;

function initWS(httpsServer) {
  const io = new Server(httpsServer, {
    cors: {
      origin: "https://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    allowEIO3: true,
  });

  io.on("connection", (socket) => {
    socket.on("subscribe", (data) => {
      const userId = data.userId;

      const existingUserIdIndex = allSockets.findIndex(
        (item) => (item.userId = userId)
      );
      if (existingUserIdIndex === -1) {
        allSockets.push({ userId, socket });
      } 
      else {
        allSockets[existingUserIdIndex].socket = socket;
      }
    });
    IO = io;
  });
}

function getWS() {
  return IO;
}

module.exports = { initWS, getWS };
