import React from 'react';

type PremiumPanelLayoutProps = {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  icon?: React.ReactNode;
  imageAsset?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  activeStatus?: string;
  onClose?: () => void;
};

const T = {
  bg: '#0b1326',
  surface: '#171f33',
  outlineVariant: '#2d3449',
  primary: '#b4c5ff',
  primaryContainer: '#2563eb',
  onSurface: '#ffffff',
  onSurfaceVariant: '#94a3b8',
};

export function PremiumPanelLayout({
  title,
  subtitle,
  icon,
  imageAsset = '/assets/vsl/vsl_digital_twin.png', // Default premium asset se não houver um mapeado
  headerActions,
  children,
  activeStatus = 'ATIVO'
}: PremiumPanelLayoutProps) {
  return (
    <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: T.bg, color: T.onSurface, display: 'flex', flexDirection: 'column' }}>
      
      {/* Premium Hero Header */}
      <div style={{
        position: 'relative', overflow: 'hidden', padding: '32px 24px', borderRadius: '12px', marginBottom: '24px', flexShrink: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        border: `1px solid ${T.outlineVariant}`, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        {/* Background Image & Overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
          backgroundImage: `url(${imageAsset}), linear-gradient(135deg, ${T.bg} 0%, ${T.surface} 100%)`,
          backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.4,
          filter: 'blur(2px) brightness(0.8)'
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1,
          background: `linear-gradient(to right, ${T.bg}f2 0%, ${T.bg}66 100%)`
        }} />
        
        {/* Left Side: Text & Badges */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ background: `${T.primary}33`, color: T.primary, padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
              {title}
            </span>
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 700, letterSpacing: '0.05em', border: '1px solid rgba(16, 185, 129, 0.3)' }}>{activeStatus}</span>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', margin: '0 0 8px 0', letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            {title}
          </h2>
          <p style={{ fontSize: '13px', color: T.onSurfaceVariant, maxWidth: '600px', lineHeight: 1.5 }}>
            {subtitle}
          </p>
        </div>

        {/* Right Side: Actions */}
        {headerActions && (
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0, background: 'rgba(11, 19, 38, 0.6)', padding: '8px', borderRadius: '8px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {headerActions}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>

    </div>
  );
}
