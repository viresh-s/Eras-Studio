/**
 * ERAS Asset Protection — Anti-Download Shield
 * ==============================================
 * Prevents casual downloading/saving of artwork images via:
 *   - Right-click context menu suppression
 *   - Drag-and-drop prevention
 *   - Transparent overlay shield (blocks direct image interaction)
 *   - CSS pointer-events control
 *
 * This provides practical deterrence against casual copying.
 * It is NOT DRM — determined users can always screenshot.
 */

'use client';

import { useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// CSS class names used by the protection system
// ---------------------------------------------------------------------------

/** Apply to any container to block right-click and drag on its images */
export const PROTECTED_CONTAINER_CLASS = 'eras-protected-artwork';

/** Apply to the image element itself */
export const PROTECTED_IMAGE_CLASS = 'eras-no-save-img';

// ---------------------------------------------------------------------------
// Hook: useAssetProtection
// ---------------------------------------------------------------------------

/**
 * React hook that attaches anti-download event listeners to a container ref.
 * Call this in any component that renders artwork images.
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * useAssetProtection(containerRef);
 *
 * return (
 *   <div ref={containerRef} className={PROTECTED_CONTAINER_CLASS}>
 *     <img src={artworkUrl} className={PROTECTED_IMAGE_CLASS} />
 *   </div>
 * );
 * ```
 */
export function useAssetProtection(
  containerRef: React.RefObject<HTMLElement | null>
): void {
  const handleContextMenu = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    // Only block right-click on images within protected containers
    if (
      target.tagName === 'IMG' ||
      target.closest(`.${PROTECTED_CONTAINER_CLASS}`)
    ) {
      e.preventDefault();
    }
  }, []);

  const handleDragStart = useCallback((e: DragEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'IMG' ||
      target.closest(`.${PROTECTED_CONTAINER_CLASS}`)
    ) {
      e.preventDefault();
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('contextmenu', handleContextMenu);
    container.addEventListener('dragstart', handleDragStart);

    return () => {
      container.removeEventListener('contextmenu', handleContextMenu);
      container.removeEventListener('dragstart', handleDragStart);
    };
  }, [containerRef, handleContextMenu, handleDragStart]);
}

// ---------------------------------------------------------------------------
// Component Props Helper
// ---------------------------------------------------------------------------

/**
 * Returns HTML attributes to apply to an <img> element for protection.
 * These attributes prevent default browser save behaviors.
 */
export function getProtectedImageProps(): React.ImgHTMLAttributes<HTMLImageElement> {
  return {
    draggable: false,
    onContextMenu: (e) => e.preventDefault(),
    onDragStart: (e) => e.preventDefault(),
    className: PROTECTED_IMAGE_CLASS,
    style: {
      userSelect: 'none' as const,
      WebkitUserSelect: 'none' as const,
      WebkitTouchCallout: 'none' as const,
      pointerEvents: 'none' as const,
    },
  };
}

// ---------------------------------------------------------------------------
// Inline CSS (inject once)
// ---------------------------------------------------------------------------

/**
 * Global CSS rules for asset protection.
 * Import and include this in your global CSS or inject via <style>.
 */
export const ASSET_PROTECTION_CSS = `
/* ERAS Asset Protection — prevent image saving */
.${PROTECTED_CONTAINER_CLASS} {
  position: relative;
}

.${PROTECTED_CONTAINER_CLASS}::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: auto;
  background: transparent;
}

.${PROTECTED_IMAGE_CLASS} {
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  pointer-events: none;
  -webkit-user-drag: none;
}
`;
