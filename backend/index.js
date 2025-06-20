import express from "express";
import cors from "cors";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [process.env.CORS_ORIGIN.split(",")],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true
}
));

// Parse JSON bodies
app.use(express.json());

// Get __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the "public" directory exists
const downloadFolder = path.join(__dirname, "public");
if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder);
}

// Serve static files
app.use(express.static(downloadFolder));

app.get("/", (req, res) => {
    res.send("YouTube Video Downloader API is running!");
});

app.post("/download", (req, res) => {
    const { url, videoFormat, audioFormat } = req.body;

    console.log("Received download request:", req.body);
    console.log(`URL: ${url}, Video Format: ${videoFormat}, Audio Format: ${audioFormat}`);

    if (!url || !videoFormat || !audioFormat) {
        return res.status(400).json({ error: "YouTube URL and video and audio formates are required!" });
    }


    console.log(`Downloading video from URL: ${url}\n Video Format: ${videoFormat}, Audio Format: ${audioFormat}`);

    // Download video using yt-dlp
    // const command = `yt-dlp --cookies cookies.txt -f "${format}" "${url}" -o "public/%(title)s.%(ext)s"`;

    //create command
    const command = `yt-dlp --cookies cookies.txt -f "${videoFormat}+${audioFormat}" "${url}" -o "${downloadFolder}/%(title)s.%(ext)s"`;

    //generate direct download link
    // const command=`yt-dlp --cookies cookies.txt --extractor-args "youtube:player_client=tv_embedded" -g -f 140 "${url}"`;   

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ error: "Failed to download video" });
        }

        if (stderr) {
            console.warn(`Warning: ${stderr}`);
        }
        // Log the successful download
        console.log(`Download command executed successfully: ${command}`);


        console.log(`Success: ${stdout}`);

        // Extract file name
        const match = stdout.match(/Destination: (.+)/);
       
        const filename = path.basename(match[1]);
        const downloadUrl = `/${filename}`;

        console.log(`File downloaded: ${filename}`);
        res.json({ message: "Download ready!", downloadLink: downloadUrl });
    });
});

app.post("/get-quality", (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "YouTube URL is required!" });
    }

    console.log(`Fetching qualities for URL: ${url}`);

    // Fetch available qualities using yt-dlp
    const command = `yt-dlp --cookies cookies.txt --extractor-args "youtube:player_client=tv_embedded" -F "${url}"`;


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
            .map(line => {
                const [format, ...details] = line.trim().split(/\s+/);
                console.log("Details:", details);

                if (details[1] == "audio" && details[2] == "only") {
                    const extension = details[0];
                    const fileSize = details[5] || "Unknown";
                    return {
                        audioQuality: "Audio Only",
                        extension,
                        format: format,
                        fileSize,
                    };
                } else if (details[10] == "video" && details[11] == "only") {
                    const resolution = details[1];
                    const extension = details[0];
                    const fileSize = details[4] || "Unknown";
                    return {
                        videoQuality: resolution,
                        extension,
                        format: format,
                        fileSize,
                    }
                }
            });

        // console.log("Qualities:", qualities);
        // Filter out undefined entries
        const filteredQualities = qualities.filter(q => q !== undefined);
        // console.log("Filtered Qualities:", filteredQualities);

        res.json({ qualities: filteredQualities });
    });
});

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
