<?php
// database connection details
$host = 'localhost';
$username = 'root';
$password_db = 'root';
$dbname = 'adu';

// user input from form
$name = $_POST['signup_username'];
$email = $_POST['signup_email'];
$pass = $_POST['signup_password'];

// connect to database
$conn = new mysqli($host, $username, $password_db, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
} else {
    // create table if not exists
    $qu = $conn->prepare("CREATE TABLE IF NOT EXISTS sas (name VARCHAR(50), email VARCHAR(50), password VARCHAR(50))");
    $qu->execute();
    
    // insert data into table
    $qu = $conn->prepare("INSERT INTO sas (name, email, password) VALUES (?, ?, ?)");
    $qu->bind_param("sss", $name, $email, $pass);
    $res = $qu->execute();
    
    // check if registration successful
    if (!$res) {
        echo "Registration done";
    } else {
        echo "Registration failed";
    }
    
    // close prepared statement and database connection
    $qu->close();
    $conn->close();
    
    // redirect user after registration
    header("Location: login.html");
    exit();
}
?>
