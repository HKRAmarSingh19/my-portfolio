import BlogPost from '../models/BlogPost.js';
import slugify from 'slugify';

export const getBlogPosts = async (req, res, next) => {
  try {
    const { tag, search, publishedOnly = 'true' } = req.query;
    let query = {};

    if (publishedOnly === 'true') {
      query.published = true;
    }

    if (tag) {
      query.tags = { $in: [new RegExp(tag, 'i')] };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const posts = await BlogPost.find(query).sort({ publishedAt: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

export const getBlogPost = async (req, res, next) => {
  try {
    const { slugOrId } = req.params;
    let post;

    if (slugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      post = await BlogPost.findById(slugOrId);
    }

    if (!post) {
      post = await BlogPost.findOne({ slug: slugOrId });
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found',
      });
    }

    post.views += 1;
    await post.save();

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

export const createBlogPost = async (req, res, next) => {
  try {
    const post = await BlogPost.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBlogPost = async (req, res, next) => {
  try {
    let post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found',
      });
    }

    if (req.body.title && req.body.title !== post.title) {
      req.body.slug = slugify(req.body.title, { lower: true, strict: true }) + `-${Date.now().toString().slice(-4)}`;
    }

    if (req.body.content) {
      const wordCount = req.body.content.trim().split(/\s+/).length;
      req.body.readingTime = Math.max(1, Math.ceil(wordCount / 200));
    }

    if (req.body.published === true && !post.published && !post.publishedAt) {
      req.body.publishedAt = new Date();
    }

    post = await BlogPost.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Blog post updated successfully',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBlogPost = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found',
      });
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Blog post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
