<?php

$uname = $_POST["username"];
$pass = $_POST["password"];
$email = $_POST["email"];

$conn = new mysqli("localhost", "root", "", "adu");
if($conn->connect_error){
    echo "Connection Failed : ".$conn->connect_error;
    die("Connection Failed : ".$conn->connect_error);
}
else{
    $stmt = $conn->prepare("CREATE TABEL regis IF NOT EXISTS(`name` varchar(50), `email` varchar(50), `pass` varchar(50))");
    $stmt->execute();
    $stmt->close();
    $stmt = $conn->prepare("INSERT INTO regis(name, email, pass) VALUES(?, ?, ?)");
    $stmt->bind_param("sss", $uname, $email, $pass);
    $stmt->execute();
    echo "Registration Successful";
}