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


function sanitizeFilename(filename) {
    //if the file name contains special characters, such as spaces, emojis, backslashes, etc., it may cause issues when accessing the file via URL.
    //replace all special characters with underscores
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    //update the file name on the disk
    const oldPath = path.join(downloadFolder, filename);
    const newPath = path.join(downloadFolder, safeFilename);
    if (oldPath !== newPath) {
        fs.renameSync(oldPath, newPath);
    }


    return safeFilename;
}
app.post("/download", (req, res) => {
    const { url, videoFormat, audioFormat } = req.body;

    console.log("Received download request:", req.body);

    if (!url || !videoFormat || !audioFormat) {
        return res.status(400).json({ error: "YouTube URL and video and audio formats are required!" });
    }

    const downloadFolder = path.join(__dirname, "public");

    // Construct the yt-dlp command
    const command = `yt-dlp -v --cookies cookies.txt -f "${videoFormat}+${audioFormat}" "${url}" -o "${downloadFolder}/%(title)s.%(ext)s" --force-ipv4`;

    console.log(`Executing command: ${command}`);

    exec(command, (error, stdout, stderr) => {
        const output = stdout + stderr;
        console.log(`Download stderr: ${stderr}`);
        console.log(`Download output: ${stdout}`);

        //check already downloaded file
        const alreadyMatch = output.match(/\[download\]\s+(.+\.(mp4|mkv|webm|avi))\s+has already been downloaded/);
        console.log(`Already Match: ${alreadyMatch}`);

        if (alreadyMatch && alreadyMatch[1]) {
            const filename = path.basename(alreadyMatch[1].trim());
            console.log(`File already downloaded: ${filename}`);

            const safeFilename = sanitizeFilename(filename);
            return res.json({
                message: "Already downloaded", downloadLink: `/${safeFilename
                    }`
            });
        }

        // Check for merger completion (when combining video + audio)
        const mergerMatch = output.match(/\[Merger\]\s+Merging formats into\s+"(.+\.(mkv|mp4|webm|avi))"/);
        if (mergerMatch && mergerMatch[1]) {
            const filename = path.basename(mergerMatch[1].trim());
            console.log(`Download completed (merged): ${filename}`);

            const safeFilename = sanitizeFilename(filename);
            return res.json({
                message: "Download ready!", downloadLink: `/${safeFilename}`
            });
        }

        // Check for single file download completion
        const destMatch = output.match(/\[download\]\s+Destination:\s+(.+\.(mp4|mkv|webm|avi))/);
        if (destMatch && destMatch[1]) {
            const filename = path.basename(destMatch[1].trim());
            console.log(`Download completed: ${filename}`);
            const safeFilename = sanitizeFilename(filename);
            return res.json({
                message: "Download ready!", downloadLink: `/${safeFilename
                    }`
            });
        }

        if (error) {
            console.error(`Download error: ${error.message}`);
            return res.status(500).json({ error: "Download failed." });
        }

        console.error(`Unexpected output format: ${output}`);
        return res.status(500).json({ error: "Could not parse download result." });
    });
});


// for getting available qualities and sending JSON as a response to the user

// app.post("/get-quality", (req, res) => {
//     const { url } = req.body;

//     if (!url) {
//         return res.status(400).json({ error: "YouTube URL is required!" });
//     }
//     console.log(`Fetching qualities for URL: ${url}`);

//     // Fetch available qualities using yt-dlp
//     const command = `yt-dlp --cookies cookies.txt -J "${url}" --force-ipv4`;


//     exec(command, (error, stdout, stderr) => {
//         if (error) {
//             console.error(`Error: ${error.message}`);
//             return res.status(500).json({ error: "Failed to fetch qualities" });
//         }

//         if (stderr) {
//             console.warn(`Warning: ${stderr}`);
//         }

//         console.log(`Qualities fetched: ${stdout}`);

