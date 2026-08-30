import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Frontend', 'Backend', 'Database', 'DevOps & Cloud', 'Languages', 'Tools & Workflow'],
      default: 'Frontend',
    },
    proficiency: {
      type: Number,
      min: 1,
      max: 100,
      default: 85,
    },
    yearsOfExperience: {
      type: Number,
      default: 2,
    },
    icon: {
      type: String,
      default: '',
    },
    featured: {
      type: Boolean,
      default: true,
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

const Skill = mongoose.model('Skill', skillSchema);
export default Skill;

