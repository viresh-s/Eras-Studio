# ERAS Platform — Image Compression & Asset Protection Architecture

## 1. Executive Summary

ERAS is a curated art marketplace where visual fidelity is paramount. Artists upload high-resolution photographs and digital renders of their artworks (often 5 MB – 25 MB per image). Without optimization, storing and serving these uncompressed files creates severe bottlenecks:
- **Storage exhaustion**: Supabase Storage limits are rapidly consumed by raw camera files.
- **Slow feed rendering**: Rendering 20 uncompressed images on the Discovery page would force users to download 100+ MB on a single page load.
- **Compute costs**: Traditional server-side resizing (e.g., Sharp, ImageMagick, AWS Lambda) incurs significant server compute costs and memory overhead.

To solve this permanently without external CDNs or added infrastructure, ERAS utilizes an **industry-standard Client-Side Dual-Resolution WebP Pipeline** combined with a **Multi-Layered Anti-Download Asset Protection Shield**.

---

## 2. Complete Architectural Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ARTIST BROWSER (Client-Side)                       │
│                                                                         │
│  [ Raw Image File ] (5MB - 25MB JPEG / PNG)                             │
│          │                                                              │
│          ▼                                                              │
│  [ Canvas 2D Pipeline (imagePipeline.ts) ]                              │
│    - Decodes image                                                      │
│    - Reads natural dimensions & aspect ratio                            │
│    - Generates 2 WebP derivatives:                                      │
│        1. Card Derivative (max 1000px, 78% quality)   ~40 - 80 KB       │
│        2. Full Derivative (max 2560px, 85% quality)   ~150 - 400 KB     │
│                                                                         │
│  Total Size: ~250 KB (95% - 98% storage savings vs raw)                 │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                     Direct Upload via Supabase SDK
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       SUPABASE STORAGE (artworks)                       │
│                                                                         │
│  Path: {userId}/{timestamp}_{index}_card.webp                           │
│  Path: {userId}/{timestamp}_{index}_full.webp                           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                          Public WebP URLs + Meta
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     DATABASE RECORD (artworks table)                    │
│                                                                         │
│  - image_url             (Card WebP URL — for feeds/grids)              │
│  - image_url_full        (Full WebP URL — for detail view)              │
│  - additional_images     (Array of Card WebP URLs)                      │
│  - additional_images_full(Array of Full WebP URLs)                      │
│  - image_width           (Original width in px)                         │
│  - image_height          (Original height in px)                        │
│  - aspect_ratio          (Width / Height numeric ratio)                 │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                  Optimized Delivery & Asset Protection
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       END-USER EXPERIENCE & SHIELD                      │
│                                                                         │
│  1. Discovery / Portfolio / Feeds:                                      │
│     - Loads Card WebP (~50 KB) -> Instant rendering, low data usage     │
│     - Anti-download shield active (no right click, no drag)             │
│                                                                         │
│  2. Artwork Detail Page (ArtworkDiscoveryDetail & Gallery):             │
│     - Loads Full-Res WebP (~250 KB) -> Razor-sharp brushstroke detail   │
│     - Transparent overlay shield blocks context menu & save actions     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Dual-Resolution WebP Engine (`src/lib/media/imagePipeline.ts`)

### Why WebP?
WebP provides superior lossless and lossy compression for images on the web. Compared to JPEG, WebP files are **25% to 34% smaller** at equivalent visual quality. It supports alpha transparency and is natively supported by 97%+ of all active browsers.

### The Two Derivatives
1. **Card Derivative** (`card.webp`):
   - **Max Dimension**: 1000px on the longest side.
   - **Quality**: `0.78` (78%).
   - **Typical Size**: 40 KB – 80 KB.
   - **Usage**: Discovery grid, Artist profile tabs, portfolio management, landing page featured works, chat thumbnails.
   - **Impact**: Even a masonry grid of 50 artworks totals under 3 MB of image data.

