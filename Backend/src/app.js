import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "node:http";
import { connectDB } from "./db/db.js";
import { connectToSocket } from "./controllers/socketManager.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { Server } from "socket.io";
import userRoutes from "./routes/user.routes.js";

dotenv.config({
  path: "./.env",
});

const app = express();
app.use(cors());
app.use(errorMiddleware);
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

const server = createServer(app);
const io = connectToSocket(server);

const PORT = process.env.PORT;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`server is listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error connecting to database", err);
  });
