import { useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle style={{ color: 'var(--success)' }} size={20} />;
      case 'error':
        return <AlertTriangle style={{ color: 'var(--danger)' }} size={20} />;
      case 'warning':
        return <AlertTriangle style={{ color: 'var(--warning)' }} size={20} />;
      default:
        return <Info style={{ color: 'var(--primary)' }} size={20} />;
    }
  };

  return (
    <div className={`toast toast-${type}`}>
      {getIcon()}
      <span style={{ fontSize: '0.9rem', fontWeight: 500, flex: 1, paddingRight: '8px' }}>{message}</span>
      <button 
        onClick={onClose} 
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'var(--text-muted)', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: 0
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