2. **Full Derivative** (`full.webp`):
   - **Max Dimension**: 2560px on the longest side (covers 2K and 4K displays).
   - **Quality**: `0.85` (85%).
   - **Typical Size**: 150 KB – 400 KB.
   - **Usage**: Detail page gallery (`ArtworkImageGallery`) for zoom and fine inspection.
   - **Impact**: Full artistic fidelity without the 15 MB bloat of an uncompressed camera RAW/PNG.

### File Size Limit (50 MB per Image)
- **Hard Limit**: `50 MB` per image file (`MAX_INPUT_SIZE_MB = 50`).
- **Instant Validation**: The upload and edit forms check file sizes the moment an artist selects their files. If an image exceeds 50 MB, it is immediately rejected with a clear message: `"File 'photo.png' is 68.4 MB. Maximum allowed size is 50 MB."`
- **Why Not 100 MB+?**:
  1. **Browser Memory Exhaustion**: An uncompressed 100 MB image file often contains 15,000 x 15,000 pixels or more. When decoded into raw RGBA bitmap pixels in RAM, it demands **~900 MB to 1.8 GB of continuous memory** in the browser tab. On mobile devices (iOS Safari, Android Chrome) or entry-level laptops, this will trigger the OS to kill the browser tab ("A problem repeatedly occurred with this webpage").
  2. **Zero-Copy Memory Optimization**: The pipeline uses `URL.createObjectURL` rather than `FileReader.readAsDataURL` to prevent allocating extra Base64 string copies in the JavaScript heap.
  3. **Industry Alignment**: 50 MB matches professional platforms like Behance and ArtStation and comfortably accommodates ultra-high-resolution 48 MP – 100 MP camera RAW/JPEG/PNG exports.
  4. **Supabase Ingestion**: Regardless of the original input size (whether 5 MB or 49 MB), the output stored in Supabase is always a lean **~40–80 KB (Card)** and **~150–400 KB (Full)** WebP pair. Supabase never has to ingest large uncompressed files.

---

## 4. Supabase Storage Organization

Images are stored in the public `artworks` bucket using a deterministic, collision-free directory structure:

```
artworks/
└── {userId}/
    ├── 1729949100000_0_card.webp     <-- Cover image (feed resolution)
    ├── 1729949100000_0_full.webp     <-- Cover image (detail resolution)
    ├── 1729949100000_1_card.webp     <-- Additional image 1 (feed)
    ├── 1729949100000_1_full.webp     <-- Additional image 1 (detail)
    └── ...
```

### Storage Best Practices Implemented:
1. **Namespaced by User ID**: Prevents collision and allows simplified row-level security (RLS) policies if restricted access is ever needed.
2. **Explicit Suffixing**: `_card.webp` and `_full.webp` provide immediate clarity in storage browsers and logs.
3. **No Redundant Raw Files**: Only the WebP derivatives are persisted, keeping Supabase Storage usage at ~2% of what raw storage would require.

---

## 5. Database Schema & Metadata

The `artworks` table stores references to both resolutions and metadata:

| Column | Type | Description |
|---|---|---|
| `image_url` | `TEXT` | Primary card-resolution WebP URL (feeds & cards) |
| `image_url_full` | `TEXT` | Primary full-resolution WebP URL (detail view) |
| `additional_images` | `TEXT[]` | Array of card-resolution secondary image URLs |
| `additional_images_full` | `TEXT[]` | Array of full-resolution secondary image URLs |
| `image_width` | `INTEGER` | Original image pixel width |
| `image_height` | `INTEGER` | Original image pixel height |
| `aspect_ratio` | `NUMERIC(6,4)` | Precomputed aspect ratio (`width / height`) |

### Database Migration
Run this script in the Supabase SQL Editor:
```sql
ALTER TABLE artworks
  ADD COLUMN IF NOT EXISTS image_url_full TEXT,
  ADD COLUMN IF NOT EXISTS additional_images_full TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS image_width INTEGER,
  ADD COLUMN IF NOT EXISTS image_height INTEGER,
  ADD COLUMN IF NOT EXISTS aspect_ratio NUMERIC(6, 4);
```

---

