async function fetchWithTimeout<T>(
  url: string,
  parseResponse: (text: string) => T,
  timeoutMs: number,
  headers?: HeadersInit
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal, headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    return parseResponse(await response.text());
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchRemoteJson(
  targetUrl: string,
  timeoutMs = 9000
): Promise<unknown> {
  return fetchRemoteResource(targetUrl, (text) => JSON.parse(text), timeoutMs, {
    Accept: 'application/json, text/plain, */*',
  });
}

export async function fetchRemoteResource<T>(
  targetUrl: string,
  parseResponse: (text: string) => T,
  timeoutMs = 9000,
  headers?: HeadersInit
): Promise<T> {
  try {
    return await fetchWithTimeout(targetUrl, parseResponse, timeoutMs, headers);
  } catch (directError) {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      return await fetchWithTimeout(proxyUrl, parseResponse, timeoutMs);
    } catch {
      throw directError;
    }
  }
}