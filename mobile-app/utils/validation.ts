/**
 * Validates if a phone number matches Lebanese mobile formats.
 * Supported:
 * - Local (03xxxxxx, 70xxxxxx, etc) - 8 digits
 * - International (+961 3xxxxxx, +961 70xxxxxx, etc) - 11/12 digits
 * 
 * Returns an error message string or null if valid.
 */
export const validateLebanesePhone = (phone: string): string | null => {
  const clean = phone.trim().replace(/ /g, '');
  if (!clean) return 'Phone number is required';

  const isLebaneseRegex = /^(\+961|0?)(3|70|71|76|78|79|81)[0-9]{6}$/;

  if (!isLebaneseRegex.test(clean)) {
    if (!clean.startsWith('0') && !clean.startsWith('+961') && !['3','7','8'].includes(clean[0])) {
      return 'Number is not Lebanese';
    }
    if (clean.length < 7) {
      return 'Missing digits for a Lebanese number';
    }
    return 'Invalid Lebanese phone format';
  }

  return null;
};
