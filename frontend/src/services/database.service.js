import axiosInstance from '../utils/axios.js';


class DatabaseService {
    async getQuality({url}){
        try {
            const response = await axiosInstance.post('/get-quality', { url });
            return response.data;
        } catch (error) {
            console.error('Error fetching URL quality:', error);
            throw error;
        }
    }
    async downloadVideo({videoQuality, audioQuality, url}) {
        try {
            const response = await axiosInstance.post('/download', {
                videoFormat:videoQuality,
                audioFormat:audioQuality || '140', // Default to 140 if not provided
                url
            });
            return response.data;
        } catch (error) {
            console.error('Error downloading video:', error);
            throw error;
        }
    }
}
const databaseService = new DatabaseService();
export default databaseService;