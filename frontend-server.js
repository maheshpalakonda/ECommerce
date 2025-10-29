const express = require('express');
const path = require('path');

const app = express();
const PORT = 3004;

// Serve static files from root directory
app.use(express.static(__dirname));

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'add to cart.html'));
});

// Catch-all to serve index.html for any other routes (for SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'add to cart.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on http://localhost:${PORT}`);
});
