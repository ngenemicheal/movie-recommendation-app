import React, { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import Search from "./components/Search";
import Spinner from "./components/Spinner";
import MovieCard from "./components/MovieCard";
// import { getTrendingMovies, updateSearchCount } from "./appwrite";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
    method: "GET",
    headers: {
        accept: "application/json",
        Authorization: `Bearer ${API_KEY}`,
    },
};

const updateSearchCountV2 = async (searchTerm, movie) => {
    try {
        const response = await fetch(
            "http://localhost:4545/moviesBackend.php",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ searchTerm, movie }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error(
                "Error updating search count:",
                data.error || "Unknown error"
            );
            return [];
        }

        return data.trending;
    } catch (error) {
        console.error("Network error:", error);
        return [];
    }
};

const getTrendingMoviesV2 = async () => {
    try {
        const response = await fetch(
            "http://localhost:4545/moviesBackend.php",
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch trending movies");
        }

        const data = await response.json();
        return data; // your PHP returns an array of movies
    } catch (error) {
        console.error("Error fetching trending movies:", error);
        throw error;
    }
};

const App = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [trendingMovies, setTrendingMovies] = useState([]);
    const [trendingMoviesLoading, setTrendingMoviesLoading] = useState(false);
    const [trendingMoviesErrorMessage, setTradingMoviesErrorMessage] =
        useState("");

    useDebounce(() => setDebouncedSearchTerm(searchTerm), 1000, [searchTerm]);

    const fetchMovies = async (query = "") => {
        setLoading(true);
        setErrorMessage("");
        try {
            const endpoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(
                      query
                  )}`
                : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

            const response = await fetch(endpoint, API_OPTIONS);

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json();

            if (data.response === "False") {
                setErrorMessage(data.Error || "Failed to fetch movies.");
                setMovies([]);
                return;
            }

            setMovies(data.results || []);
            setErrorMessage("");

            // 🔹 Try to update backend but don’t let it break the UI
            if (query && data.results.length > 0) {
                try {
                    // await updateSearchCountV2(query, data.results[0]);
                    const movies = await updateSearchCountV2(
                        query,
                        data.results[0]
                    );
                    setTrendingMovies(movies);
                } catch (err) {
                    console.log(
                        "Backend update failed (but movies still loaded):",
                        err
                    );
                    setTradingMoviesErrorMessage(
                        "Failed to fetch trending movies. Please try again later."
                    );
                }
            }
        } catch (error) {
            console.error("Error fetching movies:", error);
            setErrorMessage("Failed to fetch movies. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const fetchTrendingMovies = async () => {
        setTrendingMoviesLoading(true);
        setTradingMoviesErrorMessage("");
        try {
            // const movies = await getTrendingMovies();
            const movies = await getTrendingMoviesV2();

            setTrendingMovies(movies);
            setTradingMoviesErrorMessage("");
        } catch (error) {
            console.error("Error fetching trending movies:", error);
            setTradingMoviesErrorMessage(
                "Failed to fetch trending movies. Please try again later."
            );
        } finally {
            setTrendingMoviesLoading(false);
        }
    };

    useEffect(() => {
        fetchMovies(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        fetchTrendingMovies();
    }, []);

    return (
        <main>
            <div className="pattern" />

            <div className="wrapper">
                <header>
                    <img src="./hero-img.png" alt="Hero" />
                    <h1>
                        Find <span className="text-gradient">Movies</span>
                        You"ll enjoy without the Hassle.
                    </h1>
                    <Search
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                    />
                </header>

                <section className="trending">
                    <h2>Trending Movies</h2>
                    {trendingMoviesLoading ? (
                        <div className="flex justify-center items-center h-32">
                            <Spinner />
                        </div>
                    ) : trendingMoviesErrorMessage ? (
                        <div className="text-center mt-5">
                            <p className="text-red-500 mb-2">
                                {trendingMoviesErrorMessage}
                            </p>
                            <button
                                onClick={() => location.reload()}
                                className="text-blue-500 underline"
                            >
                                Reload
                            </button>
                        </div>
                    ) : (
                        trendingMovies.length > 0 && (
                            <ul>
                                {trendingMovies.map((movie, index) => (
                                    <li key={movie.id}>
                                        <p>{index + 1}</p>
                                        <img
                                            src={movie.poster_url}
                                            alt={movie.title}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )
                    )}
                </section>

                <section className="all-movies">
                    <h2 className="mt-[40px]">All Movies</h2>

                    {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <Spinner />
                        </div>
                    ) : errorMessage ? (
                        <p className="text-red-500">{errorMessage}</p>
                    ) : (
                        <ul>
                            {movies.map((movie) => (
                                <MovieCard key={movie.id} movie={movie} />
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    );
};

export default App;
