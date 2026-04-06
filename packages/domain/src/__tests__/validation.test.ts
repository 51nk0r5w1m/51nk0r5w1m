import { validateCreateRequestInput } from '../validation';
import { EnvironmentClass } from '../types';

const validInput = {
  tenantId: 'acme-corp',
  tenantName: 'ACME Corporation',
  environmentName: 'production',
  environmentClass: EnvironmentClass.PROD,
  requestedBy: 'alice@acme.com',
};

describe('validateCreateRequestInput', () => {
  it('passes with valid input', () => {
    expect(validateCreateRequestInput(validInput)).toEqual([]);
  });

  it('rejects non-object input', () => {
    const errors = validateCreateRequestInput('not an object');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBe('body');
  });

  it('rejects missing tenantId', () => {
    const errors = validateCreateRequestInput({ ...validInput, tenantId: undefined });
    expect(errors.some(e => e.field === 'tenantId')).toBe(true);
  });

  it('rejects tenantId with injection characters', () => {
    const errors = validateCreateRequestInput({ ...validInput, tenantId: 'acme; DROP TABLE' });
    expect(errors.some(e => e.field === 'tenantId')).toBe(true);
  });

  it('rejects invalid environmentClass', () => {
    const errors = validateCreateRequestInput({ ...validInput, environmentClass: 'INVALID' });
    expect(errors.some(e => e.field === 'environmentClass')).toBe(true);
  });

  it('rejects non-email requestedBy', () => {
    const errors = validateCreateRequestInput({ ...validInput, requestedBy: 'not-an-email' });
    expect(errors.some(e => e.field === 'requestedBy')).toBe(true);
  });

  it('rejects tenantId that is too long', () => {
    const errors = validateCreateRequestInput({ ...validInput, tenantId: 'a'.repeat(65) });
    expect(errors.some(e => e.field === 'tenantId')).toBe(true);
  });
});
