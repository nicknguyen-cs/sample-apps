import { useEffect, useState, useRef } from "react";
import axios from "axios";

const StackDashboardExtension = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);

    const res = await axios.get("http://localhost:3001/api/embeddings/search", {
      params: { q: query }
    });

    setResponse(res.data.response); // formatted response from GPT-4
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Contentstack AI Search</h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search here..."
      />
      <button onClick={handleSearch}>{loading ? "Searching..." : "Search"}</button>

      {response && (
        <div>
          <h4>Search Results</h4>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}

export default StackDashboardExtension;