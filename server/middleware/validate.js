import { z } from 'zod';

export const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map((err) => ({
          field: err.path.join('.').replace(/^body\./, ''),
          message: err.message,
        })),
      });
    }
    return next(error);
  }
};

// Common Schemas
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email address is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const contactSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email address is required'),
    subject: z.string().optional(),
    message: z.string().min(5, 'Message must be at least 5 characters'),
  }),
});

export const projectSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Project title is required'),
    description: z.string().min(5, 'Short description is required'),
    longDescription: z.string().optional(),
    category: z.string().optional(),
    techStack: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    coverImage: z.string().optional(),
    liveUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    repoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    featured: z.boolean().optional(),
    order: z.number().optional(),
  }),
});

export const blogPostSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title is required'),
    excerpt: z.string().min(5, 'Excerpt is required'),
    content: z.string().min(10, 'Markdown content is required'),
    coverImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    published: z.boolean().optional(),
  }),
});

export const skillSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Skill name is required'),
    category: z.enum(['Frontend', 'Backend', 'Database', 'DevOps & Cloud', 'Languages', 'Tools & Workflow']),
    proficiency: z.number().min(1).max(100).optional(),
    yearsOfExperience: z.number().min(0).optional(),
    icon: z.string().optional(),
    featured: z.boolean().optional(),
    order: z.number().optional(),
  }),
});

export const gallerySchema = z.object({
  body: z
    .object({
      title: z.string().min(2, 'Image title is required'),
      image: z.string().optional().or(z.literal('')),
      images: z.array(z.string().min(3)).optional(),
      video: z.string().optional().or(z.literal('')),
      category: z.string().optional(),
      description: z.string().optional(),
      featured: z.boolean().optional(),
      order: z.number().optional(),
    })
    .refine((b) => (b.image && b.image.trim()) || (b.video && b.video.trim()), {
      message: 'At least one image or video is required',
      path: ['image'],
    }),
});

export const experienceSchema = z.object({
  body: z.object({
    type: z.enum(['work', 'education', 'certification', 'award']).optional(),
    title: z.string().min(2, 'Title/Role is required'),
    organization: z.string().min(2, 'Organization is required'),
    location: z.string().optional(),
    startDate: z.string().min(2, 'Start date is required'),
    endDate: z.string().optional(),
    current: z.boolean().optional(),
    description: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    techStack: z.array(z.string()).optional(),
    link: z.string().optional(),
    order: z.number().optional(),
  }),
});


