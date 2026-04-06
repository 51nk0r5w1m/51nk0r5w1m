/**
 * @module domain/types
 * Core domain types for the Custom Account Factory.
 *
 * These types form the contract boundary between all layers.
 * They must not import from adapters, persistence, or API packages.
 */

/** Opaque string brand for type safety */
export type RequestId = string & { readonly __brand: 'RequestId' };
export type TenantId = string & { readonly __brand: 'TenantId' };
export type AccountId = string & { readonly __brand: 'AccountId' };

export function makeRequestId(id: string): RequestId {
  return id as RequestId;
}
export function makeTenantId(id: string): TenantId {
  return id as TenantId;
}
export function makeAccountId(id: string): AccountId {
  return id as AccountId;
}

/**
 * Environment class influences policy, runner selection, and approval gates.
 * PROD requires explicit approval; DEV is auto-approved in Sprint 1 mocks.
 */
export enum EnvironmentClass {
  DEV = 'DEV',
  STAGING = 'STAGING',
  PROD = 'PROD',
}

/**
 * Lifecycle status of a provisioning request.
 * Transitions are one-directional. FAILED and COMPLETED are terminal.
 */
export enum RequestStatus {
  PENDING = 'PENDING',
  VALIDATING = 'VALIDATING',
  EVALUATING_POLICY = 'EVALUATING_POLICY',
  CREATING_ACCOUNT = 'CREATING_ACCOUNT',
  BOOTSTRAPPING = 'BOOTSTRAPPING',
  VERIFYING = 'VERIFYING',
  REGISTERING = 'REGISTERING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Workflow phases map 1:1 to state machine steps.
 * Each phase is implemented by a WorkflowPhaseHandler.
 */
export enum WorkflowPhase {
  ValidateRequest = 'ValidateRequest',
  EvaluatePolicy = 'EvaluatePolicy',
  CreateMockAccount = 'CreateMockAccount',
  RunMockBootstrap = 'RunMockBootstrap',
  VerifyBootstrap = 'VerifyBootstrap',
  RegisterAccount = 'RegisterAccount',
  FailOrRecover = 'FailOrRecover',
}

/** The main provisioning entity. Immutable after creation except via workflow transitions. */
export interface TenantEnvironmentRequest {
  readonly id: RequestId;
  readonly tenantId: TenantId;
  readonly tenantName: string;
  readonly environmentName: string;
  readonly environmentClass: EnvironmentClass;
  readonly requestedBy: string;
  readonly createdAt: string; // ISO 8601
  status: RequestStatus;
  currentPhase: WorkflowPhase | null;
  provisionedAccountId: AccountId | null;
  failureReason: string | null;
  completedAt: string | null;
  /** Ordered log of phase transitions for auditability */
  phaseHistory: PhaseHistoryEntry[];
}

export interface PhaseHistoryEntry {
  phase: WorkflowPhase;
  enteredAt: string;
  exitedAt: string | null;
  outcome: 'SUCCESS' | 'FAILURE' | 'IN_PROGRESS';
  detail: string | null;
}

/** Output from the Organizations account-vending adapter */
export interface AccountVendingResult {
  accountId: AccountId;
  accountEmail: string;
  accountName: string;
  ouPath: string;
  vendedAt: string;
}

/** Output from the bootstrap adapter */
export interface BootstrapResult {
  accountId: AccountId;
  baselineRoleArn: string;
  baselineBucketArn: string;
  bootstrappedAt: string;
}

/** Input for request submission */
export interface CreateRequestInput {
  tenantId: string;
  tenantName: string;
  environmentName: string;
  environmentClass: EnvironmentClass;
  requestedBy: string;
}

/** Validation error detail */
export interface ValidationError {
  field: string;
  message: string;
}
