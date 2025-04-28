import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}`
    );
    console.log(
      `MongoDB connected. DB host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("Error connecting MongoDB:", error);
    process.exit(1);
  }
};
