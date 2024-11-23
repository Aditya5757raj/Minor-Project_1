const express = require('express');
const mysql = require('mysql2/promise'); // Use promise version of mysql2
const bodyParser = require('body-parser');
const schedule = require('node-schedule');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const app = express();
require('dotenv').config();

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'Public'))); // Correctly serve static files

// Connect to the MySQL database
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
};
//LOG FILES CREATED BY THIS
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Setup morgan logging - Log to a file
const logStream = fs.createWriteStream(path.join(logsDir, 'requests.log'), { flags: 'a' });
app.use(morgan('combined', { stream: logStream }));
const daysOfWeek1 = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

async function truncateBookingForPreviousDays() {
    const connection = await mysql.createConnection(dbConfig);

    try {
        // Get the current day of the week (0 for Sunday, 1 for Monday, ..., 6 for Saturday)
        const currentDay = new Date().getDay();
        console.log(`Current day (numeric): ${currentDay} - ${daysOfWeek1[currentDay]}`);

        // Loop through all previous days and delete bookings for them
        for (let i = 1; i <= currentDay; i++) {
            // Calculate the previous day
            const previousDay = (currentDay - i + 7) % 7;  // Wrap around using modulus to handle the previous days correctly (including Sunday)

            console.log(`Truncating bookings for day: ${daysOfWeek1[previousDay]}`);

            // Query to delete bookings for the previous day
            const [result] = await connection.execute(`
                DELETE FROM Booking WHERE day_of_week = ?;
            `, [daysOfWeek1[previousDay]]);

            console.log(`Successfully deleted bookings for day ${daysOfWeek1[previousDay]}`);
        }
    } catch (error) {
        console.error('Error truncating bookings for the previous days:', error);
    } finally {
        connection.end();
    }
}

truncateBookingForPreviousDays();
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'index.html'), (err) => {
        if (err) {
            res.status(err.status || 500).send('Error loading page');
        }
    });
});

