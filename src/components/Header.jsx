import { Download } from 'lucide-react';
import { useState } from 'react';

function Header({ onDownload }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    // Tiny delay to allow UI to update if operation was heavy
    setTimeout(() => {
      onDownload();
      setIsExporting(false);
    }, 100);
  };

  return (
    <header className="header glass-panel">
      <div className="logo">FOTIQ <span className="version">v1.0</span></div>

      <div className="project-title">
        UNTITLED EDIT
      </div>

      <button
        className={`download-btn ${isExporting ? 'loading' : ''}`}
        onClick={handleExport}
        disabled={isExporting}
      >
        <Download size={16} />
        <span>{isExporting ? 'SAVING...' : 'EXPORT'}</span>
      </button>

      <style>{`
        .header {
          height: var(--header-height);
          border-bottom: var(--glass-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 20;
          position: relative;
        }

        .logo {
          font-weight: 800;
          font-size: 24px;
          letter-spacing: 0.1em;
          color: white;
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        
        .version {
          font-size: 10px;
          font-weight: 400;
          color: var(--accent-color);
          opacity: 0.7;
        }

        .project-title {
          font-family: var(--font-mono);
          text-transform: uppercase;
          font-size: 12px;
          color: var(--text-secondary);
          letter-spacing: 0.05em;
        }

        .download-btn {
          background: var(--text-primary);
          color: var(--bg-color);
          height: 36px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.05em;
          transition: all 0.2s ease;
          border-radius: 2px;
        }

        .download-btn:hover {
          background: var(--accent-color);
          box-shadow: 0 0 15px var(--accent-dim);
        }
        
        .download-btn.loading {
            opacity: 0.7;
            cursor: wait;
        }
      `}</style>
    </header>
  );
}

export default Header;
