import { toast } from 'react-hot-toast';

import { authService } from '../services/auth';

export function parseFilename(
  contentDisposition: string | null
): string | null {
  if (!contentDisposition) {
    return null;
  }

  const match =
    contentDisposition.match(/filename\*\s*=\s*[^']*''([^;]+)/i) ??
    contentDisposition.match(/filename\s*=\s*"?([^";]+)"?/i);

  return match ? decodeURIComponent(match[1].trim()) : null;
}

interface DownloadXlsxOptions {
  setExporting: (isExporting: boolean) => void;
  url: string;
  loadingMessage: string;
  successMessage: string;
  fallbackFilename: () => string;
}

export async function downloadXlsx({
  setExporting,
  url,
  loadingMessage,
  successMessage,
  fallbackFilename,
}: DownloadXlsxOptions): Promise<void> {
  setExporting(true);
  const loadingToast = toast.loading(loadingMessage, { duration: 0 });

  try {
    const authHeaders = await authService.getAuthHeaders();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...authHeaders,
        Accept:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

    const contentType = response.headers.get('content-type') ?? '';
    if (!response.ok || !contentType.includes('spreadsheetml')) {
      let detail = response.statusText;

      try {
        const errorBody = await response.json();
        detail = errorBody.detail ?? errorBody.error ?? detail;
      } catch {
        // Ignore non-JSON error bodies and fall back to status text.
      }

      throw new Error(detail);
    }

    const blob = await response.blob();
    const filename =
      parseFilename(response.headers.get('content-disposition')) ??
      fallbackFilename();

    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);

    toast.dismiss(loadingToast);
    toast.success(successMessage, { duration: 5000 });
  } catch (error) {
    console.error('Excel export error:', error);
    toast.dismiss(loadingToast);
    toast.error(
      `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { duration: 5000 }
    );
  } finally {
    setExporting(false);
  }
}
