import axios from 'axios';

const apiBaseUrl =
  import.meta.env.VITE_API_URL ||
  'https://predictflow-1.onrender.com/api';

const api = axios.create({
  baseURL: apiBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,

  async (err) => {
    if (err.response?.status === 401) {
      const refresh = localStorage.getItem('refreshToken');

      if (refresh) {
        try {
          const { data } = await axios.post(
            `${apiBaseUrl}/auth/refresh`,
            {
              refreshToken: refresh,
            }
          );

          localStorage.setItem('token', data.token);

          if (err.config.headers) {
            err.config.headers.Authorization =
              `Bearer ${data.token}`;
          }

          return axios({
            ...err.config,
            baseURL: apiBaseUrl,
          });

        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(err);
  }
);

export default api;