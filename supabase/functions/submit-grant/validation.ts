export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_FILES = 5;
export const FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export function validateAttachments(files: { size: number; type: string }[]): string | null {
  if (files.length > MAX_FILES) return 'يمكن إرفاق خمسة ملفات كحد أقصى';
  if (files.some(file => !FILE_TYPES.includes(file.type))) return 'المرفقات المسموحة: PDF أو JPG أو PNG';
  if (files.some(file => file.size === 0 || file.size > MAX_FILE_SIZE)) return 'حجم كل ملف يجب أن يكون بين 1 بايت و10 ميغابايت';
  return null;
}
export function matchesFileSignature(bytes: Uint8Array, type: string): boolean {
  if (type === 'application/pdf') return [37, 80, 68, 70, 45].every((byte, i) => bytes[i] === byte);
  if (type === 'image/jpeg') return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (type === 'image/png') return [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte);
  return false;
}