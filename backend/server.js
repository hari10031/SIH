import app from './src/app.js';
import dotenv from 'dotenv';
import connectDB from './src/db/connection.js';
dotenv.config();

// Connect to database
connectDB().catch(console.warn);

const PORT = process.env.PORT || 3002;

// Start server
const server = app.listen(PORT,"0.0.0.0", () => {
  console.log("App running successfully");
});





export default server;