<?php
require 'connection.php';

// Allow requests from your React app
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Function: Update or insert search count
function updateSearchCount($conn, $searchTerm, $movie)
{
    $stmt = mysqli_prepare($conn, "SELECT id, count FROM trending_movies WHERE search_term = ? LIMIT 1");
    mysqli_stmt_bind_param($stmt, "s", $searchTerm);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $existing = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);

    if ($existing) {
        $newCount = $existing['count'] + 1;
        $stmt = mysqli_prepare($conn, "UPDATE trending_movies SET count = ? WHERE id = ?");
        mysqli_stmt_bind_param($stmt, "ii", $newCount, $existing['id']);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
    } else {
        $posterUrl = !empty($movie['poster_path'])
            ? "https://image.tmdb.org/t/p/w500{$movie['poster_path']}"
            : "no-movie.png";


        $stmt = mysqli_prepare(
            $conn,
            "INSERT INTO trending_movies (search_term, count, movie_id, poster_url) VALUES (?, 1, ?, ?)"
        );
        mysqli_stmt_bind_param($stmt, "sis", $searchTerm, $movie['id'], $posterUrl);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
    }
}

// Function: Get top trending movies
function getTrendingMovies($conn, $limit = 5)
{
    $sql = "SELECT * FROM trending_movies ORDER BY count DESC LIMIT ?";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "i", $limit);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    $movies = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $movies[] = $row;
    }
    mysqli_stmt_close($stmt);

    return $movies;
}

// Handle request
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['searchTerm']) || !isset($data['movie'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing searchTerm or movie"]);
        exit;
    }

    updateSearchCount($conn, $data['searchTerm'], $data['movie']);
    $trending = getTrendingMovies($conn);

    echo json_encode(["success" => true, "trending" => $trending]);
} elseif ($_SERVER["REQUEST_METHOD"] === "GET") {
    $trending = getTrendingMovies($conn);
    echo json_encode($trending);
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}

mysqli_close($conn);
