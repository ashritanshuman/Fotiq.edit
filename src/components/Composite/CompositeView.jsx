import React, { useState } from 'react';
import Header from '../Header';
import { useWorkspace } from '../../context/WorkspaceContext';

export default function CompositeView() {
    const { openLibrary } = useWorkspace();
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0.5);

    return (
        <div className="app-container">
            <Header onBack={openLibrary} title="COMPOSITOR" />
            <div className="composite-workspace">
                <div className="preview-area">
                    <div className="layer base-layer">
                        <div className="placeholder-text">Base Image</div>
                    </div>
                    <div
                        className="layer top-layer"
                        style={{
                            transform: `translate(${offset.x}px, ${offset.y}px)`,
                            opacity: opacity,
                            mixBlendMode: 'normal' // or 'difference' for alignment
                        }}
                    >
                        <div className="placeholder-text">Top Image</div>
                    </div>
                </div>

                <div className="composite-controls glass-panel">
                    <h3>Manual Alignment</h3>
                    <div className="control-group">
                        <label>Opacity {Math.round(opacity * 100)}%</label>
                        <input type="range" min="0" max="1" step="0.01" value={opacity} onChange={e => setOpacity(parseFloat(e.target.value))} />
                    </div>
                    <div className="control-group">
                        <label>Shift X: {offset.x}px</label>
                        <input type="range" min="-200" max="200" value={offset.x} onChange={e => setOffset(prev => ({ ...prev, x: parseInt(e.target.value) }))} />
                    </div>
                    <div className="control-group">
                        <label>Shift Y: {offset.y}px</label>
                        <input type="range" min="-200" max="200" value={offset.y} onChange={e => setOffset(prev => ({ ...prev, y: parseInt(e.target.value) }))} />
                    </div>

                    <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => alert("Merge feature coming in v4.1")}>
                        MERGE LAYERS
                    </button>
                </div>
            </div>

            <style>{`
                .app-container { height: 100vh; display: flex; flex-direction: column; }
                .composite-workspace { flex: 1; display: flex; position: relative; background: #111; overflow: hidden; }
                .preview-area { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; }
                .layer {
                    width: 400px; height: 300px; 
                    position: absolute; 
                    display: flex; align-items: center; justify-content: center;
                    border: 1px solid #444;
                }
                .base-layer { background: #222; z-index: 1; }
                .top-layer { background: #333; z-index: 2; border-color: var(--accent-color); }
                .placeholder-text { color: #666; font-weight: bold; }
                
                .composite-controls {
                    width: 250px;
                    padding: 20px;
                    border-left: var(--glass-border);
                    background: var(--panel-bg);
                }
                .control-group { margin-bottom: 16px; }
                .control-group input { width: 100%; }
                .control-group label { display: block; font-size: 11px; margin-bottom: 4px; color: #888; }
            `}</style>
        </div>
    );
}
