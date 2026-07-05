/** The message of an error thrown by the API layer (an ApiError carries the backend's text), or the fallback. */
export const errorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = String((error as { message: unknown }).message);
    if (message) return message;
  }
  return fallback;
};

/**
 * Splits the backend's validation message ("phone: Invalid format, bio: Too long") into one entry per field.
 * Returns an empty object when the message is not in that shape.
 */
export const parseFieldErrors = (message: string): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const part of message.split(/,\s*(?=\w+:\s)/)) {
    const match = part.match(/^(\w+):\s*(.+)$/);
    if (match) errors[match[1]] = match[2].trim();
  }
  return errors;
};
