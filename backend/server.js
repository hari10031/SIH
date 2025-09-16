import app from './src/app.js';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3002;

// Start server
const server = app.listen(PORT, () => {
  console.log("App running successfully");
});





export default server;