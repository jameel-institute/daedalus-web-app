const rApiAddress = "http://localhost:8001";

interface RApiError {
  error: string
  detail: string
}

export interface RApiResponse {
  status: string
  errors: Array<RApiError> | null
  data: object | null
}

// NB 'refresh' cannot yet be used since it would be called in the browser and
// thus run up against CORS restrictions. CORS also prevents hot module reloading, currently.
export function useRApi<T extends RApiResponse>(endpoint: string) {
  const url = rApiAddress + endpoint;

  const { data, error, status: fetchStatus, refresh } = useFetch<T>(url);

  const responseData = computed(() => data.value as T | null);

  return {
    responseData, // This is the response data, not the value of the 'data' key in the response data.
    fetchStatus, // This is the status of the fetch request (e.g. pending), not the value of the 'status' part of the response data.
    refresh, // refresh is a function that can be called to re-fetch the data
    error, // This is the error object from Vue, not the value of the 'errors' key in the response data.
  };
}
