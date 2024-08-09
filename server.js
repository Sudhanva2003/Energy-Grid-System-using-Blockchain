const express = require('express');
const app = express();
const path = require('path');

// Serve static files from the src and build/contracts directories
app.use(express.static(path.join(__dirname, 'src')));
app.use('/build/contracts', express.static(path.join(__dirname, 'build/contracts')));

// Route to serve the index.html as an entry point
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});