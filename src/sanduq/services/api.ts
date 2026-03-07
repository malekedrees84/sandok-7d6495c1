// Default fallback URL
const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwt7MgpobhUnB4zCtG_f-WqWpdWdpMzm2xb72LloXJcRVqZnQr8-vLmlbiJPumu4P7q/exec";
const STORAGE_KEY_URL = "sanduq_api_url";

// Helper to get the current URL
export const getScriptUrl = () => {
  return localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_SCRIPT_URL;
};

// Helper to set a new URL
export const setScriptUrl = (url: string) => {
  if (!url) {
    localStorage.removeItem(STORAGE_KEY_URL);
  } else {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
  }
};

export const api = {
  // Fetch all data from the sheet
  fetchData: async () => {
    const url = getScriptUrl();
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching data from Google Sheet:", error);
      throw error;
    }
  },

  // Save specific data to the sheet (POST)
  saveData: async (data: { key: string; value: string } | { key: string; value: string }[]) => {
    const url = getScriptUrl();
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error("Error saving data to Google Sheet:", error);
    }
  },
};