//         const qualities = stdout
//             .split("\n")
//             .map(line => line.trim())
//             .filter(line => {
//                 // Skip headers and separators
//                 if (!line) return false;
//                 if (line.startsWith("[") || line.startsWith("ID ")) return false;
//                 if (line.startsWith("---")) return false;
//                 return line.includes("|");
//             })
//             .map(line => {
//                 // Split columns
//                 const parts = line.split("|").map(p => p.trim());
//                 if (parts.length < 3) return null;

//                 // LEFT SIDE: ID EXT RES FPS
//                 const left = parts[0].split(/\s+/);

//                 const id = left[0];
//                 const ext = left[1] || null;
//                 const resolution = left[2] || null;
//                 const fps = isNaN(left[3]) ? null : Number(left[3]);

//                 // MIDDLE: FILESIZE TBR PROTO
//                 const middle = parts[1].split(/\s+/);
//                 const fileSize = middle[0] === "~" ? `~ ${middle[1]}` : middle[0] || null;
//                 const tbr = middle.find(v => v.endsWith("k")) || null;
//                 const protocol = middle[middle.length - 1] || null;

//                 // RIGHT: VCODEC ACODEC + extra info
//                 const right = parts[2].split(/\s+/);
//                 const videoCodec = right[0] || null;
//                 const audioCodec = right[1] || null;
//                 const moreInfo = right.slice(2).join(" ") || null;

//                 return {
//                     id,
//                     extension: ext,
//                     resolution,
//                     fps,
//                     fileSize,
//                     bitrate: tbr,
//                     protocol,
//                     videoCodec,
//                     audioCodec,
//                     extra: moreInfo
//                 };
//             })
//             .filter(Boolean);



//         console.log("Qualities:", qualities);

//         // Filter out undefined entries
//         const filteredQualities = qualities.filter(q => q !== undefined);
//         // console.log("Filtered Qualities:", filteredQualities);

//         // parse stdout as JSON
//         res.json({ qualities: 
//             JSON.parse(stdout)
//         });
//     });
// });



//manually parse yt-dlp output to get available qualities and send JSON as a response to the user
app.post("/get-quality", (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "YouTube URL is required!" });
    }
    console.log(`Fetching qualities for URL: ${url}`);

    // Fetch available qualities using yt-dlp
    const command = `yt-dlp --cookies cookies.txt -F "${url}" --force-ipv4`;


    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ error: "Failed to fetch qualities" });
        }

        if (stderr) {
            console.warn(`Warning: ${stderr}`);
        }

        console.log(`Qualities fetched: ${stdout}`);



        const qualities = stdout
            .split("\n")
            .map(line => line.trim())
            .filter(line => {
                if (!line) return false;
                if (line.startsWith("[") || line.startsWith("ID ")) return false;
                if (line.startsWith("---")) return false;
                return line.includes("|");
            })
            .map(line => {
                const parts = line.split("|").map(p => p.trim());
                if (parts.length < 3) return null;

                const left = parts[0].split(/\s+/);
                const id = left[0];
                const ext = left[1] || null;
                const resolution = left[2] || null;
                const fps = isNaN(left[3]) ? null : Number(left[3]);

                const middle = parts[1].split(/\s+/);
                const fileSize = middle[0] === "~" ? `~ ${middle[1]}` : middle[0] || null;
                const bitrate = middle.find(v => v.endsWith("k")) || null;
                const protocol = middle[middle.length - 1] || null;

                const right = parts[2].split(/\s+/);
                const videoCodec = right[0] || null;
                const audioCodec = right[1] || null;
                const extra = right.slice(2).join(" ") || null;

                return {
                    id,
                    extension: ext,
                    resolution,
                    fps,
                    fileSize,
                    bitrate,
                    protocol,
                    videoCodec,
                    audioCodec,
                    extra
                };
            })
            .filter(Boolean)
            // ✅ REMOVE storyboard / image-only formats
            .filter(q => q.videoCodec !== "images");




        console.log("Qualities:", qualities);

        // Filter out undefined entries
        const filteredQualities = qualities.filter(q => q !== undefined);
        // console.log("Filtered Qualities:", filteredQualities);

        // parse stdout as JSON
        res.json({
            qualities:
                filteredQualities
        });
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
    console.log(`Server running on port: ${PORT}`);
});
