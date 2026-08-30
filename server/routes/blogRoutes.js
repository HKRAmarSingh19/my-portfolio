import express from 'express';
import {
  getBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '../controllers/blogController.js';
import { protect } from '../middleware/auth.js';
import { validate, blogPostSchema } from '../middleware/validate.js';

const router = express.Router();

router.route('/')
  .get(getBlogPosts)
  .post(protect, validate(blogPostSchema), createBlogPost);

router.route('/:slugOrId')
  .get(getBlogPost);

router.route('/:id')
  .put(protect, validate(blogPostSchema), updateBlogPost)
  .delete(protect, deleteBlogPost);

export default router;

