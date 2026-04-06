/**
 * @module api/routes/requests
 * S1-07: POST /api/requests — submit a provisioning request
 * S1-08: GET /api/requests/:id — retrieve request status
 *        GET /api/requests — list all requests
 *
 * Security:
 * - All input validated via domain validators before any processing
 * - No stack traces in error responses
 * - Request IDs are opaque UUIDs (not guessable)
 * - CORS controlled via middleware (not per-route)
 */

import { Router, Request, Response } from 'express';
import {
  validateCreateRequestInput,
  createTenantEnvironmentRequest,
  makeRequestId,
} from '@caf/domain';
import { Container } from '../container';

export function buildRequestsRouter(container: Container): Router {
  const router = Router();

  /**
   * POST /api/requests
   * Submits a new tenant-environment provisioning request.
   * Launches the workflow asynchronously.
   */
  router.post('/', async (req: Request, res: Response) => {
    const errors = validateCreateRequestInput(req.body);
    if (errors.length > 0) {
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }

    const request = createTenantEnvironmentRequest(req.body);
    await container.requestStore.save(request);

    container.auditLogger.emit({
      eventType: 'REQUEST_SUBMITTED',
      requestId: request.id,
      actor: request.requestedBy,
      phase: null,
      status: request.status,
      detail: {
        tenantId: request.tenantId,
        environmentName: request.environmentName,
        environmentClass: request.environmentClass,
      },
    });

    // Launch workflow asynchronously (fire and forget for Sprint 1)
    // Future: Submit to durable queue / Step Functions
    setImmediate(() => {
      container.workflowEngine.execute(request).catch(err => {
        console.error(`[WorkflowEngine] Unhandled error for request ${request.id}:`, err);
      });
    });

    res.status(202).json({
      requestId: request.id,
      status: request.status,
      message: 'Request accepted. Workflow started.',
    });
  });

  /**
   * GET /api/requests/:id
   * Returns current status and phase history for a request.
   */
  router.get('/:id', async (req: Request, res: Response) => {
    const requestId = makeRequestId(req.params.id);
    const request = await container.requestStore.findById(requestId);

    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    res.json(toRequestDTO(request));
  });

  /**
   * GET /api/requests
   * Lists all requests (Sprint 1: no pagination).
   */
  router.get('/', async (_req: Request, res: Response) => {
    const requests = await container.requestStore.findAll();
    res.json({ requests: requests.map(toRequestDTO), count: requests.length });
  });

  return router;
}

/** Maps request entity to API response shape. Strips internal fields. */
function toRequestDTO(request: ReturnType<typeof createTenantEnvironmentRequest>) {
  return {
    id: request.id,
    tenantId: request.tenantId,
    tenantName: request.tenantName,
    environmentName: request.environmentName,
    environmentClass: request.environmentClass,
    requestedBy: request.requestedBy,
    status: request.status,
    currentPhase: request.currentPhase,
    provisionedAccountId: request.provisionedAccountId,
    failureReason: request.failureReason,
    createdAt: request.createdAt,
    completedAt: request.completedAt,
    phaseHistory: request.phaseHistory,
  };
}
