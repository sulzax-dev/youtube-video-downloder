const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { YtDlp } = require('ytdlp-nodejs');
const ffmpeg = require('ffmpeg-static');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const DOWNLOAD_DIR = path.join(__dirname, 'public', 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

// Specific route for downloading files with forced headers
app.get('/api/download-file/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(DOWNLOAD_DIR, filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('File download error:', err);
            } else {
                console.log(`File served and being deleted: ${filename}`);
                // Delete after serving to keep server clean
                setTimeout(() => {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                }, 60000); // Wait 1 minute before deletion
            }
        });
    } else {
        res.status(404).send('File not found');
    }
});

const ytdlp = new YtDlp({ ffmpegPath: ffmpeg });
const jobs = {};

app.get('/api/info', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const info = await ytdlp.getInfoAsync(url);
        const formats = info.formats
            .filter(f => f.vcodec !== 'none' || f.acodec !== 'none')
            .map(f => ({
                formatId: f.format_id,
                extension: f.ext,
                resolution: f.resolution || (f.height ? `${f.height}p` : 'Audio'),
                filesize: f.filesize || f.filesize_approx,
                hasVideo: f.vcodec !== 'none',
                hasAudio: f.acodec !== 'none',
                quality: f.format_note || f.vcodec
            }))
            .sort((a, b) => (parseInt(b.resolution) || 0) - (parseInt(a.resolution) || 0));

        res.json({
            title: info.title,
            thumbnail: info.thumbnail,
            duration: info.duration_string || 'Unknown',
            formats: formats
        });
    } catch (err) {
        console.error('Info Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch video info.' });
    }
});

app.post('/api/download', async (req, res) => {
    const { url, formatId, type } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const jobId = uuidv4();
    jobs[jobId] = {
        id: jobId,
        status: 'starting',
        progress: 0,
        speed: '',
        title: '',
        filename: '',
        error: null
    };

    (async () => {
        try {
            const info = await ytdlp.getInfoAsync(url);
            const safeTitle = info.title.replace(/[^\w\s]/gi, '').substring(0, 50);
            const ext = type === 'mp3' ? 'mp3' : 'mp4';
            const filename = `${safeTitle}_${Date.now()}.${ext}`;
            const targetPath = path.join(DOWNLOAD_DIR, filename);

            jobs[jobId].title = info.title;
            jobs[jobId].status = 'downloading';

            const options = {
                noCheckCertificates: true,
                output: targetPath,
                ffmpegLocation: ffmpeg,
                args: [
                    '--concurrent-fragments', '16',
                    '--buffer-size', '1M',
                    '--no-playlist',
                    '--postprocessor-args', 'ffmpeg:-preset ultrafast'
                ]
            };

            if (type === 'mp3') {
                options.extractAudio = true;
                options.audioFormat = 'mp3';
                options.audioQuality = '0';
            } else {
                options.format = formatId || 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
                options.mergeOutputFormat = 'mp4';
            }

            const downloader = ytdlp.download(url, options);

            downloader.on('progress', (p) => {
                jobs[jobId].progress = p.percentage || 0;
                jobs[jobId].speed = p.speed_str || '';
                jobs[jobId].status = 'downloading';
            });

            await downloader.run();
            
            jobs[jobId].status = 'finished';
            jobs[jobId].filename = filename;
            // Point to the new forced download API
            jobs[jobId].downloadUrl = `http://localhost:${PORT}/api/download-file/${filename}`;
            console.log(`Job ${jobId} finished: ${filename}`);

        } catch (err) {
            console.error(`Job ${jobId} failed:`, err.message);
            jobs[jobId].status = 'error';
            jobs[jobId].error = err.message;
        }
    })();

    res.json({ jobId });
});

app.get('/api/status/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = jobs[jobId];
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
});

app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
});

// Auto-cleanup for any missed files
setInterval(() => {
    const now = Date.now();
    fs.readdirSync(DOWNLOAD_DIR).forEach(file => {
        const filePath = path.join(DOWNLOAD_DIR, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > 3600000) {
            fs.unlinkSync(filePath);
        }
    });
}, 600000);
