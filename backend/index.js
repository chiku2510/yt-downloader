import express from "express";
import cors from "cors";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Get __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the "public" directory exists
const downloadFolder = path.join(__dirname, "public");
if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder);
}
// '/' route
app.get("/", (req, res) => {
    res.send("YouTube Video Downloader API is running!");
});

// // Serve static files
app.use("/downloads", express.static(downloadFolder));

// API to download YouTube video
app.post("/download", (req, res) => {
    const { url, videoFormat, audioFormat } = req.body;

    console.log("Received download request:", req.body);
    console.log(`URL: ${url}, Video Format: ${videoFormat}, Audio Format: ${audioFormat}`);

    if (!url || ! videoFormat || !audioFormat) {
        return res.status(400).json({ error: "YouTube URL and video and audio formates are required!" });
    }


    console.log(`Downloading video from URL: ${url}\n Video Format: ${videoFormat}, Audio Format: ${audioFormat}`);

    // Download video using yt-dlp
    // const command = `yt-dlp --cookies cookies.txt -f "${format}" "${url}" -o "public/%(title)s.%(ext)s"`;

    //create command
    const command = `yt-dlp --cookies cookies.txt -f "${videoFormat}+${audioFormat}" "${url}" -o "${downloadFolder}/%(title)s.%(ext)s"`;
    

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ error: "Failed to download video" });
        }

        if (stderr) {
            console.warn(`Warning: ${stderr}`);
        }

        console.log(`Success: ${stdout}`);

        // Extract file name
        const match = stdout.match(/Destination: (.+)/);
        if (!match) return res.json({ message: "Download started!" });

        const filename = path.basename(match[1]);
        const downloadUrl = `/downloads/${filename}`;

        res.json({ message: "Download ready!", url: downloadUrl });
    });
});

// Add endpoint to fetch video quality options
app.post("/get-qualities", (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "YouTube URL is required!" });
    }

    console.log(`Fetching qualities for URL: ${url}`);

    // Fetch available qualities using yt-dlp
    const command=`yt-dlp --cookies cookies.txt --extractor-args "youtube:player_client=tv_embedded" -F "${url}"`;


    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ error: "Failed to fetch qualities" });
        }

        if (stderr) {
            console.warn(`Warning: ${stderr}`);
        }

        console.log(`Qualities fetched: ${stdout}`);

        // Parse qualities from stdout
        const qualities = stdout
            .split("\n")
            .filter(line => /^\s*\w+\s+\w+\s+\d+x\d+/.test(line)) // Filter lines with resolution (e.g., 1920x1080)
            .map(line => {
                const [format, ...details] = line.trim().split(/\s+/);
                return { format, details: details.join(" ") };
            });


        res.json({ qualities });
    });
});

// API to stream the video
app.get("/stream/:filename", (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(downloadFolder, filename);

    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: "Video not found!" });
    }

    const stat = fs.statSync(filepath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        // Handle Partial Content (Streaming)
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        const chunkSize = end - start + 1;
        const fileStream = fs.createReadStream(filepath, { start, end });

        res.writeHead(206, {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunkSize,
            "Content-Type": "video/mp4",
        });

        fileStream.pipe(res);
    } else {
        // Send full file if no range is requested
        res.writeHead(200, {
            "Content-Length": fileSize,
            "Content-Type": "video/mp4",
        });
        fs.createReadStream(filepath).pipe(res);
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
