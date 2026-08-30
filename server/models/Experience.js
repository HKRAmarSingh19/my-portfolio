import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['work', 'education', 'certification', 'award'],
      default: 'work',
    },
    title: {
      type: String,
      required: [true, 'Title / Role is required'],
      trim: true,
    },
    organization: {
      type: String,
      required: [true, 'Organization / Company / School is required'],
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    startDate: {
      type: String,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: String,
      default: 'Present',
    },
    current: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: '',
    },
    highlights: {
      type: [String],
      default: [],
    },
    techStack: {
      type: [String],
      default: [],
    },
    link: {
      type: String,
      default: '',
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

const Experience = mongoose.model('Experience', experienceSchema);
export default Experience;

