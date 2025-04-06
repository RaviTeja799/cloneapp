import imageCompression from 'browser-image-compression';

/**
 * Configuration settings for image optimization
 */
export const imageConfig = {
  // Default settings for post images
  post: {
    maxSizeMB: 1,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/jpeg'
  },
  // Settings for profile/avatar images
  avatar: {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 300,
    useWebWorker: true,
    fileType: 'image/jpeg'
  }
};

/**
 * Compresses and optimizes an image file before upload
 * @param {File} imageFile - The original image file to be optimized
 * @param {'post' | 'avatar'} type - The type of image being uploaded (affects optimization settings)
 * @returns {Promise<File>} - The compressed and optimized image file
 */
export const optimizeImage = async (imageFile: File, type: 'post' | 'avatar' = 'post'): Promise<File> => {
  try {
    const options = imageConfig[type];
    
    // Check if file is already smaller than target size
    if (imageFile.size / 1024 / 1024 < options.maxSizeMB) {
      // Still resize if needed, but with less compression
      options.maxSizeMB = imageFile.size / 1024 / 1024;
    }
    
    console.log(`[ImageUtils] Optimizing ${type} image: ${imageFile.name} (${(imageFile.size / 1024).toFixed(2)} KB)`);
    const compressedFile = await imageCompression(imageFile, options);
    console.log(`[ImageUtils] Optimization complete: ${compressedFile.name} (${(compressedFile.size / 1024).toFixed(2)} KB)`);
    
    // Calculate compression ratio for logging
    const compressionRatio = imageFile.size / compressedFile.size;
    console.log(`[ImageUtils] Compression ratio: ${compressionRatio.toFixed(2)}x`);
    
    return compressedFile;
  } catch (error) {
    console.error('[ImageUtils] Error optimizing image:', error);
    // Return original file if optimization fails
    return imageFile;
  }
};

/**
 * Creates a data URL from a file (for previews)
 * @param {File} file - The file to convert to data URL
 * @returns {Promise<string>} - The data URL representing the file
 */
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Sanitizes an image file name to prevent storage path injection attacks
 * @param {string} fileName - The original file name
 * @returns {string} - A sanitized file name that's safe to use in storage paths
 */
export const sanitizeFileName = (fileName: string): string => {
  // Remove path traversal characters and limit the length
  const sanitized = fileName
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .slice(0, 50);
  
  // Add random suffix for uniqueness
  const random = Math.random().toString(36).substring(2, 6);
  const extension = fileName.split('.').pop() || 'jpg';
  
  return `${sanitized}_${random}.${extension}`;
};

/**
 * Validates an image file to ensure it's a supported image type and within size limits
 * @param {File} file - The file to validate
 * @param {number} maxSizeMB - Maximum allowed size in MB
 * @returns {string | null} - Error message if validation fails, null if valid
 */
export const validateImage = (file: File, maxSizeMB: number = 5): string | null => {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return 'Unsupported file type. Please upload JPEG, PNG, GIF, or WebP images.';
  }
  
  // Check file size
  const fileSizeMB = file.size / 1024 / 1024;
  if (fileSizeMB > maxSizeMB) {
    return `File too large. Maximum size is ${maxSizeMB}MB.`;
  }
  
  return null;
};