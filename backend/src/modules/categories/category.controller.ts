import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@core/middleware/auth.middleware';
import { Category } from '@modules/timer/category.model';
import { Types } from 'mongoose';

export const getCategories = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      res.status(200).json([]);
      return;
    }

    let categories = await Category.find({ organization: new Types.ObjectId(orgId), isDeleted: false }).sort({ name: 1 });

    if (categories.length === 0) {
      // Seed initial default categories for this organization
      const defaultNames = ['Desarrollo', 'Diseño', 'QA / Pruebas', 'Reunión', 'Planificación', 'Mantenimiento', 'Soporte', 'Gestión'];
      const defaultDocs = defaultNames.map((name) => ({
        name,
        organization: new Types.ObjectId(orgId),
        createdBy: new Types.ObjectId(req.user?.userId),
      }));

      categories = await Category.insertMany(defaultDocs) as any;
    }

    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    const userId = req.user?.userId;
    const { name, color, icon, description } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'El nombre de la categoría es obligatorio.' });
      return;
    }

    if (!orgId) {
      res.status(400).json({ error: 'Usuario no vinculado a ninguna organización.' });
      return;
    }

    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      organization: new Types.ObjectId(orgId),
      isDeleted: false,
    });

    if (existing) {
      res.status(200).json(existing);
      return;
    }

    const category = await Category.create({
      name: name.trim(),
      color: color || '#7C3AED',
      icon: icon || 'Bookmark',
      description,
      organization: new Types.ObjectId(orgId),
      createdBy: new Types.ObjectId(userId),
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};
