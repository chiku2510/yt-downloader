// server.js
import express from "express";
import cors from "cors";
import { exec } from "child_process";

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows JSON request body parsing

// API Endpoint for downloading YouTube videos
app.post("/download", (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "YouTube URL is required!" });
    }

    console.log(`Downloading video from URL: ${url}`);

    // Define yt-dlp command (Modify format codes as needed)
    // const command = `yt-dlp -f 299+140 "${url}" -o "downloads/%(title)s.%(ext)s"`;
    const command = `yt-dlp -f "bv*+ba/best" "${url}" -o "downloads/%(title)s.%(ext)s"`;


    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ error: "Failed to download video" });
        }

        if (stderr) {
            console.warn(`Warning: ${stderr}`);
        }

        console.log(`Success: ${stdout}`);
        res.json({ message: "Download started!", details: stdout });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
