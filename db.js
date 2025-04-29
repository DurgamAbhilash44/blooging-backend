import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file

let instance = null;


const connectDB = async () => {
    if (instance) {
        console.log("Reusing existing database connection.");
        return instance;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
        
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        instance = conn; // Store the connection instance
        return instance;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

export default connectDB;