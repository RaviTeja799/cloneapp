import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param {string} content - The HTML content to sanitize
 * @returns {string} - Sanitized HTML safe for rendering
 */
export const sanitizeHtml = (content: string): string => {
  if (!content) return '';
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'object', 'embed', 'link'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    ALLOW_DATA_ATTR: false
  });
};

/**
 * Sanitizes plain text for safe display in HTML
 * @param {string} text - The text content to sanitize
 * @returns {string} - Sanitized text safe for rendering
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // Convert special characters to HTML entities
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Creates safe URLs
 * @param {string} url - The URL to sanitize
 * @returns {string} - A sanitized URL
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  
  // Only allow http, https and mailto protocols
  const pattern = /^(?:(?:https?|mailto):)?(?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=]+$/i;
  return pattern.test(url) ? url : '';
};

/**
 * Renders user content safely with newlines preserved
 * @param {string} content - The user content to display
 * @returns {string} - HTML with newlines converted to <br> tags
 */
export const renderTextWithNewlines = (content: string): string => {
  if (!content) return '';
  
  // First sanitize the content
  const sanitized = sanitizeText(content);
  
  // Replace newlines with <br> tags
  const withLineBreaks = sanitized.replace(/\n/g, '<br>');
  
  // Use DOMPurify as a final safety measure for the HTML with <br> tags
  return DOMPurify.sanitize(withLineBreaks, {
    ALLOWED_TAGS: ['br'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'object', 'embed', 'link'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    ALLOW_DATA_ATTR: false
  });
};

/**
 * Sanitize user input in an object
 * @param {Object} data - The object containing user input
 * @returns {Object} - A sanitized copy of the object
 */
export const sanitizeUserInput = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeText(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};