import { useState } from 'react';
import { useTheme } from './ThemeContext';

export default function ThemeSwitcher() {
  const { themeId, setThemeId, themes } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        id="theme-switcher-btn"
        onClick={() => setOpen(o => !o)}
        title="Change Theme"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 500,
          width: 48,
          height: 48,
          border: '1px solid var(--border-glass)',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(16px)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.3rem',
          transition: 'all 250ms cubic-bezier(0.4,0,0.2,1)',
          boxShadow: open ? 'var(--shadow-glow-lg)' : 'var(--shadow-md)',
          transform: open ? 'rotate(30deg) scale(1.1)' : 'scale(1)',
        }}
      >
        🎨
      </button>

      {/* Panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              zIndex: 490,
              background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(4px)',
              animation: 'fadeIn 0.2s ease-out',
            }}
          />

          {/* Theme Panel */}
          <div
            style={{
              position: 'fixed',
              bottom: '5rem',
              right: '1.5rem',
              zIndex: 500,
              width: 320,
              background: 'rgba(10,12,20,0.96)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-2xl)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(30px)',
              overflow: 'hidden',
              animation: 'fadeInUp 0.25s ease-out',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>
                  Choose Theme
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {themes.length} themes available
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 28, height: 28,
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem',
                }}
              >✕</button>
            </div>

            {/* Theme Grid */}
            <div style={{
              padding: '1rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              maxHeight: '70vh',
              overflowY: 'auto',
            }}>
              {themes.map((theme) => {
                const active = themeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    id={`theme-${theme.id}`}
                    onClick={() => { setThemeId(theme.id); setOpen(false); }}
                    style={{
                      padding: '0.75rem',
                      border: active
                        ? `2px solid ${theme.preview[0]}`
                        : '2px solid rgba(255,255,255,0.07)',
                      borderRadius: 'var(--radius-lg)',
                      background: active
                        ? `rgba(${hexToRgb(theme.preview[0])}, 0.1)`
                        : 'rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 200ms ease',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={e => {
                      if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                    }}
                    onMouseLeave={e => {
                      if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }}
                  >
                    {/* BG Thumbnail */}
                    <div style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      marginBottom: '0.5rem',
                      position: 'relative',
                      background: theme.preview[0],
                    }}>
                      <img
                        src={theme.bg}
                        alt={theme.name}
                        style={{
                          width: '100%', height: '100%',
                          objectFit: 'cover',
                          opacity: 0.85,
                        }}
                      />
                      {/* colour tint overlay */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: `linear-gradient(135deg, ${theme.preview[0]}44, ${theme.preview[2]}33)`,
                      }} />
                    </div>

                    {/* Active Check */}
                    {active && (
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 16, height: 16,
                        background: theme.preview[0],
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.55rem', color: '#fff', fontWeight: 700,
                      }}>✓</div>
                    )}

                    {/* Colour Swatches */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: '0.5rem' }}>
                      {theme.preview.map((color, i) => (
                        <div key={i} style={{
                          width: i === 0 ? 22 : 14,
                          height: 14,
                          borderRadius: 4,
                          background: color,
                          flexShrink: 0,
                        }} />
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: '1rem' }}>{theme.emoji}</span>
                      <div>
                        <div style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: active ? theme.preview[0] : 'var(--text-primary)',
                          lineHeight: 1.2,
                        }}>{theme.name}</div>
                        <div style={{
                          fontSize: '0.65rem',
                          color: 'var(--text-muted)',
                          marginTop: 1,
                        }}>{theme.desc}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Utility: convert hex colour to "r, g, b" for rgba()
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '255,255,255';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}
