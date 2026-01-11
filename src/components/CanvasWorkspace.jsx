import { useState, useRef, useEffect } from 'react';

function CanvasWorkspace({ canvasRef, image }) {
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.max(0.1, Math.min(5, transform.scale * (1 + scaleAmount)));

    // Simple zoom to center for MVP. 
    // True zoom-to-cursor requires complex math with offset correction.

    setTransform(prev => ({ ...prev, scale: newScale }));
  };

  const handleMouseDown = (e) => {
    if (e.button === 1 || e.button === 0) { // Left or Middle
      setIsDragging(true);
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;

    setTransform(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy
    }));

    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset transform when image loads
  useEffect(() => {
    if (image) {
      // Fit logic could go here
      setTransform({ scale: 1, x: 0, y: 0 });
    }
  }, [image]);

  return (
    <div
      className="workspace-container"
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {image ? (
        <div
          className="canvas-wrapper"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          <canvas
            id="editor-canvas"
            ref={canvasRef}
            className="main-canvas"
          ></canvas>
        </div>
      ) : (
        <div className="empty-state">
          {/* Drop target logic comes later, button handles it for now */}
          <div className="drop-target">
            <div className="plus-icon">+</div>
            <p>OPEN IMAGE TO START</p>
          </div>
        </div>
      )}

      <style>{`
        .workspace-container {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background-color: var(--bg-color);
        }

        .canvas-wrapper {
          transform-origin: center;
          transition: transform 0.05s linear; /* Smooth-ish, but instant enough */
          box-shadow: 0 0 100px rgba(0,0,0,0.5);
          will-change: transform;
        }

        .main-canvas {
          max-width: none; /* Let WebGL control size */
          display: block;
          /* If huge image, we might want to verify max-texture-size logic, 
             but usually <canvas> handles display scaling fine */
        }

        /* Initial fit: 
           We might want CSS ensuring canvas doesn't default to HUGE if not transformed.
           But since we use transform, let's let it be natural size? 
           For v1.0, user might load 4000px image. 
           Should we css-scale it down to fit initially? 
           Yes. */
        
        .main-canvas {
            /* Actually, relying on JS to set width/height attributes means 
               it renders at that pixel size. 
               CSS max-width/max-height helps keep it visible initially. */
            max-width: 90vw;
            max-height: 90vh;
            width: auto;
            height: auto;
        }

        .empty-state {
          border: 1px dashed rgba(255,255,255,0.1);
          width: 400px;
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .empty-state:hover {
          border-color: var(--accent-color);
          background: rgba(255,255,255,0.01);
        }

        .drop-target {
          text-align: center;
          color: var(--text-secondary);
        }

        .plus-icon {
          font-size: 40px;
          font-weight: 300;
          margin-bottom: 10px;
          color: var(--panel-border);
        }

        .drop-target p {
          font-size: 12px;
          letter-spacing: 0.1em;
        }
      `}</style>
    </div>
  );
}

export default CanvasWorkspace;
