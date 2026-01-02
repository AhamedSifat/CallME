import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const ApiInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export { ApiInstance };
