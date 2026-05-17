const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(
      (payload && payload.error) || response.statusText || "Request failed"
    );
    error.response = { data: payload, status: response.status };
    throw error;
  }

  return { data: payload, status: response.status };
};

const request = async (method, url, data, config = {}) => {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(config.headers || {}),
    },
    body: data !== undefined ? JSON.stringify(data) : undefined,
    credentials: "include",
    cache: "no-store",
  });

  return parseResponse(response);
};

const axios = {
  get: (url, config) => request("GET", url, undefined, config),
  post: (url, data, config) => request("POST", url, data, config),
  patch: (url, data, config) => request("PATCH", url, data, config),
  put: (url, data, config) => request("PUT", url, data, config),
  delete: (url, config) => request("DELETE", url, undefined, config),
};

export default axios;
