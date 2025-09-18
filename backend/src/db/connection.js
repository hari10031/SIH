import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = 'mongodb+srv://hariharanmanikanta999_db_user:Hari@cluster0.lj4hh0o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    const conn = await mongoose.connect(mongoURI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn('⚠️ Database connection failed:', error.message);
    console.warn('⚠️ Server will continue without database. Some features may not work.');
    // Don't exit process, allow server to continue
    return null;
  }
};

export default connectDB;