import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "node:http";
import { connectDB } from "./db/db.js";
import { connectToSocket } from "./controllers/socketManager.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config({
  path: "./.env",
});

const app = express();
const server = createServer(app);
connectToSocket(server);

app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));
app.use(errorMiddleware);

app.use("/api/v1/users", userRoutes);

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server with Socket.IO is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error connecting to database", err);
  });
