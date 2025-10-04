<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Database connection settings
// $servername = "localhost";
// $username = "root";
// $password = "root";
// $dbname = "react_app_test_db";

// // Create connection
// $conn = mysqli_connect($servername, $username, $password, $dbname);

// // Check connection
// if (!$conn) {
//     die("Connection failed: " . mysqli_connect_error());
// }


// PostgreSQL implementatio

// Database connection settings
$host = "localhost";
$port = "5432"; // Default PostgreSQL port
$dbname = "react_app_test_postgres_db";
$user = "postgres"; // Default superuser, change if you created another user
$password = "root"; // Replace with your actual password

// Create connection string
$conn_string = "host=$host port=$port dbname=$dbname user=$user password=$password";

// Create connection
$conn = pg_connect($conn_string);

// Check connection
// if (!$conn) {
//     die("Connection failed: " . pg_last_error());
// } else {
//     echo "Connected successfully to PostgreSQL!";
// }
if (!$conn) {
    die(json_encode(["error" => "Connection failed: " . pg_last_error()]));
}
// ✅ No echo here! Let your API endpoints send valid JSON only.
