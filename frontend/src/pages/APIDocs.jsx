import React from 'react';

export default function APIDocs() {
  return (
    <section className="api-docs-page" style={{ padding: 'var(--space-8)', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div className="glass-card" style={{ padding: 'var(--space-6)', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 className="gradient-text" style={{ fontSize: 'var(--font-4xl)', marginBottom: 'var(--space-6)' }}>
          API Documentation
        </h1>
        <iframe
          src="/docs"
          style={{ width: '100%', height: '80vh', border: 'none', borderRadius: 'var(--radius-lg)' }}
          title="Swagger UI"
        />
      </div>
    </section>
  );
}
