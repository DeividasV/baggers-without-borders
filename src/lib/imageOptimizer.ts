import sharp from "sharp";

/**
 * Custom error types for image optimization
 */
export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

export class ImageCorruptedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageCorruptedError";
  }
}

export class ImageProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

/**
 * Validate that the file is an image by checking magic bytes
 * @param buffer File buffer
 * @throws ImageValidationError if not a valid image format
 */
export async function validateImageFile(buffer: Buffer): Promise<void> {
  // Check magic bytes for common image formats
  const magicBytes = buffer.slice(0, 12);

  // PNG: 89 50 4E 47
  const isPNG = magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && magicBytes[2] === 0x4e && magicBytes[3] === 0x47;

  // JPEG: FF D8 FF
  const isJPEG = magicBytes[0] === 0xff && magicBytes[1] === 0xd8 && magicBytes[2] === 0xff;

  // WebP: 52 49 46 46 ... 57 45 42 50
  const isWebP = 
    magicBytes[0] === 0x52 && magicBytes[1] === 0x49 && 
    magicBytes[2] === 0x46 && magicBytes[3] === 0x46 &&
    magicBytes[8] === 0x57 && magicBytes[9] === 0x45 &&
    magicBytes[10] === 0x42 && magicBytes[11] === 0x50;

  // GIF: 47 49 46 38
  const isGIF = magicBytes[0] === 0x47 && magicBytes[1] === 0x49 && magicBytes[2] === 0x46 && magicBytes[3] === 0x38;

  if (!isPNG && !isJPEG && !isWebP && !isGIF) {
    throw new ImageValidationError(
      "Unsupported image format. Please upload PNG, JPEG, WebP, or GIF files only."
    );
  }

  // Try to get metadata to verify the file isn't corrupted
  try {
    await sharp(buffer).metadata();
  } catch (error) {
    throw new ImageCorruptedError(
      "Unable to read image file. The file may be corrupted. Please try re-exporting the image from your photo editor."
    );
  }
}

/**
 * Optimize image for HoF Meister reports
 * - Resize to max 800x600px (maintaining aspect ratio)
 * - Convert to WebP format
 * - 85% quality
 * 
 * @param buffer Original image buffer
 * @returns Optimized WebP buffer
 * @throws ImageProcessingError if optimization fails
 */
export async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  try {
    // First validate the image
    await validateImageFile(buffer);

    // Get original dimensions
    const metadata = await sharp(buffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new ImageProcessingError("Unable to determine image dimensions.");
    }

    // Calculate resize dimensions (max 800x600, maintain aspect ratio)
    let targetWidth = metadata.width;
    let targetHeight = metadata.height;

    const maxWidth = 800;
    const maxHeight = 600;

    if (targetWidth > maxWidth || targetHeight > maxHeight) {
      const widthRatio = maxWidth / targetWidth;
      const heightRatio = maxHeight / targetHeight;
      const ratio = Math.min(widthRatio, heightRatio);

      targetWidth = Math.round(targetWidth * ratio);
      targetHeight = Math.round(targetHeight * ratio);
    }

    // Optimize and convert to WebP
    const optimized = await sharp(buffer)
      .resize(targetWidth, targetHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 85,
        effort: 4, // Balance between speed and compression
      })
      .toBuffer();

    return optimized;
  } catch (error) {
    // Re-throw our custom errors
    if (
      error instanceof ImageValidationError ||
      error instanceof ImageCorruptedError
    ) {
      throw error;
    }

    // Wrap sharp errors
    throw new ImageProcessingError(
      `Failed to process image: ${(error as Error).message}. Please try a different image file.`
    );
  }
}

/**
 * Get suggested error message and type for API responses
 */
export function getImageErrorDetails(error: unknown): {
  error: string;
  errorType: string;
  suggestion: string;
} {
  if (error instanceof ImageValidationError) {
    return {
      error: error.message,
      errorType: "validation",
      suggestion: "Please upload a PNG, JPEG, WebP, or GIF image file.",
    };
  }

  if (error instanceof ImageCorruptedError) {
    return {
      error: error.message,
      errorType: "corrupted",
      suggestion: "Try opening and re-exporting the image in your photo editor.",
    };
  }

  if (error instanceof ImageProcessingError) {
    return {
      error: error.message,
      errorType: "processing",
      suggestion: "Try using a different image file or a different format (PNG/JPEG).",
    };
  }

  return {
    error: "An unexpected error occurred while processing the image.",
    errorType: "unknown",
    suggestion: "Please try again with a different image file.",
  };
}
