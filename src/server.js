import axios from 'axios';

export let server = null;

(async function () {
  server = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL,
  });

  server.interceptors.request.use(
    async (request) => {
      if (!request.headers['Authorization']) {
        request.headers['authorization'] = '';
      }
      request.headers['app-version'] = '1';

      return request;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  server.interceptors.response.use(
    async function (response) {
      return response;
    },
  );
})();
