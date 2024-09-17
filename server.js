const express = require('express');
// const alert = require('alert');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'Public'))); // Correctly serve static files

// Connect to the MySQL database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password:'Aditya5757', // Use environment variable for MySQL password
    database: 'classroom_booking',
    port: 3306
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'index.html'), (err) => {
        if (err) {
            res.status(err.status || 500).send('Error loading page');
        }
    });
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Connected to MySQL database');
});

// POST route for handling login requests
app.post('/login', (req, res) => {
    const { username, password, role } = req.body;
    console.log(req.body);
    // Query to check if the user exists with the correct role and password
    const query = 'SELECT * FROM Users WHERE username = ? AND password = ? AND role = ?';
     console.log(query);
    
    db.query(query, [username, password, role], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ message: 'Server error during login' });
            return;
        }

        // Check if we found a matching user
        if (results.length > 0) {
            res.sendFile(path.join(__dirname, 'Public', 'action.html'));
        } else {
            // alert('Invalid username or password!');
        }
    });
});

// Listen on port 3000 or another port of your choice
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
