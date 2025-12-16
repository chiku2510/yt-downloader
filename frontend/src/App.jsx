import { useState } from 'react'
import {
  Download,
  Link,
  Play,
  Video,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

// Database service
const databaseService = {
  getQuality: async ({ url }) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/get-quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch qualities')
    }

    return response.json()
  },

  downloadVideo: async ({ format, url }) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        videoFormat: format,
        audioFormat: format // muxed format → same id
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Download failed')
    }

    return response.json()
  }
}

function App() {
  const [url, setUrl] = useState('')
  const [qualities, setQualities] = useState([])
  const [selectedFormat, setSelectedFormat] = useState('')

  const [fetchingQualities, setFetchingQualities] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const [downloadResult, setDownloadResult] = useState(null)
  const [error, setError] = useState(null)

  // -------------------------
  // Helpers
  // -------------------------
  const formatFileSize = (size) => {
    if (!size) return 'Unknown'
    return size.replace(/iB/g, 'B')
  }

  // -------------------------
  // Fetch qualities
  // -------------------------
  const handleURLRequest = async () => {
    if (!url) {
      setError('YouTube URL is required!')
      return
    }

    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      setError('Please enter a valid YouTube URL')
      return
    }

    setFetchingQualities(true)
    setError(null)
    setQualities([])
    setSelectedFormat('')
    setDownloadResult(null)

    try {
      const response = await databaseService.getQuality({ url })

      if (!response?.qualities?.length) {
        throw new Error('No qualities found for this video.')
      }

      // Normalize backend response
      const formatted = response.qualities.map(q => ({
        id: q.id,
        resolution: q.resolution,
        fps: q.fps,
        extension: q.extension,
        fileSize: q.fileSize,
        bitrate: q.bitrate,
        videoCodec: q.videoCodec,
        audioCodec: q.audioCodec
      }))

      setQualities(formatted)
    } catch (err) {
      setError(err.message)
    } finally {
      setFetchingQualities(false)
    }
  }

  // -------------------------
  // Download
  // -------------------------
  const handleDownloadRequest = async () => {
    if (!selectedFormat) {
      setError('Please select a video quality')
      return
    }

    setDownloading(true)
    setError(null)
    setDownloadResult(null)

    try {
      const response = await databaseService.downloadVideo({
        format: selectedFormat,
        url
      })

      if (!response?.downloadLink) {
        throw new Error('Download link not found')
      }

      setDownloadResult({
        url: `${import.meta.env.VITE_API_URL}${response.downloadLink}`,
        filename: response.downloadLink.split('/').pop(),
        message: response.message
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setDownloading(false)
    }
  }

  const resetForm = () => {
    setUrl('')
    setQualities([])
    setSelectedFormat('')
    setDownloadResult(null)
    setError(null)
  }

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Play className="w-8 h-8 text-red-500 mr-2" />
            <h1 className="text-3xl font-bold text-gray-800">
              YouTube Downloader
            </h1>
          </div>
          <p className="text-gray-600">
            Download YouTube videos in high quality
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">

          {/* URL Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              YouTube Video URL
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Link className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg"
                  placeholder="https://youtu.be/..."
                  disabled={fetchingQualities || downloading}
                  onKeyDown={e => e.key === 'Enter' && handleURLRequest()}
                />
              </div>
              <button
                onClick={handleURLRequest}
                disabled={fetchingQualities || downloading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg"
              >
                {fetchingQualities ? (
                  <span className="flex items-center">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Fetching
                  </span>
                ) : 'Get Qualities'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border rounded-lg flex">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Quality Selection */}
          {qualities.length > 0 && !downloadResult && (
            <>
              <label className="block text-sm font-medium mb-2">
                <Video className="inline w-4 h-4 mr-1" />
                Select Quality
              </label>

              <select
                value={selectedFormat}
                onChange={e => setSelectedFormat(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-4"
                disabled={downloading}
              >
                <option value="">Select video quality</option>
                {qualities.map((q, i) => (
                  <option key={i} value={q.id}>
                    {q.resolution} • {q.fps}fps • {q.extension.toUpperCase()} • {formatFileSize(q.fileSize)}
                  </option>
                ))}
              </select>

              <button
                onClick={handleDownloadRequest}
                disabled={!selectedFormat || downloading}
                className="w-full py-3 bg-green-600 text-white rounded-lg"
              >
                {downloading ? (
                  <span className="flex justify-center items-center">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex justify-center items-center">
                    <Download className="w-5 h-5 mr-2" />
                    Start Download
                  </span>
                )}
              </button>
            </>
          )}

          {/* Result */}
          {downloadResult && (
            <div className="bg-green-50 border rounded-lg p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {downloadResult.message || 'Your video is ready'}
              </h3>
              <p className="mb-4">{downloadResult.filename}</p>

              <div className="flex gap-3 justify-center">
                <a
                  href={downloadResult.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Download
                </a>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg"
                >
                  Download Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
