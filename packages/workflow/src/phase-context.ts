/**
 * @module workflow/phase-context
 * Context object passed to each phase handler.
 * Contains all dependencies needed to execute a phase.
 */

import { TenantEnvironmentRequest, AccountVendingResult, BootstrapResult } from '@caf/domain';
import { IAuditLogger } from '@caf/audit';
import { IOrganizationsAdapter } from '@caf/adapters';
import { IBootstrapAdapter } from '@caf/adapters';

export interface PhaseContext {
  request: TenantEnvironmentRequest;
  orgsAdapter: IOrganizationsAdapter;
  bootstrapAdapter: IBootstrapAdapter;
  auditLogger: IAuditLogger;
  /** Accumulated results from prior phases */
  vendingResult: AccountVendingResult | null;
  bootstrapResult: BootstrapResult | null;
}

export interface PhaseResult {
  success: boolean;
  detail: string;
  /** Updated context for next phase */
  updatedContext: PhaseContext;
}
