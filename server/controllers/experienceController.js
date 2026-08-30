import Experience from '../models/Experience.js';

export const getExperiences = async (req, res, next) => {
  try {
    const { type } = req.query;
    let query = {};

    if (type) {
      query.type = type;
    }

    const items = await Experience.find(query).sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const createExperience = async (req, res, next) => {
  try {
    const item = await Experience.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Experience entry added successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const updateExperience = async (req, res, next) => {
  try {
    const item = await Experience.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Experience entry not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Experience updated successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteExperience = async (req, res, next) => {
  try {
    const item = await Experience.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Experience entry not found',
      });
    }

    await item.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Experience entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