// Use async function to connect to the database
(async () => {
    try {
        const db = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL database');

        // Define the /search-room route
        app.get('/search-room', async (req, res) => {
            const { timeslot, block, dayofweek } = req.query; // Access query parameters

            // Split the timeslot into start and end times
            const [startTime, endTime] = timeslot.split('-');

            const availableRoomsQuery = `
                SELECT 
                    DISTINCT  c.room_number
                FROM 
                    Classrooms c
                JOIN 
                    TimeSlots ts ON ts.day_of_week = ?  -- Specify the day of the week
                WHERE 
                    c.block = ?  -- Filter by block
                    AND c.available = TRUE  
                    AND ts.start_time <= ?  
                    AND ts.end_time >= ?
                    AND c.room_number NOT IN (
                        SELECT room_number
                        FROM Booking
                        WHERE 
                            start_time = ?
                            AND end_time = ?
                            AND day_of_week = ?
                    ); 
            `;

            try {
                // Execute the query using db.query
                const [result] = await db.query(availableRoomsQuery, [
                    dayofweek,
                    block,
                    startTime,
                    endTime,
                    startTime,
                    endTime,
                    dayofweek
                ]);


                if (result.length > 0) {
                    let classroomsHtml = `
                        <div class="available-classrooms">
    <h2>Available Classrooms</h2>
    <div class="classroom-card-container">
        ${result.map(classroom => `
            <div class="classroom-card">
                <div class="classroom-icon">&#127979;</div> <!-- A classroom icon -->
                <h2>Classroom ${classroom.room_number}</h2>
                <p><strong>Status:</strong> <span class="available">Available</span></p>
            </div>
        `).join('')}
    </div>
</div>`;

                    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Classroom Search Results</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                background-image: url('https://collegewaale.com/upes/wp-content/uploads/2023/12/upes-1-1024x768.webp');
                background-size: cover;
                margin: 0;
                padding: 0;
            }
            .container {
                width: 90%;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                background-color: rgba(255, 255, 255, 0.3); /* Light transparency for better visibility */
                border-radius: 10px;
                backdrop-filter: blur(10px); /* Enhanced blur effect */
            }
            .header {
                text-align: center;
            }
            .header img {
                width: 150px; /* Adjust logo size as needed */
                margin-bottom: 20px;
            }
            h1 {
                color: #333;
                margin-bottom: 20px;
                text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.8); /* Added text shadow */
            }
            .available-classrooms {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .classroom-card-container {
                display: flex;
                flex-wrap: wrap;
                gap: 16px;
                justify-content: center;
            }
            .classroom-card {
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                padding: 20px;
                width: 100%;
                max-width: 300px;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                text-align: center;
            }
            .classroom-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
            }
            .classroom-card h2 {
                font-size: 20px;
                color: #444;
                margin-bottom: 10px;
                text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8); /* Added text shadow */
            }
            .classroom-icon {
                font-size: 50px;
                color: #3498db;
                margin-bottom: 10px;
            }
            .available {
                color: #2ecc71;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://indiaeducationdiary.in/wp-content/uploads/2022/01/UPES-LOGO-01.jpg" alt="UPES Logo">
                <h1>Classroom Search Results</h1>
            </div>
            ${classroomsHtml}
        </div>
    </body>
    </html>
`);

                } else {
                    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>No Classrooms Available</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                background-image: url('https://collegewaale.com/upes/wp-content/uploads/2023/12/upes-1-1024x768.webp');
                background-size: cover;
                margin: 0;
                padding: 0;
            }
            .container {
                width: 90%;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                background-color: rgba(255, 255, 255, 0.3); /* Light transparency for better visibility */
                border-radius: 10px;
                backdrop-filter: blur(10px); /* Enhanced blur effect */
            }
            .no-classrooms {
                text-align: center;
                margin-top: 40px;
            }
            .no-classrooms-icon {
                font-size: 80px;
                color: #e74c3c;
                margin-bottom: 20px;
            }
            .no-classrooms h1 {
                color: #e74c3c;
                font-size: 28px;
                margin-bottom: 10px;
                text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.8); /* Added text shadow */
            }
            .no-classrooms p {
                font-size: 16px;
                color: #666;
            }
            .button {
                display: inline-block;
                padding: 10px 20px;
                margin-top: 20px;
                background-color: #3498db;
                color: white;
                border: none;
                border-radius: 5px;
                text-decoration: none;
                font-size: 16px;
                transition: background-color 0.3s;
            }
            .button:hover {
                background-color: #2980b9;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="no-classrooms">
                <div class="no-classrooms-icon">&#128679;</div> <!-- Warning Icon -->
                <h1>No Available Classrooms</h1>
                <p>No available classrooms for ${dayofweek} during ${timeslot} in ${block}. Please try a different time slot or block.</p>
                <a href="javascript:history.back()" class="button">Go Back</a>
            </div>
        </div>
    </body>
    </html>
`);
                }



            } catch (error) {
                console.error('Error executing query', error.stack);
                res.status(500).send('An error occurred while searching for classrooms.');
            }
        });



        // POST route for handling login requests
        app.post('/login', async (req, res) => {
            const { username, password, role } = req.body;

            // Query to check if the user exists with the correct role and password
            const query = 'SELECT * FROM Users WHERE username = ? AND password = ? AND role = ?';

            try {
                const [results] = await db.query(query, [username, password, role]);

                // Check if we found a matching user
                if (results.length > 0) {
                    res.sendFile(path.join(__dirname, 'Public', 'action.html'));
                } else {
                    res.sendFile(path.join(__dirname, 'Public', 'error.html'));
                }
            } catch (err) {
                console.error(err);
                res.status(500).send('An error occurred while processing your login request.');
            }
        });

        //room booking post request
        const bookingQueue = []; // In-memory queue for booking requests

        app.post('/book-room', async (req, res) => {
            const { roomNumber, block, timeslot, purpose, dayofweek } = req.body;
        
            // Validate input
            if (!roomNumber || !block || !timeslot || !purpose || !dayofweek) {
                return res.status(400).send('All fields are required.');
            }
        
            const [startTime, endTime] = timeslot.split('-');
        
            const checkRoomQuery = `
                SELECT room_number 
                FROM Classrooms 
                WHERE block = ? AND available = TRUE;
            `;
            const checkBookingQuery = `
                SELECT * 
                FROM Booking 
                WHERE room_number = ? 
                AND block = ? 
                AND day_of_week = ? 
                AND (
                    (start_time= ? AND end_time = ?) -- Overlapping bookings
                );
            `;
            const bookRoomQuery = `
                INSERT INTO Booking (room_number, block, day_of_week, start_time, end_time, purpose) 
                VALUES (?, ?, ?, ?, ?, ?);
            `;
        
            // Add request to the queue with a timestamp
            const request = {
                roomNumber,
                block,
                startTime,
                endTime,
                purpose,
                dayofweek,
                timestamp: Date.now(),
                res, // Save the response object for sending a response later
            };
        
            bookingQueue.push(request);
        
            // Process the queue
            processBookingQueue(checkRoomQuery, checkBookingQuery, bookRoomQuery);
        });
        
        async function processBookingQueue(checkRoomQuery, checkBookingQuery, bookRoomQuery) {
            if (bookingQueue.length === 0) return;
        
            // Get the first request from the queue
            const currentRequest = bookingQueue.shift();
        
            const { roomNumber, block, startTime, endTime, purpose, dayofweek, timestamp, res } = currentRequest;
        
            try {
                // Check if room exists and is available
                const [availableRooms] = await db.query(checkRoomQuery, [block]);
                const roomExists = availableRooms.some(room => room.room_number === roomNumber);
        
                if (!roomExists) {
                    return res.sendFile(path.join(__dirname, "Roomnotavailable.html"));
                }
        
                // Check if room is already booked
                const [existingBookings] = await db.query(checkBookingQuery, [roomNumber, block, dayofweek, startTime, endTime]);
        
                if (existingBookings.length > 0) {
                    return res.sendFile(path.join(__dirname, "Bookingconflict.html"));
                }
        
                // Book the room
                await db.query(bookRoomQuery, [roomNumber, block, dayofweek, startTime, endTime, purpose]);
        
                // Respond with confirmation
                res.send(`
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Booking Confirmed</title>
                        <style>
                            body {
                                font-family: 'Arial', sans-serif;
                                background-image: url('https://collegewaale.com/upes/wp-content/uploads/2023/12/upes-1-1024x768.webp');
                                background-size: cover;
                                margin: 0;
                                padding: 0;
                            }
                            .container {
                                max-width: 600px;
                                margin: 50px auto;
                                padding: 20px;
                                background: rgba(255, 255, 255, 0.8);
                                border-radius: 10px;
                                text-align: center;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                            }
                            h1 {
                                color: #2ecc71;
                            }
                            p {
                                font-size: 18px;
                                color: #333;
                            }
                            .button {
                                display: inline-block;
                                margin-top: 20px;
                                padding: 10px 20px;
                                background: #3498db;
                                color: white;
                                text-decoration: none;
                                border-radius: 5px;
                                transition: background 0.3s;
                            }
                            .button:hover {
                                background: #2980b9;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>Booking Confirmed!</h1>
                            <p>Your booking for Room ${roomNumber} in Block ${block} on ${dayofweek} from ${startTime} to ${endTime} has been successfully recorded.</p>
                            <a href="action.html" class="button">Return to Home</a>
                        </div>
                    </body>
                    </html>
                `);
            } catch (error) {
                console.error('Error processing booking:', error.stack);
                res.status(500).send('An error occurred while booking the room.');
            }
        
            // Process the next request in the queue
            processBookingQueue(checkRoomQuery, checkBookingQuery, bookRoomQuery);
        }
        



        // Listen on port 3000 or another port of your choice
        app.listen(3000, () => {
            console.log('Server running on http://localhost:3000');
        });


    }
    catch (err) {
        console.error('Error connecting to MySQL:', err.message);
    }

})();