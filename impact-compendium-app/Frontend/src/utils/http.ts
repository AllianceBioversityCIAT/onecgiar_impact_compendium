const FILENAME_STAR_PATTERN = /filename\*=UTF-8''([^;]+)/i;
const FILENAME_PATTERN = /filename=(?:"([^"]+)"|([^;]+))/i;

export function parseFilename(
  contentDisposition: string | null
): string | null {
  if (!contentDisposition) {
    return null;
  }

  const encodedMatch = contentDisposition.match(FILENAME_STAR_PATTERN);
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1].trim());
  }

  const plainMatch = contentDisposition.match(FILENAME_PATTERN);
  const filename = plainMatch?.[1] ?? plainMatch?.[2];

  return filename ? filename.trim() : null;
}
