import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@core/middleware/auth.middleware';
import { Client } from '@modules/clients/client.model';
import { Project } from '@modules/projects/project.model';
import { Task } from '@modules/tasks/task.model';
import { Comment } from '@modules/comments/comment.model';
import { Types } from 'mongoose';
import { AuthorizationError } from '@core/errors/classes';

export class SearchController {
  /**
   * Performs unified regex text search across Clients, Projects, Tasks, and Comments
   */
  public search = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }
      const orgObjectId = new Types.ObjectId(orgId);

      const query = req.query.q as string;
      if (!query || query.trim() === '') {
        res.status(200).json({ clients: [], projects: [], tasks: [], comments: [] });
        return;
      }

      const regex = new RegExp(query, 'i');

      const [clients, projects, tasks, comments] = await Promise.all([
        Client.find({ organization: orgObjectId, name: regex, isDeleted: { $ne: true } }).limit(5),
        Project.find({ organization: orgObjectId, name: regex, isDeleted: { $ne: true } }).limit(5),
        Task.find({ organization: orgObjectId, title: regex, isDeleted: { $ne: true } }).limit(10),
        Comment.find({ organization: orgObjectId, content: regex, isDeleted: { $ne: true } })
          .populate('user', 'name')
          .limit(5),
      ]);

      res.status(200).json({
        clients,
        projects,
        tasks,
        comments,
      });
    } catch (error) {
      next(error);
    }
  };
}
export default SearchController;
