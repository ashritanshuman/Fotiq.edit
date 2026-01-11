import { useRef, useEffect } from 'react';

export default function InfoPanel({ metadata, getHistogram, trigger }) {
  const { width = 0, height = 0, name = '...' } = metadata || {};

  // Fake file size for prototype
  const size = width * height * 4 / 1024 / 1024; // approx size in MB for 32bit

  const canvasRef = useRef(null);

  useEffect(() => {
    if (!getHistogram || !canvasRef.current) return;

    // Defer slighty to allow render to finish
    const timer = setTimeout(() => {
      const data = getHistogram();
      if (data) drawHistogram(data);
    }, 100);

    return () => clearTimeout(timer);
  }, [getHistogram, trigger]); // Trigger on adjustments change

  const drawHistogram = (data) => {
    const cvs = canvasRef.current;
    const ctx = cvs.getContext('2d');
    const w = cvs.width;
    const h = cvs.height;

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'screen';

    // Find max value to normalize
    let max = 0;
    for (let i = 0; i < 256; i++) {
      max = Math.max(max, data.r[i], data.g[i], data.b[i]);
    }
    if (max === 0) max = 1;

    // Draw Channels
    const drawChannel = (buckets, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * w;
        const val = buckets[i] / max;
        const y = h - (val * h);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.fill();
    };

    drawChannel(data.r, 'rgba(255, 50, 50, 0.5)');
    drawChannel(data.g, 'rgba(50, 255, 50, 0.5)');
    drawChannel(data.b, 'rgba(50, 100, 255, 0.5)');

    // White (Intersect)
    // Actually composite mode 'screen' handles intersection to white naturally
  };

  return (
    <div className="info-panel">
      <div className="panel-header">
        <h3>HISTOGRAM</h3>
      </div>
      <div className="histogram-container">
        <canvas ref={canvasRef} width={260} height={140} style={{ width: '100%', height: '140px', background: '#111', borderRadius: '4px' }} />
      </div>

      <div className="panel-header">
        <h3>METADATA</h3>
      </div>
      <div className="metadata-grid">
        <div className="meta-item">
          <span className="label">File</span>
          <span className="value" title={metadata.name || '-'}>{metadata.name || '-'}</span>
        </div>
        <div className="meta-item">
          <label>DIMENSIONS</label>
          <span>{width} x {height}</span>
        </div>
        <div className="meta-item">
          <label>FORMAT</label>
          <span>IMG</span>
        </div>
        <div className="meta-item">
          <label>SIZE</label>
          <span>{size > 0 ? size.toFixed(2) : '-'} MB</span>
        </div>
        <div className="meta-item">
          <label>NAME</label>
          {/* Truncate name slightly */}
          <span title={name} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{name}</span>
        </div>
      </div>

      <style>{`
        .info-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .section-title {
          font-size: 10px;
          color: var(--text-secondary);
          letter-spacing: 0.15em;
          margin-bottom: 8px;
        }

        .divider {
          height: 1px;
          background: var(--panel-border);
          width: 100%;
        }

        .metadata-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-item label {
          font-size: 9px;
          color: var(--text-secondary);
        }

        .meta-item span {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}


