import { useState, useEffect } from "react";
import styles from "./PhotoCarousel.module.css";

/**
 * Photo carousel that cycles through random photos like a news reel
 * Auto-advances every 4 seconds
 */
export default function PhotoCarousel({ photos = [], photoDataUrls = new Map() }) {
  // Filter to only photos that have loaded URLs
  const availablePhotos = photos.filter(photo => {
    const url = photoDataUrls instanceof Map 
      ? photoDataUrls.get(photo?.id) 
      : photoDataUrls?.[photo?.id];
    return !!url;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlay || availablePhotos.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % availablePhotos.length);
    }, 4000); // 4 seconds per photo

    return () => clearInterval(timer);
  }, [isAutoPlay, availablePhotos.length]);

  if (availablePhotos.length === 0) {
    return (
      <div className={styles.carousel}>
        <div className={styles.emptyState}>
          <p>📸 Add photos to trips or memories to see them here</p>
        </div>
      </div>
    );
  }

  const currentPhoto = availablePhotos[currentIndex];
  const photoUrl = photoDataUrls instanceof Map 
    ? photoDataUrls.get(currentPhoto?.id) 
    : photoDataUrls?.[currentPhoto?.id];

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev - 1 + availablePhotos.length) % availablePhotos.length);
    setIsAutoPlay(false);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % availablePhotos.length);
    setIsAutoPlay(false);
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
    setIsAutoPlay(false);
  };

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      {/* Photo display */}
      <div className={styles.photoContainer}>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`Memory from ${currentPhoto.type === "trip" ? currentPhoto.tripName : currentPhoto.memoryTitle}`}
            className={styles.photo}
          />
        ) : (
          <div className={styles.photoPlaceholder}>
            ⚠️ Photo failed to load
          </div>
        )}

        {/* Photo label */}
        <div className={styles.photoLabel}>
          {currentPhoto.type === "trip" ? (
            <span>🗺️ {currentPhoto.tripName}</span>
          ) : (
            <span>💝 {currentPhoto.memoryTitle}</span>
          )}
        </div>
      </div>

      {/* Navigation controls */}
      <button
        className={styles.navButton}
        onClick={handlePrevious}
        aria-label="Previous photo"
      >
        ‹
      </button>

      <button
        className={styles.navButton}
        onClick={handleNext}
        aria-label="Next photo"
      >
        ›
      </button>

      {/* Carousel indicator */}
      <div className={styles.indicators}>
        <span className={styles.counter}>
          {currentIndex + 1} / {availablePhotos.length}
        </span>
        {availablePhotos.length > 5 && (
          <div className={styles.dots}>
            {availablePhotos.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                className={`${styles.dot} ${idx === currentIndex % 5 ? styles.dotActive : ""}`}
                onClick={() => handleDotClick(idx)}
                aria-label={`Go to photo ${idx + 1}`}
              />
            ))}
            {availablePhotos.length > 5 && <span className={styles.dotsMore}>+{availablePhotos.length - 5}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
