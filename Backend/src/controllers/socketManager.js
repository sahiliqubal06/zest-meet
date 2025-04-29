import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("New socket connected:", socket.id);

    socket.on("join-call", (path) => {
      if (!connections[path]) {
        connections[path] = [];
      }
      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      connections[path].forEach((id) => {
        io.to(id).emit("user-joined", socket.id, connections[path]);
      });

      if (messages[path]) {
        messages[path].forEach((msg) => {
          io.to(socket.id).emit(
            "chat-message",
            msg.data,
            msg.sender,
            msg["socket-id-sender"]
          );
        });
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      let matchingRoom = "";

      for (const [roomKey, roomSockets] of Object.entries(connections)) {
        if (roomSockets.includes(socket.id)) {
          matchingRoom = roomKey;
          break;
        }
      }

      if (matchingRoom) {
        if (!messages[matchingRoom]) {
          messages[matchingRoom] = [];
        }

        messages[matchingRoom].push({
          sender,
          data,
          "socket-id-sender": socket.id,
        });

        console.log(`Message in ${matchingRoom}: ${sender} says ${data}`);

        connections[matchingRoom].forEach((id) => {
          io.to(id).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    socket.on("disconnect", () => {
      const connectedAt = timeOnline[socket.id];
      const disconnectedAt = new Date();
      var timeSpent = connectedAt ? Math.abs(disconnectedAt - connectedAt) : 0;

      console.log(
        `Socket disconnected: ${socket.id} after ${timeSpent / 1000} seconds`
      );

      for (const [roomKey, roomSockets] of Object.entries(connections)) {
        const index = roomSockets.indexOf(socket.id);
        if (index !== -1) {
          roomSockets.splice(index, 1);

          roomSockets.forEach((id) => {
            io.to(id).emit("user-left", socket.id);
          });

          if (roomSockets.length === 0) {
            delete connections[roomKey];
          }

          break;
        }
      }

      delete timeOnline[socket.id];
    });
  });
};
