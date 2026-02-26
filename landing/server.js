const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Serve static files from the landing directory
app.use(express.static(path.join(__dirname)));

// Fallback to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🌊 SwellSync Landing — http://localhost:${PORT}`);
});
