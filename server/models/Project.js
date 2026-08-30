import mongoose from 'mongoose';
import slugify from 'slugify';

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
    },
    longDescription: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'Full Stack',
    },
    techStack: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    coverImage: {
      type: String,
      default: '',
    },
    liveUrl: {
      type: String,
      default: '',
    },
    repoUrl: {
      type: String,
      default: '',
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

// Auto-generate slug from title
projectSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + (this.isNew ? `-${Date.now().toString().slice(-4)}` : '');
  }
  next();
});

const Project = mongoose.model('Project', projectSchema);
export default Project;

