const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.get('/test', (req, res) => {
  res.send('This is a test message');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
