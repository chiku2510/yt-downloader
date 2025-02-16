
const API_URL = "http://localhost:3000/download"; // Ensure server is running
const videoURL = "https://www.youtube.com/watch?v=r3gpSrmq19Y"; // Replace with any YouTube URL

fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: videoURL }),
})
    .then((res) => res.json())
    .then((data) => console.log("Server Response:", data))
    .catch((err) => console.error("Error:", err));
