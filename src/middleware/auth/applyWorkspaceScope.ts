import { Request, Response, NextFunction } from 'express';

// Applies workspace scoping after auth. If x-owner-id is present, impersonate that user id for sandbox data reads.
export const applyWorkspaceScope = (req: Request, _res: Response, next: NextFunction) => {
  const headerOwner = req.headers['x-owner-id'] || req.headers['X-Owner-Id'];
  const headerTeam = req.headers['x-team-id'] || req.headers['X-Team-Id'];
  
  console.log('[applyWorkspaceScope] Headers received:', {
    path: req.path,
    method: req.method,
    'x-owner-id': req.headers['x-owner-id'],
    'X-Owner-Id': req.headers['X-Owner-Id'],
    'x-team-id': req.headers['x-team-id'],
    'X-Team-Id': req.headers['X-Team-Id'],
    allHeaders: Object.keys(req.headers).filter(h => h.toLowerCase().includes('owner') || h.toLowerCase().includes('team'))
  });
  
  if (headerOwner && typeof headerOwner === 'string') {
    console.log('[applyWorkspaceScope] Applying workspace scope:', {
      originalUserId: (req as any).user?._id,
      newUserId: headerOwner
    });
    (req as any).user = { _id: headerOwner };
  }
  next();
};

export default { applyWorkspaceScope };


