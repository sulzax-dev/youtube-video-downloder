import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Download, PlayCircle, Music, Film, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const API_BASE = 'http://localhost:5000/api';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [error, setError] = useState('');
  const pollingRef = useRef(null);

  const fetchInfo = async () => {
    if (!url) return;
    setLoading(true);
    setError('');
    setVideoInfo(null);
    setSelectedFormat(null);
    setJobId(null);
    setJobStatus(null);
    
    try {
      const response = await axios.get(`${API_BASE}/info?url=${encodeURIComponent(url)}`);
      setVideoInfo(response.data);
      if (response.data.formats.length > 0) {
        setSelectedFormat(response.data.formats[0]);
      }
    } catch (err) {
      setError('Could not fetch video details. Make sure the URL is correct.');
    } finally {
      setLoading(false);
    }
  };

  const startDownload = async (type = 'mp4') => {
    if (!videoInfo) return;
    setError('');
    
    try {
      const response = await axios.post(`${API_BASE}/download`, {
        url,
        formatId: type === 'mp3' ? 'bestaudio' : selectedFormat?.formatId,
        type
      });
      setJobId(response.data.jobId);
    } catch (err) {
      setError('Failed to start download process.');
    }
  };

  // Polling logic
  useEffect(() => {
    if (!jobId) return;

    const checkStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE}/status/${jobId}`);
        const status = response.data;
        setJobStatus(status);

        if (status.status === 'finished') {
          clearInterval(pollingRef.current);
          // Redirect browser to the download API which forces 'attachment'
          window.location.href = status.downloadUrl;
          // Small delay before allowing another download
          setTimeout(() => setJobId(null), 2000);
        } else if (status.status === 'error') {
          clearInterval(pollingRef.current);
          setError(`Download failed: ${status.error}`);
          setJobId(null);
        }
      } catch (err) {
        console.error('Status check failed', err);
      }
    };

    pollingRef.current = setInterval(checkStatus, 1500);
    return () => clearInterval(pollingRef.current);
  }, [jobId]);

  return (
    <div className="app-container">
      <header className="header">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <PlayCircle size={64} color="#6366f1" style={{ marginBottom: '1rem' }} />
        </motion.div>
        <h1>StreamVault</h1>
        <p>Premium YouTube Downloader up to 8K Quality</p>
      </header>

      <main className="glass-card content-wrapper">
        <div className="input-group">
          <input 
            type="text" 
            placeholder="Paste YouTube URL here..." 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInfo()}
          />
          <button className="primary" onClick={fetchInfo} disabled={loading || jobId}>
            {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </motion.div>
        )}

        <AnimatePresence>
          {videoInfo && (
            <motion.div className="video-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="thumbnail-container">
                <img src={videoInfo.thumbnail} alt="Thumbnail" />
              </div>
              
              <div className="video-details">
                <h2>{videoInfo.title}</h2>
                <p className="duration">Duration: {videoInfo.duration}</p>
                
                {!jobId && (
                  <>
                    <div className="format-selection">
                      <h3>Choose Quality</h3>
                      <div className="formats-grid">
                        {videoInfo.formats
                          .filter(f => f.hasVideo)
                          .reduce((acc, current) => {
                            const x = acc.find(item => item.resolution === current.resolution);
                            if (!x) return acc.concat([current]);
                            return acc;
                          }, [])
                          .slice(0, 8)
                          .map((f, i) => (
                            <div 
                              key={i}
                              className={`format-card ${selectedFormat?.formatId === f.formatId ? 'selected' : ''}`}
                              onClick={() => setSelectedFormat(f)}
                            >
                              <span className="format-res">{f.resolution}</span>
                              <span className="format-ext">{f.extension}</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="download-section">
                      <div className="section-label">High Quality (Needs Merging)</div>
                      <button className="primary download-btn" onClick={() => startDownload('mp4')}>
                        <Film size={20} />
                        Download {selectedFormat?.resolution}
                      </button>
                    </div>

                    <div className="download-section quick-section">
                      <div className="section-label">Quick Download (Instant)</div>
                      <div className="quick-buttons">
                        <button className="secondary q-btn" onClick={() => {
                          const f720 = videoInfo.formats.find(f => f.resolution === '720p' && f.hasAudio);
                          setSelectedFormat(f720 || selectedFormat);
                          startDownload('mp4');
                        }}>720p MP4</button>
                        <button className="secondary q-btn" onClick={() => {
                          const f360 = videoInfo.formats.find(f => f.resolution === '360p' && f.hasAudio);
                          setSelectedFormat(f360 || selectedFormat);
                          startDownload('mp4');
                        }}>360p MP4</button>
                        <button className="secondary q-btn" onClick={() => startDownload('mp3')}>
                          <Music size={16} /> MP3
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {jobId && jobStatus && (
                  <div className="status-container">
                    <div className="status-header">
                      <span className="status-text">
                        {jobStatus.status === 'finished' ? 'Ready!' : 'Processing...'}
                      </span>
                      <span className="speed-text">{jobStatus.speed}</span>
                    </div>
                    
                    <div className="progress-container">
                      <motion.div 
                        className="progress-bar"
                        initial={{ width: 0 }}
                        animate={{ width: `${jobStatus.progress}%` }}
                      />
                    </div>
                    
                    <p className="progress-label">
                      {jobStatus.status === 'finished' 
                        ? 'Download complete!' 
                        : `${Math.round(jobStatus.progress)}% Complete`}
                    </p>
                    
                    {jobStatus.status === 'finished' && (
                      <button className="primary" onClick={() => setJobId(null)} style={{ marginTop: '1rem' }}>
                        Download Another
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="footer">
        <p>© 2026 StreamVault • Premium Downloader</p>
      </footer>
    </div>
  );
}

export default App;
