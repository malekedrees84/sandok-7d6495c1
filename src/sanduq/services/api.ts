// localStorage-only API service (no external backend)
const SCRIPT_URL_KEY = 'sanduq_script_url';

export const getScriptUrl = (): string => {
  return localStorage.getItem(SCRIPT_URL_KEY) || '';
};

export const setScriptUrl = (url: string) => {
  localStorage.setItem(SCRIPT_URL_KEY, url);
};

export const api = {
  fetchData: async (): Promise<any> => {
    const url = getScriptUrl();
    if (!url) return null;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.warn('Cloud fetch failed, using local data', error);
      return null;
    }
  },

  saveData: async (data: any): Promise<void> => {
    const url = getScriptUrl();
    if (!url) return;
    
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        mode: 'no-cors'
      });
    } catch (error) {
      console.warn('Cloud save failed', error);
    }
  }
};
