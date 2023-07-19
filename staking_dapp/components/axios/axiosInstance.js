import axios from 'axios';

const baseURL = 'https://api.lezgu.online/api';
// const baseURL = 'http://localhost:3001/api';
console.log('Using baseURL:', baseURL);

const instance = axios.create({
    baseURL: baseURL
});

export default instance;
