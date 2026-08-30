import mongoose from 'mongoose';

// A gallery item must have at least one piece of media, but not necessarily a
// photo — a video-only item is allowed (`image` left blank). `image` is
// therefore optional and doubles as the poster for the video.
const galleryItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    // Full ordered list of this item's images (index 0 = the `image` main/first).
    // Absent on older single-image docs; the frontend falls back to `[image]`.
    images: {
      type: [String],
      default: undefined,
    },
    // Optional single video mixed into this item's collection (shows after the
    // photos). Empty string = no video.
    video: {
      type: String,
      default: '',
      trim: true,
    },
    // Master HLS playlist (.m3u8) for adaptive playback of `video`. Empty
    // string = fall back to the progressive MP4 (old items, or when MediaConvert
    // isn't configured). Populated asynchronously once the transcode job
    // completes; stays '' on old items / when transcoding is disabled.
    videoHls: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: 'Personal',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce "at least one media" at the schema level: an item must have either an
// image or a video. Fails with a clear message on create/update when both are
// blank.
galleryItemSchema.pre('validate', function (next) {
  const hasImage = !!(this.image && String(this.image).trim());
  const hasVideo = !!(this.video && String(this.video).trim());
  if (!hasImage && !hasVideo) {
    this.invalidate('image', 'At least one image or video is required');
  }
  next();
});

const GalleryItem = mongoose.model('GalleryItem', galleryItemSchema);
export default GalleryItem;