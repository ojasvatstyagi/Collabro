// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Adjust if needed
  withCredentials: true, // Enables cookies (for JWT cookie)
});

export default api;