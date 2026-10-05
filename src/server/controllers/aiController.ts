import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { aiSecurityGuard } from '../services/aiSecurityGuard';
import { aiProviderService } from '../services/aiProvider';

export class AiController {
  async ask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: Authentication required' });
        return;
      }

      const { message } = req.body;

      // 1. Pre-LLM Security Guard Check (Prompt Injection, Secret Extraction, SQL, Cross-user)
      const securityCheck = aiSecurityGuard.inspectMessage(message);
      if (securityCheck.isBlocked) {
        res.status(200).json({
          answer: securityCheck.refusalMessage,
          dataUsed: {
            period: null,
            categories: [],
            transactionCount: 0,
            provider: 'security-guard',
          },
        });
        return;
      }

      // 2. Controlled context assembly & answer generation strictly scoped to req.user.id
      const result = await aiProviderService.processInquiry(req.user.id, message);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const aiController = new AiController();
