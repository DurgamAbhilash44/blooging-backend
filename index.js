import express from 'express';
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file
import connectDB from './db.js'; // Import the database connection function
import UserRoutes from './routes/UserRoutes.js'; // Import the user routes
import BlogRoutes from './routes/BlogRoutes.js'; // Import the blog routes
import cors from 'cors'; // Import CORS middleware
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors()); // Enable CORS for all routes
// Middleware
app.use(express.json());

// Routes
connectDB();
app.get('/', (req, res) => {
  res.send('Hello from Express!');
});

app.use('/api',UserRoutes)
app.use('/api', BlogRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
