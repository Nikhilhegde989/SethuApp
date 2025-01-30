const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes')
const AdminRoutes = require('./routes/adminRoutes')
const WebinarRoutes = require('./routes/webinarRoutes')
const cors = require('cors');
const multer = require('multer'); // For handling file uploads
const cookieParser = require('cookie-parser');

dotenv.config();
connectDB();

const app = express();

app.use(
  cors({
    origin: 'http://127.0.0.1:5500', // Replace with your frontend origin
    credentials: true, // Allow credentials (cookies)
  })
);
app.use(cookieParser()); 

// Handle preflight requests
app.options('*', cors()); // Allow preflight requests for all routes
app.use(bodyParser.json());
// Body parser middleware (replaces body-parser)
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

app.use('/user', userRoutes);
app.use('/admin',AdminRoutes)
app.use('/webinar',WebinarRoutes)
// Test route
app.get('/test', (req, res) => {
  res.send("Testing");
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
