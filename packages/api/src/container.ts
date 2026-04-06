/**
 * @module api/container
 * Dependency injection container for the API server.
 * Wires together all layers for Sprint 1.
 *
 * Design: All dependencies are created here and injected into handlers.
 * This makes testing easy (override adapters with fakes) and keeps
 * handler code free of "new" calls.
 *
 * Future: Replace with a proper DI container or factory per environment.
 */

import { InMemoryAuditLogger } from '@caf/audit';
import { MockOrganizationsAdapter, MockBootstrapAdapter } from '@caf/adapters';
import { InMemoryRequestStore } from '@caf/persistence';
import { WorkflowEngine } from '@caf/workflow';

export function buildContainer() {
  const requestStore = new InMemoryRequestStore();
  const auditLogger = new InMemoryAuditLogger();
  const orgsAdapter = new MockOrganizationsAdapter({ latencyMs: 50 });
  const bootstrapAdapter = new MockBootstrapAdapter({ latencyMs: 50 });

  const workflowEngine = new WorkflowEngine({
    orgsAdapter,
    bootstrapAdapter,
    requestStore,
    auditLogger,
  });

  return {
    requestStore,
    auditLogger,
    workflowEngine,
  };
}

export type Container = ReturnType<typeof buildContainer>;
