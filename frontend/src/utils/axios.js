import axios from 'axios';
import config from '../conf/config.js';

const axiosInstance = axios.create({
    baseURL: config.apiURL || 'http://localhost:5000',
    timeout: 100000, 
    withCredentials: true, 
    headers: {
        'Content-Type': 'application/json',
    },
});
console.log('Axios instance created with base URL:', axiosInstance.defaults.baseURL);

export default axiosInstance;