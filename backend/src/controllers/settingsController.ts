import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Settings } from '../models/Settings';

export const getSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    let settings = await Settings.findOne({ userId });
    if (!settings) {
      // Auto-create defaults if they don't exist
      settings = new Settings({ userId });
      await settings.save();
    }

    res.status(200).json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Error al obtener la configuración.' });
  }
};

export const updateSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const updates = req.body;

    const settings = await Settings.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true } // upsert just in case
    );

    res.status(200).json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Error al actualizar la configuración.' });
  }
};
