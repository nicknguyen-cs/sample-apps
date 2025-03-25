import { useState } from "react";
import axios from "axios";

const StackDashboardExtension = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setError("");
    setResponse(""); // Clear previous response

    try {
      const response = await fetch(`http://localhost:3001/api/embeddings/search?q=${encodeURIComponent(query)}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch the stream.");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to read the stream.");
      }

      const decoder = new TextDecoder();
      let isClosed = false;

      while (!isClosed) {
        const { done, value } = await reader.read();
        if (done) {
          isClosed = true; // End of stream
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim() !== ""); // Split by lines and filter empty lines

        for (const line of lines) {
          if (line.startsWith("event: end")) {
            isClosed = true; // Stop processing on "end" event
            break;
          }

          try {
            const parsed = JSON.parse(line); // Parse the JSON object
            if (parsed.content) {
              setResponse((prev) => prev + parsed.content); // Append the content field
            }
          } catch (err) {
            console.error("Failed to parse JSON:", err);
          }
        }
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("An error occurred while streaming the response. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ marginBottom: 20 }}>Contentstack AI Search</h2>
      <div style={{ marginBottom: 20 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search here..."
          style={{
            padding: 10,
            width: "80%",
            marginRight: 10,
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: 10,
            backgroundColor: "#007BFF",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: 20 }}>
          <p>{error}</p>
        </div>
      )}

      {response && (
        <div style={{ marginTop: 20 }}>
          <h4>Search Results</h4>
          <p style={{ whiteSpace: "pre-wrap", backgroundColor: "#f9f9f9", padding: 10, borderRadius: 4 }}>
            {response}
          </p>
        </div>
      )}
    </div>
  );
};

export default StackDashboardExtension;