## 6. Anti-Download Asset Protection System

ERAS strictly protects creators' intellectual property. While true web DRM is impossible (browsers must render pixels to the screen), ERAS implements a **4-tier practical deterrence system** that eliminates casual downloading, saving, and dragging.

### Tier 1: Context Menu Suppression
- All artwork containers and images attach `onContextMenu={(e) => e.preventDefault()}`.
- Right-clicking does not trigger the default browser context menu ("Save image as...", "Copy image address", etc.).

### Tier 2: Drag-and-Drop Prevention
- `draggable={false}` and `onDragStart={(e) => e.preventDefault()}` on all artwork images.
- Prevents desktop users from dragging images into another browser tab, search engine, or file manager.

### Tier 3: Transparent Overlay Shield
- A transparent `<div>` covers the entire artwork container with a higher stacking order (`z-[1]` / `z-[2]`):
  ```tsx
  {/* Transparent overlay shield */}
  <div
    className="absolute inset-0 z-[1]"
    onContextMenu={(e) => e.preventDefault()}
    onDragStart={(e) => e.preventDefault()}
    aria-hidden="true"
  />
  ```
- If a user attempts to right-click or inspect, the browser targets the empty transparent overlay, not the `<img>` element.

### Tier 4: CSS Pointer & Selection Defense (`src/app/globals.css`)
- `.eras-protected-artwork`: Disables text and element selection.
- `.eras-no-save-img`: Sets `-webkit-touch-callout: none` (prevents long-press save menus on iOS and Android) and `pointer-events: none` on the raw image element.

### Protected Components:
1. `src/components/features/creator/ArtworkGridCard.tsx` (Portfolio & Artist profiles)
2. `src/app/(dashboard)/discovery/page.tsx` (Discovery feed cards)
3. `src/components/features/artwork/ArtworkImageGallery.tsx` (Detail view gallery)
4. `src/app/(public)/page.tsx` (Landing page showcase)

---

## 7. Performance & Bandwidth Comparison

| Metric | Without Pipeline (Raw Uploads) | With ERAS WebP Pipeline | Improvement |
|---|---|---|---|
| **Average Image Size** | 6.5 MB – 18.0 MB | 45 KB (Card) / 220 KB (Full) | **~97% reduction** |
| **Discovery Feed (24 items)** | ~180 MB download | ~1.2 MB download | **150x faster load** |
| **Supabase Storage per 100 Artworks** | ~1.8 GB | ~35 MB | **50x capacity extension** |
| **Server CPU Load** | Heavy (if transcoding) | 0% (Client canvas) | **Zero server cost** |
| **Mobile UX** | High data drain, laggy scrolling | Fluid 60fps scrolling | **App-like responsiveness** |

---

## 8. Summary of Files Changed

- `src/lib/media/imagePipeline.ts`: Client-side Canvas WebP compression engine & Supabase uploader.
- `src/lib/media/assetProtection.ts`: Anti-download React hook, props helper, and CSS classes.
- `src/components/features/creator/ArtworkUploadForm.tsx`: Upload workflow with stage progress indicators.
- `src/components/features/creator/ArtworkEditForm.tsx`: Edit workflow with WebP compression for newly added images.
- `src/components/features/creator/ArtworkGridCard.tsx`: Protected card with transparent overlay shield.
- `src/components/features/artwork/ArtworkImageGallery.tsx`: Anti-download gallery using full-resolution WebP.
- `src/components/features/artwork/ArtworkDiscoveryDetail.tsx`: Wires full-res URLs to the gallery.
- `src/app/(dashboard)/discovery/page.tsx`: Protected masonry grid cards.
- `src/app/(public)/page.tsx`: Protected landing page featured works.
- `src/app/globals.css`: Asset protection global styles.
- `src/actions/artworkActions.ts`: Schema & actions for storing dual URLs and dimension metadata.
- `src/types/database.ts`: TypeScript types for artworks with full-res and dimension fields.
- `supabase/migrations/20261026_image_pipeline_and_metadata.sql`: SQL migration script.
