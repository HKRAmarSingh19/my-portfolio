import GalleryItem from '../models/GalleryItem.js';
import { deleteObjectsFromS3, deleteObjectsByPrefix, urlToKey } from '../config/s3.js';

export const getGalleryItems = async (req, res, next) => {
  try {
    const { category, featured, search } = req.query;
    let query = {};

    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (featured !== undefined) {
      query.featured = featured === 'true';
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await GalleryItem.find(query).sort({ createdAt: -1, order: 1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const getGalleryItem = async (req, res, next) => {
  try {
    const item = await GalleryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const createGalleryItem = async (req, res, next) => {
  try {
    const item = await GalleryItem.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Gallery item created successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const updateGalleryItem = async (req, res, next) => {
  try {
    let item = await GalleryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found',
      });
    }

    item = await GalleryItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Gallery item updated successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGalleryItem = async (req, res, next) => {
  try {
    const item = await GalleryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found',
      });
    }

    // Collect every S3 URL this item references (cover, extra images, video, and
    // the HLS manifest if one exists) and delete the underlying objects from the
    // bucket too, so removing an item doesn't leave orphaned media accumulating
    // in S3. This runs before the record is dropped so we still have the URLs if
    // deleteFromS3 fails.
    const mediaUrls = [item.image, ...(item.images || []), item.video, item.videoHls].filter(Boolean);
    // The HLS manifest is just a pointer; its segments live under the same
    // directory prefix (hls/<name>/...). Derive that prefix from the manifest
    // key and delete the whole set, not just the master playlist.
    const hlsPrefix = item.videoHls
      ? urlToKey(item.videoHls).replace(/[^/]+$/, '') // keep everything up to the last '/'
      : null;

    await item.deleteOne();

    if (mediaUrls.length || hlsPrefix) {
      try {
        if (mediaUrls.length) await deleteObjectsFromS3(mediaUrls);
        if (hlsPrefix) await deleteObjectsByPrefix(hlsPrefix);
      } catch (err) {
        // The record is already gone; the leftover S3 object is a (managed)
        // leak but must not fail the response the admin sees.
        console.error(`Failed to delete S3 objects for gallery item ${item._id}:`, err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Gallery item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
