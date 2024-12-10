import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

const BASE_URL = "https://ec2api.deltatech-backend.com/api/v1";
const BASE_URLV2 = "https://ec2api.deltatech-backend.com/api/v2";

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const axiosInstanceV2 = axios.create({
  baseURL: BASE_URLV2,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const getAccessToken = (): string | null => {
  return localStorage.getItem("authToken");
};

const getRefreshToken = (): string | null => {
  return localStorage.getItem("refreshToken");
};

const setAccessToken = (token: string): void => {
  localStorage.setItem("authToken", token);
};

const clearTokens = (): void => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
};

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      throw new Error("Refresh token not found");
    }

    const response = await axios.put(`${BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });

    const newAccessToken = response.data[0];
    setAccessToken(newAccessToken);

    return newAccessToken;
  } catch (error) {
    clearTokens();
    console.error("Failed to refresh access token", error);
    window.location.href = "/";
    return null;
  }
};

// Interceptor cho axiosInstance (BASE_URL)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    if (
      error.response?.status === 403 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

// Interceptor cho axiosInstanceV2 (BASE_URLV2)
axiosInstanceV2.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

axiosInstanceV2.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    if (
      error.response?.status === 403 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstanceV2(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

export { axiosInstance, axiosInstanceV2 };

// import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

// const BASE_URL = "https://ec2api.deltatech-backend.com/api/v1";
// const BASE_URLV2 = "https://ec2api.deltatech-backend.com/api/v2";

// interface CustomAxiosRequestConfig extends AxiosRequestConfig {
//   _retry?: boolean;
// }

// const axiosInstance = axios.create({
//   baseURL: BASE_URL,
//   headers: {
//     Accept: "application/json",
//     "Content-Type": "application/json",
//   },
// });

// const axiosInstanceV2 = axios.create({
//   baseURL: BASE_URLV2,
//   headers: {
//     Accept: "application/json",
//     "Content-Type": "application/json",
//   },
// });

// const getAccessToken = (): string | null => localStorage.getItem("authToken");
// const getRefreshToken = (): string | null =>
//   localStorage.getItem("refreshToken");
// const setAccessToken = (token: string): void =>
//   localStorage.setItem("authToken", token);
// const clearTokens = (): void => {
//   localStorage.removeItem("authToken");
//   localStorage.removeItem("refreshToken");
// };

// let isRefreshing = false;
// let failedQueue: any[] = [];

// const processQueue = (error: any, token: string | null = null) => {
//   failedQueue.forEach((prom) =>
//     error ? prom.reject(error) : prom.resolve(token)
//   );
//   failedQueue = [];
// };

// const refreshAccessToken = async (): Promise<string | null> => {
//   try {
//     if (isRefreshing) {
//       return new Promise((resolve, reject) => {
//         failedQueue.push({ resolve, reject });
//       });
//     }

//     isRefreshing = true;
//     const refreshToken = getRefreshToken();
//     if (!refreshToken) throw new Error("Refresh token not found");

//     const response = await axios.put(`${BASE_URL}/auth/refresh`, {
//       refresh_token: refreshToken,
//     });
//     const newAccessToken = response.data[0];
//     setAccessToken(newAccessToken);
//     processQueue(null, newAccessToken);
//     return newAccessToken;
//   } catch (error) {
//     processQueue(error, null);
//     clearTokens();
//     window.location.href = "/";
//     return null;
//   } finally {
//     isRefreshing = false;
//   }
// };

// const addAuthHeader = (config: any): any => {
//   const token = getAccessToken();
//   if (token && config.headers) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// };

// const handleResponseError = async (error: AxiosError, instance: any) => {
//   const originalRequest = error.config as CustomAxiosRequestConfig;
//   if (
//     error.response?.status === 403 &&
//     originalRequest &&
//     !originalRequest._retry
//   ) {
//     originalRequest._retry = true;
//     const newAccessToken = await refreshAccessToken();
//     if (newAccessToken) {
//       originalRequest.headers = {
//         ...originalRequest.headers,
//         Authorization: `Bearer ${newAccessToken}`,
//       };
//       return instance(originalRequest);
//     }
//   }
//   return Promise.reject(error);
// };

// // Add interceptors
// axiosInstance.interceptors.request.use(addAuthHeader, Promise.reject);
// axiosInstance.interceptors.response.use(undefined, (error) =>
//   handleResponseError(error, axiosInstance)
// );

// axiosInstanceV2.interceptors.request.use(addAuthHeader, Promise.reject);
// axiosInstanceV2.interceptors.response.use(undefined, (error) =>
//   handleResponseError(error, axiosInstanceV2)
// );

// export { axiosInstance, axiosInstanceV2 };
