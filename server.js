const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes')

dotenv.config();
connectDB();

const app = express();
app.use(bodyParser.json());

app.use('/user', userRoutes);

// Test route
app.get('/test', (req, res) => {
  res.send("Testing");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
