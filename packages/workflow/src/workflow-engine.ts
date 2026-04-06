/**
 * @module workflow/workflow-engine
 * Orchestrates the provisioning workflow through its phases.
 *
 * Design:
 * - Engine runs phases sequentially (future: could be async/distributed)
 * - State is persisted after every phase transition
 * - Audit events are emitted at each transition
 * - Phase handlers are pure functions (no side effects on context directly, except request mutation)
 * - Failure at any phase routes to FailOrRecover
 *
 * Deferral: For Sprint 2+, replace with Step Functions or Temporal.
 * The PhaseContext contract is designed to survive that migration.
 *
 * Security: Phase handlers do not have access to raw credentials.
 * Adapters are injected and mediate all AWS access.
 */

import {
  TenantEnvironmentRequest,
  WorkflowPhase,
  RequestStatus,
  PhaseHistoryEntry,
} from '@caf/domain';
import { IAuditLogger } from '@caf/audit';
import { IOrganizationsAdapter, IBootstrapAdapter } from '@caf/adapters';
import { IRequestStore } from '@caf/persistence';
import { PhaseContext } from './phase-context';
import { PHASE_TRANSITIONS, PhaseTransition } from './state-machine';
import { runValidateRequest } from './phases/validate-request';
import { runEvaluatePolicy } from './phases/evaluate-policy';
import { runCreateMockAccount } from './phases/create-mock-account';
import { runRunMockBootstrap } from './phases/run-mock-bootstrap';
import { runVerifyBootstrap } from './phases/verify-bootstrap';
import { runRegisterAccount } from './phases/register-account';
import { runFailOrRecover } from './phases/fail-or-recover';

export interface WorkflowEngineConfig {
  orgsAdapter: IOrganizationsAdapter;
  bootstrapAdapter: IBootstrapAdapter;
  requestStore: IRequestStore;
  auditLogger: IAuditLogger;
}

export class WorkflowEngine {
  constructor(private readonly config: WorkflowEngineConfig) {}

  /**
   * Launches the workflow for a request.
   * Runs all phases sequentially, persisting state after each transition.
   * Returns the final request state.
   */
  async execute(request: TenantEnvironmentRequest): Promise<TenantEnvironmentRequest> {
    let currentPhase: WorkflowPhase = WorkflowPhase.ValidateRequest;
    let lastFailureReason = '';

    let ctx: PhaseContext = {
      request,
      orgsAdapter: this.config.orgsAdapter,
      bootstrapAdapter: this.config.bootstrapAdapter,
      auditLogger: this.config.auditLogger,
      vendingResult: null,
      bootstrapResult: null,
    };

    while (true) {
      const transition: PhaseTransition = PHASE_TRANSITIONS[currentPhase];

      // Enter phase
      ctx.request.currentPhase = currentPhase;
      ctx.request.status = transition.enterStatus;

      const historyEntry: PhaseHistoryEntry = {
        phase: currentPhase,
        enteredAt: new Date().toISOString(),
        exitedAt: null,
        outcome: 'IN_PROGRESS',
        detail: null,
      };
      ctx.request.phaseHistory.push(historyEntry);

      this.config.auditLogger.emit({
        eventType: 'PHASE_STARTED',
        requestId: ctx.request.id,
        actor: 'system',
        phase: currentPhase,
        status: ctx.request.status,
        detail: {},
      });

      await this.config.requestStore.save(ctx.request);

      // Execute phase
      let phaseResult;
      try {
        phaseResult = await this.runPhase(currentPhase, ctx, lastFailureReason);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        phaseResult = {
          success: false,
          detail: `Unexpected error in phase ${currentPhase}: ${message}`,
          updatedContext: ctx,
        };
      }

      // Update history entry
      const lastHistoryIdx = ctx.request.phaseHistory.length - 1;
      ctx.request.phaseHistory[lastHistoryIdx] = {
        ...historyEntry,
        exitedAt: new Date().toISOString(),
        outcome: phaseResult.success ? 'SUCCESS' : 'FAILURE',
        detail: phaseResult.detail,
      };

      ctx = phaseResult.updatedContext;
      lastFailureReason = phaseResult.detail;

      this.config.auditLogger.emit({
        eventType: phaseResult.success ? 'PHASE_COMPLETED' : 'PHASE_FAILED',
        requestId: ctx.request.id,
        actor: 'system',
        phase: currentPhase,
        status: ctx.request.status,
        detail: { detail: phaseResult.detail },
      });

      // Determine next phase
      if (phaseResult.success) {
        const nextPhase: WorkflowPhase | null = transition.onSuccess;
        if (nextPhase === null) {
          if (currentPhase === WorkflowPhase.FailOrRecover) {
            // FailOrRecover succeeded — terminal failure
            ctx.request.status = RequestStatus.FAILED;
            ctx.request.completedAt = new Date().toISOString();
            this.config.auditLogger.emit({
              eventType: 'REQUEST_FAILED',
              requestId: ctx.request.id,
              actor: 'system',
              phase: null,
              status: RequestStatus.FAILED,
              detail: { reason: ctx.request.failureReason },
            });
            await this.config.requestStore.save(ctx.request);
            break;
          }
          // Terminal success
          ctx.request.status = RequestStatus.COMPLETED;
          ctx.request.completedAt = new Date().toISOString();
          this.config.auditLogger.emit({
            eventType: 'REQUEST_COMPLETED',
            requestId: ctx.request.id,
            actor: 'system',
            phase: null,
            status: RequestStatus.COMPLETED,
            detail: { provisionedAccountId: ctx.request.provisionedAccountId },
          });
          await this.config.requestStore.save(ctx.request);
          break;
        }
        currentPhase = nextPhase;
      } else {
        if (currentPhase === WorkflowPhase.FailOrRecover) {
          // FailOrRecover itself failed — terminal
          ctx.request.status = RequestStatus.FAILED;
          ctx.request.completedAt = new Date().toISOString();
          this.config.auditLogger.emit({
            eventType: 'REQUEST_FAILED',
            requestId: ctx.request.id,
            actor: 'system',
            phase: null,
            status: RequestStatus.FAILED,
            detail: { reason: ctx.request.failureReason },
          });
          await this.config.requestStore.save(ctx.request);
          break;
        }
        currentPhase = WorkflowPhase.FailOrRecover;
      }
    }

    return ctx.request;
  }

  private async runPhase(
    phase: WorkflowPhase,
    ctx: PhaseContext,
    lastFailureReason: string,
  ) {
    switch (phase) {
      case WorkflowPhase.ValidateRequest:
        return runValidateRequest(ctx);
      case WorkflowPhase.EvaluatePolicy:
        return runEvaluatePolicy(ctx);
      case WorkflowPhase.CreateMockAccount:
        return runCreateMockAccount(ctx);
      case WorkflowPhase.RunMockBootstrap:
        return runRunMockBootstrap(ctx);
      case WorkflowPhase.VerifyBootstrap:
        return runVerifyBootstrap(ctx);
      case WorkflowPhase.RegisterAccount:
        return runRegisterAccount(ctx);
      case WorkflowPhase.FailOrRecover:
        return runFailOrRecover(ctx, lastFailureReason);
      default: {
        const _exhaustive: never = phase;
        throw new Error(`Unknown phase: ${_exhaustive}`);
      }
    }
  }
}
