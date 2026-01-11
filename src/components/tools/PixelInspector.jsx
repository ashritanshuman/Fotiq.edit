import React from 'react';

export default function PixelInspector({ r, g, b }) {
    // Convert to other spaces
    const rInt = Math.round(r * 255);
    const gInt = Math.round(g * 255);
    const bInt = Math.round(b * 255);

    // Mock LAB
    const L = Math.round((r * 0.2 + g * 0.7 + b * 0.07) * 100);
    const a = Math.round((r - g) * 100);
    const B_lab = Math.round((g - b) * 100);

    // Mock CMYK
    const k = 1 - Math.max(r, g, b);
    const c = (1 - r - k) / (1 - k) || 0;
    const m = (1 - g - k) / (1 - k) || 0;
    const y = (1 - b - k) / (1 - k) || 0;

    return (
        <div className="pixel-inspector glass-panel" style={{
            position: 'absolute', bottom: 20, right: 20,
            width: 200, padding: 12,
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid #444',
            fontFamily: 'monospace', fontSize: 11
        }}>
            <h4 style={{margin:'0 0 8px 0', borderBottom:'1px solid #444'}}>INSPECTOR</h4>
            
            <div style={{display:'flex', gap: 12}}>
                <div style={{width: 32, height: 32, background: \`rgb(\${rInt},\${gInt},\${bInt})\`, border:'1px solid white'}}></div>
                <div>
                     <div>RGB: {rInt} {gInt} {bInt}</div>
                     <div>HEX: #{rInt.toString(16).padStart(2,'0')}{gInt.toString(16).padStart(2,'0')}{bInt.toString(16).padStart(2,'0')}</div>
                </div>
            </div>
            
            <div style={{marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
                <div>
                    <strong>Lab</strong><br/>
                    L: {L}<br/>a: {a}<br/>b: {B_lab}
                </div>
                 <div>
                    <strong>CMYK</strong><br/>
                    C: {Math.round(c*100)}<br/>
                    M: {Math.round(m*100)}<br/>
                    Y: {Math.round(y*100)}<br/>
                    K: {Math.round(k*100)}
                </div>
            </div>
        </div >
    );
}
