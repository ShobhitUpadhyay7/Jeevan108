import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    // Connection pool settings
    const connectionOptions = {
      maxPoolSize: 50, // Maximum number of connections in the pool
      minPoolSize: 5, // Minimum number of connections in the pool
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // How long to try selecting a server
      socketTimeoutMS: 45000, // How long a send or receive on a socket can take
    };

    await mongoose.connect(mongoURI, connectionOptions);

    console.log("✅ MongoDB connected successfully");
    console.log(
      `📊 Connection pool configured: min=${connectionOptions.minPoolSize}, max=${connectionOptions.maxPoolSize}`
    );
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Connection monitoring events
mongoose.connection.on("connected", () => {
  console.log("🔗 Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("🔌 Mongoose disconnected from MongoDB");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 Mongoose reconnected to MongoDB");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("🔒 MongoDB connection closed through app termination");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during MongoDB disconnection:", error);
    process.exit(1);
  }
});

export default connectDB;