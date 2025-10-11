import mongoose from "mongoose";

export const connectToDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("[INFO] Connected to MongoDB");
        return true;
    } catch (err) {
        console.error("[ERROR] MongoDB connection error:", err.message);
        console.error(err);
        process.exit(1);
    }
};