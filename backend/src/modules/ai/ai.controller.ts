import { Response, NextFunction } from 'express';
import { AIService } from './ai.service';
import { Organization } from '@modules/organizations/organization.model';

export class AIController {
  private service: AIService;

  constructor() {
    this.service = new AIService();
  }

  private async resolveOrgId(req: any): Promise<string> {
    if (req.user?.organizationId) return req.user.organizationId;
    if (req.user?.userId) {
      const org = await Organization.findOne({ owner: req.user.userId, isDeleted: false });
      if (org) return org._id.toString();
    }
    throw new Error('Falta información de organización.');
  }

  public getDailyBrief = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Falta información de autenticación.' });
        return;
      }
      const orgId = await this.resolveOrgId(req);
      const result = await this.service.getDailyBrief(orgId, userId);
      res.status(200).json({ brief: result });
    } catch (e) {
      next(e);
    }
  };

  public getInsights = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Falta información de autenticación.' });
        return;
      }
      const orgId = await this.resolveOrgId(req);
      const result = await this.service.getInsights(orgId, userId);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };

  public naturalLanguageSearch = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { query } = req.body;
      if (!userId) {
        res.status(401).json({ error: 'Falta información de autenticación.' });
        return;
      }
      if (!query || !query.trim()) {
        res.status(400).json({ error: 'La consulta no puede estar vacía.' });
        return;
      }
      const orgId = await this.resolveOrgId(req);
      const result = await this.service.naturalLanguageSearch(orgId, userId, query);
      res.status(200).json({ answer: result });
    } catch (e) {
      next(e);
    }
  };
}
export default AIController;
