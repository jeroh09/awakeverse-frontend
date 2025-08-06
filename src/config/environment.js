const environment = {
  development: {
    API_URL: 'http://localhost:5000',
    API_BASE_URL: 'http://localhost:5000',
    WS_URL: 'http://localhost:5000',
  },
  production: {
    API_URL: 'https://api.awakeverse.com',
    API_BASE_URL: 'https://api.awakeverse.com', 
    WS_URL: 'https://api.awakeverse.com',
  }
};

const currentEnv = process.env.NODE_ENV || 'development';
export default environment[currentEnv];
