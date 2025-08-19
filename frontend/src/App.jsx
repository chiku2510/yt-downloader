import { useState } from 'react'
import { Download, Link, Play, Music, Video, ExternalLink, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

// Database service to match your backend API
const databaseService = {
  getQuality: async ({ url }) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/get-quality`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch qualities');
    }
    
    return await response.json();
  },
  
  downloadVideo: async ({ videoQuality, audioQuality, url }) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        url, 
        videoFormat: videoQuality, 
        audioFormat: audioQuality 
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Download failed');
    }
    
    return await response.json();
  }
};

function App() {
  const [url, setUrl] = useState('');
  const [qualities, setQualities] = useState([]);
  const [videoQuality, setVideoQuality] = useState('');
  const [audioQuality, setAudioQuality] = useState('');
  
  // Loading states
  const [fetchingQualities, setFetchingQualities] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  // Download result
  const [downloadResult, setDownloadResult] = useState(null);
  const [error, setError] = useState(null);

  const handleURLRequest = async (url) => {
    if (!url) {
      setError('YouTube URL is required!');
      return;
    }

    // Basic URL validation
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    // Reset state 
    setFetchingQualities(true);
    setError(null);
    setQualities([]);
    setVideoQuality('');
    setAudioQuality('');
    setDownloadResult(null);

    try {
      const response = await databaseService.getQuality({ url });
      
      if (!response || !response.qualities || response.qualities.length === 0) {
        throw new Error('No qualities found for the provided URL. Please check if the video is available.');
      }
      
      console.log('Fetched qualities:', response.qualities);
      setQualities(response.qualities);
    } catch (error) {
      setError(error.message || 'Error fetching video qualities');
      console.error('Error fetching video qualities:', error);
    } finally {
      setFetchingQualities(false);
    }
  };

  const handleDownloadRequest = async () => {
    if (!videoQuality) {
      setError('Video quality is required!');
      return;
    }
    if (!audioQuality) {
      setError('Audio quality is required!');
      return;
    }
    if (!url) {
      setError('YouTube URL is required!');
      return;
    }

    setDownloading(true);
    setError(null);
    setDownloadResult(null);

    try {
      const response = await databaseService.downloadVideo({ 
        videoQuality, 
        audioQuality, 
        url 
      });
      
      if (!response || !response.downloadLink) {
        throw new Error('Download link not found.');
      }
      
      const fullDownloadUrl = `${import.meta.env.VITE_API_URL}${response.downloadLink}`;
      setDownloadResult({
        url: fullDownloadUrl,
        filename: response.downloadLink.split('/').pop() || 'downloaded_video.mp4',
        message: response.message
      });
      
      console.log('Download ready:', response);
    } catch (error) {
      setError(error.message || 'Error processing download');
      console.error('Error downloading video:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDirectDownload = () => {
    if (downloadResult) {
      window.open(downloadResult.url, '_blank');
    }
  };

  const resetForm = () => {
    setUrl('');
    setQualities([]);
    setVideoQuality('');
    setAudioQuality('');
    setDownloadResult(null);
    setError(null);
  };

  const videoQualities = qualities.filter(q => q.videoQuality);
  const audioQualities = qualities.filter(q => q.audioQuality);

  // Helper function to format file size
  const formatFileSize = (size) => {
    if (!size || size === 'Unknown' || size === '~') return 'Size unknown';
    
    // If size is already formatted with units, clean it up
    if (size.match(/[KMGT]iB/i)) {
      // Convert from binary units (KiB, MiB, GiB) to decimal (KB, MB, GB)
      return size.replace(/iB/gi, 'B');
    }
    
    if (size.match(/[KMGT]B/i)) {
      // Already in good format, just ensure proper capitalization
      return size.toUpperCase().replace(/([KMGT])B/, '$1B');
    }
    
    // Try to parse as bytes and convert
    const bytes = parseFloat(size);
    if (isNaN(bytes)) return size;
    
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return Math.round(bytes) + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    if (bytes < 1024 * 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    return (bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1) + ' TB';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Play className="w-8 h-8 text-red-500 mr-2" />
            <h1 className="text-3xl font-bold text-gray-800">YouTube Downloader</h1>
          </div>
          <p className="text-gray-600">Download your favorite YouTube videos in high quality</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          {/* URL Input Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YouTube Video URL
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Link className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={fetchingQualities || downloading}
                  onKeyPress={(e) => e.key === 'Enter' && handleURLRequest(url)}
                />
              </div>
              <button
                onClick={() => handleURLRequest(url)}
                disabled={fetchingQualities || downloading || !url}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {fetchingQualities ? (
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Fetching...
                  </div>
                ) : (
                  'Get Qualities'
                )}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Quality Selection */}
          {qualities.length > 0 && !downloadResult && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Quality</h3>
              
              {/* Quality Summary */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Found {videoQualities.length} video qualities and {audioQualities.length} audio qualities
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Video Quality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Video className="w-4 h-4 inline mr-1" />
                    Video Quality
                  </label>
                  <select
                    value={videoQuality}
                    onChange={(e) => setVideoQuality(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={downloading}
                  >
                    <option value="">Select Video Quality</option>
                    {videoQualities.map((quality, index) => (
                      <option key={index} value={quality.format}>
                        {quality.videoQuality} ({quality.extension}) - {formatFileSize(quality.fileSize)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Audio Quality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Music className="w-4 h-4 inline mr-1" />
                    Audio Quality
                  </label>
                  <select
                    value={audioQuality}
                    onChange={(e) => setAudioQuality(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={downloading}
                  >
                    <option value="">Select Audio Quality</option>
                    {audioQualities.map((quality, index) => (
                      <option key={index} value={quality.format}>
                        {quality.audioQuality} ({quality.extension}) - {formatFileSize(quality.fileSize)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected Quality Preview */}
              {videoQuality && audioQuality && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    <strong>Selected:</strong> {videoQualities.find(q => q.format === videoQuality)?.videoQuality} video + {audioQualities.find(q => q.format === audioQuality)?.audioQuality} audio
                  </p>
                </div>
              )}

              {/* Download Button */}
              <button
                onClick={handleDownloadRequest}
                disabled={downloading || !videoQuality || !audioQuality}
                className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {downloading ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    Processing Download... This may take a few minutes
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Download className="w-5 h-5 mr-2" />
                    Start Download
                  </div>
                )}
              </button>
              
              {downloading && (
                <p className="text-center text-sm text-gray-600 mt-2">
                  Please wait while we download and merge your video...
                </p>
              )}
            </div>
          )}

          {/* Download Result */}
          {downloadResult && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  {downloadResult.message || 'Your video is ready!'}
                </h3>
                <p className="text-green-700 mb-2">
                  <strong>File:</strong> {downloadResult.filename}
                </p>
                <p className="text-green-700 mb-4">
                  Click the button below to download your video
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button
                    onClick={handleDirectDownload}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Download Video
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Download Another
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">How it works</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
              <span>Paste your YouTube video URL in the input field above</span>
            </div>
            <div className="flex items-start">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
              <span>Click "Get Qualities" to fetch available video and audio options</span>
            </div>
            <div className="flex items-start">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
              <span>Select your preferred video and audio quality from the dropdowns</span>
            </div>
            <div className="flex items-start">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
              <span>Click "Start Download" and wait for the server to process your request</span>
            </div>
            <div className="flex items-start">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">5</span>
              <span>Download your processed video when the link becomes available</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-700">
              <strong>Note:</strong> Video processing may take several minutes depending on video length and quality. The server downloads video and audio separately, then merges them for the best quality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;