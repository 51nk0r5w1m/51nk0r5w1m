/**
 * @module workflow/state-machine
 * Defines the Sprint 1 state machine: phases and valid transitions.
 *
 * Design:
 * - State machine is declarative — transitions are data, not code
 * - WorkflowEngine reads from this table
 * - Adding a new phase = adding a row here + implementing the handler
 * - No circular transitions are allowed
 *
 * Future: This will be backed by Step Functions or a durable workflow engine.
 */

import { WorkflowPhase, RequestStatus } from '@caf/domain';

export interface PhaseTransition {
  /** Status to set when this phase begins */
  enterStatus: RequestStatus;
  /** Next phase on success */
  onSuccess: WorkflowPhase | null;
  /** Phase to run on failure (null = terminal failure) */
  onFailure: WorkflowPhase | null;
}

/**
 * Phase transition table.
 * Read as: "When entering phase X, set status to enterStatus.
 * On success, go to onSuccess. On failure, go to onFailure."
 */
export const PHASE_TRANSITIONS: Record<WorkflowPhase, PhaseTransition> = {
  [WorkflowPhase.ValidateRequest]: {
    enterStatus: RequestStatus.VALIDATING,
    onSuccess: WorkflowPhase.EvaluatePolicy,
    onFailure: WorkflowPhase.FailOrRecover,
  },
  [WorkflowPhase.EvaluatePolicy]: {
    enterStatus: RequestStatus.EVALUATING_POLICY,
    onSuccess: WorkflowPhase.CreateMockAccount,
    onFailure: WorkflowPhase.FailOrRecover,
  },
  [WorkflowPhase.CreateMockAccount]: {
    enterStatus: RequestStatus.CREATING_ACCOUNT,
    onSuccess: WorkflowPhase.RunMockBootstrap,
    onFailure: WorkflowPhase.FailOrRecover,
  },
  [WorkflowPhase.RunMockBootstrap]: {
    enterStatus: RequestStatus.BOOTSTRAPPING,
    onSuccess: WorkflowPhase.VerifyBootstrap,
    onFailure: WorkflowPhase.FailOrRecover,
  },
  [WorkflowPhase.VerifyBootstrap]: {
    enterStatus: RequestStatus.VERIFYING,
    onSuccess: WorkflowPhase.RegisterAccount,
    onFailure: WorkflowPhase.FailOrRecover,
  },
  [WorkflowPhase.RegisterAccount]: {
    enterStatus: RequestStatus.REGISTERING,
    onSuccess: null, // terminal success
    onFailure: WorkflowPhase.FailOrRecover,
  },
  [WorkflowPhase.FailOrRecover]: {
    enterStatus: RequestStatus.FAILED,
    onSuccess: null, // terminal
    onFailure: null, // terminal
  },
};
