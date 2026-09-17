"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { JournalPhotoData, photoUrl } from "@/src/types/journal";

interface PhotoGalleryProps {
  photos: JournalPhotoData[];
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  const openLightbox = useCallback((index: number) => {
    lastFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    lastFocusedElementRef.current?.focus();
  }, []);

  const prev = useCallback(() => {
    setLightboxIndex((i) =>
      i !== null ? (i - 1 + photos.length) % photos.length : null,
    );
  }, [photos.length]);

  const next = useCallback(() => {
    setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null));
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, closeLightbox, prev, next]);

  // Lock body scroll when lightbox open
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  // Focus close button when lightbox opens
  useEffect(() => {
    if (lightboxIndex === null) return;
    closeButtonRef.current?.focus();
  }, [lightboxIndex]);

  if (photos.length === 0) return null;

  const activePhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <section className="mt-8" aria-label="Photo gallery">
      <h2 className="text-lg font-semibold text-gray-200 mb-4">Photos</h2>

      {/* Desktop: grid of thumbnails */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((photo, idx) => (
          <button
            key={photo.id}
            onClick={() => openLightbox(idx)}
            className="group relative flex flex-col rounded-lg overflow-hidden bg-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-left"
            aria-label={`View photo: ${photo.title || photo.originalName}`}
          >
            <div className="aspect-4/3 overflow-hidden relative w-full">
              <img
                src={photoUrl(photo.id)}
                alt={photo.title || photo.originalName}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            {(photo.title || photo.caption || photo.attribution) && (
              <div className="px-2 py-1.5 text-left">
                {photo.title && (
                  <p className="text-xs font-medium text-gray-200 truncate">
                    {photo.title}
                  </p>
                )}
                {photo.caption && (
                  <p className="text-xs text-gray-400 truncate">
                    {photo.caption}
                  </p>
                )}
                {photo.attribution && (
                  <p className="text-[10px] text-gray-500 truncate">
                    © {photo.attribution}
                  </p>
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Mobile: horizontal scroll carousel */}
      <div className="md:hidden overflow-x-auto snap-x snap-mandatory flex gap-3 pb-2 -mx-4 px-4">
        {photos.map((photo, idx) => (
          <button
            key={photo.id}
            onClick={() => openLightbox(idx)}
            className="snap-center shrink-0 w-[80vw] max-w-xs relative"
            aria-label={`View photo: ${photo.title || photo.originalName}`}
          >
            <div className="aspect-4/3 overflow-hidden rounded-lg bg-dark-800">
              <img
                src={photoUrl(photo.id)}
                alt={photo.title || photo.originalName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {(photo.title || photo.caption || photo.attribution) && (
              <div className="mt-1.5 text-left">
                {photo.title && (
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {photo.title}
                  </p>
                )}
                {photo.caption && (
                  <p className="text-xs text-gray-400 truncate">
                    {photo.caption}
                  </p>
                )}
                {photo.attribution && (
                  <p className="text-[10px] text-gray-500 truncate">
                    © {photo.attribution}
                  </p>
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo: ${activePhoto.title || activePhoto.originalName}`}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <span className="text-gray-400 text-sm">
              {lightboxIndex !== null ? lightboxIndex + 1 : 0} / {photos.length}
            </span>
            <button
              onClick={closeLightbox}
              ref={closeButtonRef}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Image + navigation */}
          <div className="flex-1 flex items-center justify-center relative min-h-0 px-12">
            {/* Prev */}
            {photos.length > 1 && (
              <button
                onClick={prev}
                className="absolute left-2 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
            )}

            {/* Image */}
            <div className="max-h-full max-w-full flex items-center justify-center">
              <img
                src={photoUrl(activePhoto.id)}
                alt={activePhoto.title || activePhoto.originalName}
                className="max-h-[calc(100vh-12rem)] max-w-full object-contain rounded-lg"
              />
            </div>

            {/* Next */}
            {photos.length > 1 && (
              <button
                onClick={next}
                className="absolute right-2 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            )}
          </div>

          {/* Caption area */}
          <div className="shrink-0 px-6 py-4 text-center space-y-1">
            {activePhoto.title && (
              <p className="text-white font-medium">{activePhoto.title}</p>
            )}
            {activePhoto.caption && (
              <p className="text-gray-300 text-sm">{activePhoto.caption}</p>
            )}
            {activePhoto.attribution && (
              <p className="text-gray-500 text-xs">
                &copy; {activePhoto.attribution}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
