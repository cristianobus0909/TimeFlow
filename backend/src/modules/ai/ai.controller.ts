import { Response, NextFunction } from 'express';
import { AIService } from './ai.service';

export class AIController {
  private service: AIService;

  constructor() {
    this.service = new AIService();
  }

  public getDailyBrief = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user.organization.toString();
      const userId = req.user._id.toString();
      const result = await this.service.getDailyBrief(orgId, userId);
      res.status(200).json({ brief: result });
    } catch (e) {
      next(e);
    }
  };

  public getInsights = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user.organization.toString();
      const userId = req.user._id.toString();
      const result = await this.service.getInsights(orgId, userId);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };

  public naturalLanguageSearch = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user.organization.toString();
      const userId = req.user._id.toString();
      const { query } = req.body;
      if (!query || !query.trim()) {
        res.status(400).json({ error: 'La consulta no puede estar vacía.' });
        return;
      }
      const result = await this.service.naturalLanguageSearch(orgId, userId, query);
      res.status(200).json({ answer: result });
    } catch (e) {
      next(e);
    }
  };
}
export default AIController;
