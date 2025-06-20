import React from 'react';
import { useState } from 'react';

function Quality({ 
videoId, onQualityChange
}){
    const [quality, setQuality] = useState('720p');
    
    const handleQualityChange = (event) => {
        const newQuality = event.target.value;
        setQuality(newQuality);
        onQualityChange(newQuality);
    }

    return (
        <div className="quality-selector">
            <label htmlFor="quality">Select Video Quality:</label>
            <select 
                id="quality" 
                value={quality} 
                onChange={handleQualityChange}
            >
                <option value="144p">144p</option>
                <option value="240p">240p</option>
                <option value="360p">360p</option>
                <option value="480p">480p</option>
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
            </select>
        </div>
    );
}

export default Quality;