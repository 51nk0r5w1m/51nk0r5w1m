import React, { useState } from 'react';

const API_BASE = '/api';

interface RequestDTO {
  id: string;
  tenantId: string;
  tenantName: string;
  environmentName: string;
  environmentClass: string;
  status: string;
  currentPhase: string | null;
  provisionedAccountId: string | null;
  failureReason: string | null;
  createdAt: string;
  completedAt: string | null;
}

function App() {
  const [form, setForm] = useState({
    tenantId: '',
    tenantName: '',
    environmentName: '',
    environmentClass: 'DEV',
    requestedBy: '',
  });
  const [requests, setRequests] = useState<RequestDTO[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Submission failed');
      } else {
        await loadRequests();
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const loadRequests = async () => {
    const res = await fetch(`${API_BASE}/requests`);
    const data = await res.json();
    setRequests(data.requests ?? []);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
      <h1>Custom Account Factory — Sprint 1</h1>

      <section>
        <h2>Submit Provisioning Request</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
          <input placeholder="Tenant ID" value={form.tenantId} onChange={e => setForm(f => ({ ...f, tenantId: e.target.value }))} required />
          <input placeholder="Tenant Name" value={form.tenantName} onChange={e => setForm(f => ({ ...f, tenantName: e.target.value }))} required />
          <input placeholder="Environment Name" value={form.environmentName} onChange={e => setForm(f => ({ ...f, environmentName: e.target.value }))} required />
          <select value={form.environmentClass} onChange={e => setForm(f => ({ ...f, environmentClass: e.target.value }))}>
            <option value="DEV">DEV</option>
            <option value="STAGING">STAGING</option>
            <option value="PROD">PROD</option>
          </select>
          <input type="email" placeholder="Requested By (email)" value={form.requestedBy} onChange={e => setForm(f => ({ ...f, requestedBy: e.target.value }))} required />
          <button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Requests <button onClick={loadRequests} style={{ fontSize: 12, marginLeft: 8 }}>Refresh</button></h2>
        {requests.length === 0 ? (
          <p>No requests yet. <button onClick={loadRequests}>Load</button></p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #ccc' }}>
                <th>ID</th><th>Tenant</th><th>Env</th><th>Class</th><th>Status</th><th>Account</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ fontSize: 11 }}>{r.id.slice(0, 8)}…</td>
                  <td>{r.tenantName}</td>
                  <td>{r.environmentName}</td>
                  <td>{r.environmentClass}</td>
                  <td><span style={{ color: r.status === 'COMPLETED' ? 'green' : r.status === 'FAILED' ? 'red' : 'orange' }}>{r.status}</span></td>
                  <td style={{ fontSize: 11 }}>{r.provisionedAccountId ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default App;
