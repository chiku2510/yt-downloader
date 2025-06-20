import { useState } from 'react'
import databaseService from './services/database.service.js'
import './App.css'
import config from './conf/config.js'

function App() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [url, setUrl] = useState('');
  const [qualities, setQualities] = useState([]);

  const [videoQuality, setVideoQuality] = useState('');
  const [audioQuality, setAudioQuality] = useState('');



  const handleURLRequest = async (url) => {
    if (!url) {
      setError(new Error('YouTube URL is required!'));
      setLoading(false);
      return;
    }

    //reset state 
    setLoading(true);
    setError(null);
    setQualities([]);
    setVideoQuality('');
    setAudioQuality('');

    await databaseService.getQuality({ url })
      .then((response) => {
        if (!response || !response.qualities || response.qualities.length === 0) {
          throw new Error('No qualities found for the provided URL.');
        }
        else {
          console.log('Fetched qualities:', response.qualities);
          // Set the fetched qualities to state 
          setQualities(response.qualities);
        }
      })
      .catch((error) => {
        setError(error);
        console.error('Error fetching video qualities:', error);
      })
      .finally(() => {
        setLoading(false);
      })
  };

  const handleDownloadRequest = async () => {
    if (!videoQuality) {
      setError(new Error('Video quality is required!'));
      return;
    }
    if(!audioQuality) {
      setError(new Error('Audio quality is required!'));
      return;
    }
    if(!url) {
      setError(new Error('YouTube URL is required!'));
      return;
    }

    setLoading(true);
    setError(null);

    await databaseService.downloadVideo({ videoQuality, audioQuality,url})
    .then((response) => {
      if (!response || !response.downloadLink) {
        throw new Error('Download link not found.');
      }
      // Create a link element to download the video
      const link = document.createElement('a');
      link.href = config.apiURL + response.downloadLink;;
      link.download = 'downloaded_video.mp4'; // You can set a default filename here
      document.body.appendChild(link); // Append the link to the body
      link.click(); // Trigger the download
      document.body.removeChild(link); // Remove the link after download
      console.log('Download started:', response.downloadLink);
    })
    .catch((error) => {
      setError(error);
      console.error('Error downloading video:', error);
    })
    .finally(() => {
      setLoading(false);
    });
  };

  return (
    <>
      <div>
        <h2>
          Welcome to youtube video downloader
        </h2>

        {/* required components */}
        {/* 1. form to accept URL which will trigger get-quality  */}
        <div>
          <input type="text" placeholder="Enter YouTube Video URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button onClick={() =>
            handleURLRequest(url)
          }>Get Quality</button>
        </div>
        {/* 2. display the available qualities, sent by backend server */}
        <div>
          {loading && <p>Loading...</p>}
          {error && <p>Error: {error.message}</p>}
          {qualities.length > 0 && (
            <div>
              <h3>Select Video and Audio Quality</h3>
              <div>
                <label>
                  Video Quality:
                  <select value={videoQuality} onChange={(e) => setVideoQuality(e.target.value)}>
                    <option value="">Select Video Quality</option>
                    {qualities.map((quality, index) => (
                      quality.videoQuality && (
                        <option key={index} value={quality.format}>
                          {quality.videoQuality} ({quality.extension}) ({quality.fileSize})
                        </option>
                      )
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label>
                  Audio Quality:
                  <select value={audioQuality} onChange={(e) => setAudioQuality(e.target.value)}>
                    <option value="">Select Audio Quality</option>
                    {qualities.map((quality, index) => (
                      quality.audioQuality && (
                        <option key={index} value={quality.format}>
                          {quality.audioQuality} ({quality.extension}) ({quality.fileSize}) 
                        </option>
                      )
                    ))}
                  </select>
                </label>
              </div>

             
              <button onClick={() => handleDownloadRequest()}>Submit</button>
            </div>
          )}
        </div>



        {/* 3. display available qualities and users create another button [submit] which will send a download request to the server */}
        {/* It will be in JSON formata and we will iterate through it and displays it and send AudioQuality and videoQuality to the backend server with new download request */}
        {/* 4. backend server will download and merge the request and send a link to fronted and we will directly download video from that link */}
      </div>
    </>
  )
}

export default App
