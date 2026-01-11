import React, { useState } from 'react';
import Header from '../Header';
import { useWorkspace } from '../../context/WorkspaceContext';

export default function PrintView() {
    const { openLibrary, selection } = useWorkspace();
    const [settings, setSettings] = useState({
        paper: 'A4',
        layout: 'Single', // Single, Contact Sheet
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 10,
        marginRight: 10,
        softProof: false,
        intent: 'perceptual',
        showGamut: false,
        showInk: false
    });

    const papers = {
        'A4': { w: 210, h: 297 }, // mm
        'Letter': { w: 216, h: 279 }
    };

    const currentPaper = papers[settings.paper];

    return (
        <div className="app-container">
            <Header onBack={openLibrary} title="PRINT MODULE" />

            <div className="main-grid">
                <main className="print-canvas-area">
                    <div
                        className="print-page"
                        style={{
                            width: `${currentPaper.w * 2}px`, // Scale for viewing
                            height: `${currentPaper.h * 2}px`,
                            background: settings.softProof ? '#fdfbf7' : 'white', // Simba paper white
                            padding: `${settings.marginTop}px ${settings.marginRight}px ${settings.marginBottom}px ${settings.marginLeft}px`
                        }}
                    >
                        {/* Content Placeholder */}
                        <div className="print-content" style={{
                            width: '100%', height: '100%',
                            background: '#eee',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px dashed #ccc'
                        }}>
                            {selection.length > 0
                                ? `${selection.length} Images Selected`
                                : 'No Selection'}
                            {settings.softProof && <div className="proof-tag">PROOFING: SWOP V2</div>}
                        </div>
                    </div>
                </main>

                <aside className="right-panel glass-panel">
                    <div className="panel-section">
                        <h3>LAYOUT</h3>
                        <div className="control-group">
                            <label>Paper Size</label>
                            <select value={settings.paper} onChange={e => setSettings({ ...settings, paper: e.target.value })}>
                                <option value="A4">A4</option>
                                <option value="Letter">US Letter</option>
                            </select>
                        </div>
                        <div className="control-group">
                            <label>Template</label>
                            <select value={settings.layout} onChange={e => setSettings({ ...settings, layout: e.target.value })}>
                                <option>Single Image</option>
                                <option>Contact Sheet (4x5)</option>
                                <option>Custom Package</option>
                            </select>
                        </div>
                    </div>

                    <div className="panel-section">
                        <h3>MARGINS (mm)</h3>
                        <div className="control-group">
                            <label>Top</label>
                            <input type="range" min="0" max="50" value={settings.marginTop} onChange={e => setSettings({ ...settings, marginTop: parseInt(e.target.value) })} />
                        </div>
                    </div>

                    <div className="panel-section">
                        <h3>VERIFICATION</h3>
                        <div className="control-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={settings.showGamut}
                                    onChange={e => setSettings({ ...settings, showGamut: e.target.checked, showInk: false })}
                                />
                                Gamut Warning (Red)
                            </label>
                        </div>
                        <div className="control-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={settings.showInk}
                                    onChange={e => setSettings({ ...settings, showInk: e.target.checked, showGamut: false })}
                                />
                                <span>Ink Coverage (&gt; 300%)</span>
                            </label>
                        </div>
                    </div>

                    <div className="panel-section">
                        <h3>COLOR MANAGEMENT</h3>
                        <div className="control-group">
                            <label className="checkbox-label">
                                <input type="checkbox" checked={settings.softProof} onChange={e => setSettings({ ...settings, softProof: e.target.checked })} />
                                Soft Proofing
                            </label>
                        </div>
                        {settings.softProof && (
                            <div className="control-group">
                                <label>Profile</label>
                                <select>
                                    <option>US Web Coated (SWOP) v2</option>
                                    <option>Epson UltraPixel</option>
                                </select>
                                <label style={{ marginTop: 8 }}>Intent</label>
                                <select value={settings.intent} onChange={e => setSettings({ ...settings, intent: e.target.value })}>
                                    <option value="perceptual">Perceptual</option>
                                    <option value="relative">Relative Colorimetric</option>
                                </select>
                            </div>
                        )}
                    </div>
                </aside>
            </div >

            <style>{`
                .app-container { height: 100vh; display: flex; flex-direction: column; }
                .main-grid { flex: 1; display: flex; overflow: hidden; }
                .print-canvas-area { 
                    flex: 1; 
                    background: #333; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    overflow: auto;
                }
                .print-page {
                    box-shadow: 0 0 20px rgba(0,0,0,0.5);
                    transition: all 0.2s;
                    display: flex;
                }
                .right-panel {
                    width: 300px;
                    border-left: 1px solid rgba(255,255,255,0.1);
                    background: var(--panel-bg);
                    padding: 20px;
                }
                .panel-section { margin-bottom: 24px; border-bottom: 1px solid #333; padding-bottom: 16px; }
                .panel-section h3 { font-size: 11px; color: #888; margin-bottom: 12px; }
                .control-group { margin-bottom: 12px; }
                .control-group label { display: block; font-size: 11px; margin-bottom: 4px; color: #aaa; }
                .control-group select, .control-group input[type=range] { width: 100%; }
                .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
                .proof-tag { 
                    position: absolute; top: 10px; right: 10px; 
                    background: red; color: white; 
                    font-size: 10px; padding: 2px 4px; 
                }
            `}</style>
        </div >
    );
}
