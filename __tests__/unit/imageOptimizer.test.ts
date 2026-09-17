import sharp from "sharp";
import {
  validateImageFile,
  optimizeImage,
  getImageErrorDetails,
  ImageValidationError,
  ImageCorruptedError,
  ImageProcessingError,
} from "@/src/lib/imageOptimizer";

describe("validateImageFile", () => {
  it("should validate PNG images", async () => {
    const validPng = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    await expect(validateImageFile(validPng)).resolves.not.toThrow();
  });

  it("should validate JPEG images", async () => {
    const validJpeg = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    await expect(validateImageFile(validJpeg)).resolves.not.toThrow();
  });

  it("should validate WebP images", async () => {
    const validWebP = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .webp()
      .toBuffer();

    await expect(validateImageFile(validWebP)).resolves.not.toThrow();
  });

  it("should reject non-image files", async () => {
    const textBuffer = Buffer.from("This is not an image");

    await expect(validateImageFile(textBuffer)).rejects.toThrow(
      ImageValidationError
    );
    await expect(validateImageFile(textBuffer)).rejects.toThrow(
      "Unsupported image format"
    );
  });

  it("should reject corrupted images", async () => {
    // Create buffer with PNG magic bytes but corrupted data
    const corruptedPng = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      Buffer.from("corrupted data that is not valid PNG"),
    ]);

    await expect(validateImageFile(corruptedPng)).rejects.toThrow(
      ImageCorruptedError
    );
    await expect(validateImageFile(corruptedPng)).rejects.toThrow(
      "Unable to read image file"
    );
  });

  it("should reject files with wrong magic bytes", async () => {
    const wrongMagicBytes = Buffer.from([
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);

    await expect(validateImageFile(wrongMagicBytes)).rejects.toThrow(
      ImageValidationError
    );
  });
});

describe("optimizeImage", () => {
  it("should convert image to WebP format", async () => {
    const originalJpeg = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    const optimized = await optimizeImage(originalJpeg);
    const metadata = await sharp(optimized).metadata();

    expect(metadata.format).toBe("webp");
  });

  it("should resize large images to max 800x600", async () => {
    const largeImage = await sharp({
      create: {
        width: 2000,
        height: 1500,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    const optimized = await optimizeImage(largeImage);
    const metadata = await sharp(optimized).metadata();

    expect(metadata.width).toBeLessThanOrEqual(800);
    expect(metadata.height).toBeLessThanOrEqual(600);
  });

  it("should maintain aspect ratio when resizing", async () => {
    const wideImage = await sharp({
      create: {
        width: 1600,
        height: 800,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    const optimized = await optimizeImage(wideImage);
    const metadata = await sharp(optimized).metadata();

    const aspectRatio = metadata.width! / metadata.height!;
    expect(aspectRatio).toBeCloseTo(2.0, 1); // 2:1 ratio
  });

  it("should not enlarge small images", async () => {
    const smallImage = await sharp({
      create: {
        width: 200,
        height: 150,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    const optimized = await optimizeImage(smallImage);
    const metadata = await sharp(optimized).metadata();

    expect(metadata.width).toBeLessThanOrEqual(200);
    expect(metadata.height).toBeLessThanOrEqual(150);
  });

  it("should reduce file size", async () => {
    const originalJpeg = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 255, g: 100, b: 50 },
      },
    })
      .jpeg({ quality: 100 })
      .toBuffer();

    const optimized = await optimizeImage(originalJpeg);

    // WebP at 85% quality should be smaller than 100% quality JPEG
    expect(optimized.length).toBeLessThan(originalJpeg.length);
  });

  it("should throw ImageValidationError for invalid format", async () => {
    const invalidBuffer = Buffer.from("not an image");

    await expect(optimizeImage(invalidBuffer)).rejects.toThrow(
      ImageValidationError
    );
  });

  it("should handle very tall images", async () => {
    const tallImage = await sharp({
      create: {
        width: 400,
        height: 2000,
        channels: 3,
        background: { r: 0, g: 255, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    const optimized = await optimizeImage(tallImage);
    const metadata = await sharp(optimized).metadata();

    expect(metadata.width).toBeLessThanOrEqual(800);
    expect(metadata.height).toBeLessThanOrEqual(600);

    // Aspect ratio should be preserved (1:5 = 0.2)
    const aspectRatio = metadata.width! / metadata.height!;
    expect(aspectRatio).toBeCloseTo(0.2, 1);
  });
});

describe("getImageErrorDetails", () => {
  it("should return validation error details", () => {
    const error = new ImageValidationError("Invalid format");
    const details = getImageErrorDetails(error);

    expect(details.errorType).toBe("validation");
    expect(details.error).toBe("Invalid format");
    expect(details.suggestion).toContain("PNG, JPEG, WebP");
  });

  it("should return corrupted error details", () => {
    const error = new ImageCorruptedError("File corrupted");
    const details = getImageErrorDetails(error);

    expect(details.errorType).toBe("corrupted");
    expect(details.error).toBe("File corrupted");
    expect(details.suggestion).toContain("re-exporting");
  });

  it("should return processing error details", () => {
    const error = new ImageProcessingError("Processing failed");
    const details = getImageErrorDetails(error);

    expect(details.errorType).toBe("processing");
    expect(details.error).toBe("Processing failed");
    expect(details.suggestion).toContain("different image");
  });

  it("should return unknown error details for other errors", () => {
    const error = new Error("Something went wrong");
    const details = getImageErrorDetails(error);

    expect(details.errorType).toBe("unknown");
    expect(details.error).toContain("unexpected error");
    expect(details.suggestion).toContain("try again");
  });

  it("should handle errors without messages", () => {
    const error = new Error();
    const details = getImageErrorDetails(error);

    expect(details.errorType).toBe("unknown");
    expect(details.error).toBeDefined();
    expect(details.suggestion).toBeDefined();
  });
});
