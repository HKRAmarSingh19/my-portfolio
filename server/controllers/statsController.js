import Project from '../models/Project.js';
import BlogPost from '../models/BlogPost.js';
import Skill from '../models/Skill.js';
import Message from '../models/Message.js';
import Experience from '../models/Experience.js';
import GalleryItem from '../models/GalleryItem.js';

export const getStats = async (req, res, next) => {
  try {
    const [
      projectCount,
      featuredProjectCount,
      blogCount,
      publishedBlogCount,
      skillCount,
      messageCount,
      unreadMessageCount,
      experienceCount,
      galleryItemCount,
      recentMessages,
      recentProjects,
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ featured: true }),
      BlogPost.countDocuments(),
      BlogPost.countDocuments({ published: true }),
      Skill.countDocuments(),
      Message.countDocuments(),
      Message.countDocuments({ read: false }),
      Experience.countDocuments(),
      GalleryItem.countDocuments(),
      Message.find().sort({ createdAt: -1 }).limit(5),
      Project.find().sort({ createdAt: -1 }).limit(4),
    ]);

    res.status(200).json({
      success: true,
      data: {
        projects: {
          total: projectCount,
          featured: featuredProjectCount,
        },
        blog: {
          total: blogCount,
          published: publishedBlogCount,
        },
        skills: {
          total: skillCount,
        },
        messages: {
          total: messageCount,
          unread: unreadMessageCount,
        },
        experiences: {
          total: experienceCount,
        },
        gallery: {
          total: galleryItemCount,
        },
        recentMessages,
        recentProjects,
      },
    });
  } catch (error) {
    next(error);
  }
};
