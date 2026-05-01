# 🚀 StreamVault - Ultra-Fast YouTube Downloader

**StreamVault** is a premium, high-performance YouTube video and audio downloader. It supports ultra-high resolutions (2K, 4K, 8K) and provides an ad-free, watermark-free experience with real-time progress tracking.

Developed and maintained by **[Sulzax_dev](https://github.com/sulzax-dev)**.

---

## ✨ Features
- **Ultra-High Resolution**: Download videos in 4K and 8K with automatic audio-video merging.
- **Super-Fast Processing**: Optimized with multi-threaded downloads (16 concurrent fragments) and `ultrafast` FFmpeg presets.
- **Quick Download Options**: Instant 720p and 360p downloads without processing wait times.
- **MP3 Conversion**: High-quality audio extraction.
- **Premium UI**: Sleek, dark-mode, glassmorphic design built with React and Framer Motion.
- **Real-Time Progress**: Live percentage, download speed, and status updates.

---

## 🛠️ Technology Stack
- **Frontend**: React (Vite), Framer Motion, Lucide Icons, Axios.
- **Backend**: Node.js, Express.
- **Core Engine**: `yt-dlp` (via `ytdlp-nodejs`).
- **Processing**: `ffmpeg-static`.

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/sulzax-dev/youtube-video-downloder.git
cd youtube-video-downloder
```

### 2. Setup Backend
```bash
cd server
npm install
node server.js
```
*The server will run on `http://localhost:5000`*

### 3. Setup Frontend
```bash
cd ../client
npm install
npm run dev
```
*The app will run on `http://localhost:3000`*

---

## 📖 Usage
1. Paste a YouTube URL into the search bar.
2. Click **Analyze** to fetch available qualities.
3. Choose your desired resolution or use the **Quick Download** buttons for instant results.
4. Wait for the progress bar to reach 100% (High-res merging takes a few seconds).
5. The file will download automatically!

---

## 🤝 Author
Built with ❤️ by **Sulzax_dev**
- GitHub: [@sulzax-dev](https://github.com/sulzax-dev)

---

## 📜 License
This project is for educational purposes. Please respect YouTube's Terms of Service and only download content for which you have permission.
