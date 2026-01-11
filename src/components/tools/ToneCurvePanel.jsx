import { useState, useRef, useEffect, useMemo } from 'react';

// Monotone Cubic Spline Interpolation
function monotoneCubicInterpolate(points) {
    const n = points.length;
    if (n === 0) return new Float32Array(256).fill(0);

    // Sort
    const P = [...points].sort((a, b) => a.x - b.x);

    // Get X and Y arrays
    const x = P.map(p => p.x);
    const y = P.map(p => p.y);

    // Compute slopes (dy/dx)
    const dx = [];
    const dy = [];
    const slope = [];
    for (let i = 0; i < n - 1; i++) {
        dx.push(x[i + 1] - x[i]);
        dy.push(y[i + 1] - y[i]);
        slope.push(dy[i] / dx[i]);
    }

    // Compute tangents
    const m = new Array(n).fill(0);
    m[0] = slope[0];
    m[n - 1] = slope[n - 2];
    for (let i = 1; i < n - 1; i++) {
        if (slope[i - 1] * slope[i] <= 0) {
            m[i] = 0;
        } else {
            // Weighted average? Or simple average?
            // Standard Monotone: 
            m[i] = (slope[i - 1] + slope[i]) * 0.5;
        }
    }

    // Check monotonicity again? (Steffen's method or Fritsch-Carlson)
    // Fritsch-Carlson:
    for (let i = 0; i < n - 1; i++) {
        if (dy[i] === 0) {
            m[i] = 0;
            m[i + 1] = 0;
        } else {
            const alpha = m[i] / slope[i];
            const beta = m[i + 1] / slope[i];
            if (alpha * alpha + beta * beta > 9) {
                const tau = 3 / Math.sqrt(alpha * alpha + beta * beta);
                m[i] = tau * alpha * slope[i];
                m[i + 1] = tau * beta * slope[i];
            }
        }
    }

    // Generate LUT
    const lut = new Float32Array(256);
    let k = 0;
    for (let i = 0; i < 256; i++) {
        // Find segment
        while (k < n - 2 && i > x[k + 1]) k++;

        const h = dx[k];
        if (h === 0) {
            lut[i] = y[k] / 255.0;
            continue;
        }

        const t = (i - x[k]) / h;
        const t2 = t * t;
        const t3 = t2 * t;

        // Hermite Basis
        const h00 = 2 * t3 - 3 * t2 + 1;
        const h10 = t3 - 2 * t2 + t;
        const h01 = -2 * t3 + 3 * t2;
        const h11 = t3 - t2;

        const val = h00 * y[k] + h10 * h * m[k] + h01 * y[k + 1] + h11 * h * m[k + 1];
        lut[i] = Math.max(0, Math.min(255, val)) / 255.0;
    }
    return lut;
}

function ToneCurvePanel({ values, onChange }) {
    const [mode, setMode] = useState('parametric'); // 'parametric' | 'point'
    // Points state (local, or needs to be in values? For MVP, local is risky if unmount)
    // Ideally put points in values.adjusted_curve_points?
    // Let's assume values.curvePoints exists or default.
    const [points, setPoints] = useState(values.curvePoints || [
        { x: 0, y: 0 },
        { x: 255, y: 255 }
    ]);

    const [activePoint, setActivePoint] = useState(null);
    const svgRef = useRef(null);

    // Update LUT when points change
    useEffect(() => {
        // Only update if points differ? 
        // We need to pass both points AND limits.
        const lut = monotoneCubicInterpolate(points);
        onChange('toneCurve', lut);
        onChange('curvePoints', points); // Save points to state
    }, [points]);

    // ... Mouse handlers (Same as before but using setPoints)
    const handleMouseDown = (e) => {
        const rect = svgRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 255;
        const y = 255 - ((e.clientY - rect.top) / rect.height * 255);
        const threshold = 10;
        const existing = points.find(p => Math.abs(p.x - x) < threshold && Math.abs(p.y - y) < threshold);

        if (existing) {
            setActivePoint(existing); // Drag logic...
        } else {
            const newPoint = { x, y };
            setPoints(prev => [...prev, newPoint].sort((a, b) => a.x - b.x));
            setActivePoint(newPoint);
        }
    };

    const handleMouseMove = (e) => {
        if (!activePoint) return;
        const rect = svgRef.current.getBoundingClientRect();
        let x = (e.clientX - rect.left) / rect.width * 255;
        let y = 255 - ((e.clientY - rect.top) / rect.height * 255);
        x = Math.max(0, Math.min(255, x));
        y = Math.max(0, Math.min(255, y));

        setPoints(prev => prev.map(p => p === activePoint ?
            { ...p, x: (p.x === 0 || p.x === 255) ? p.x : x, y } : p
        ).sort((a, b) => a.x - b.x));
    };

    const handleMouseUp = () => setActivePoint(null);

    // Path D
    const pathD = useMemo(() => {
        // Visualize the LUT instead of straight lines?
        // Or just draw straight lines for point handles and smooth curve for LUT?
        // If "Point Curve", we usually visualize the spline.
        // Let's generate path from spline.
        const lut = monotoneCubicInterpolate(points);
        let d = `M 0 ${255 - lut[0] * 255}`;
        for (let i = 4; i < 256; i += 4) {
            d += ` L ${i} ${255 - lut[i] * 255}`;
        }
        return d;
    }, [points]);

    return (
        <div className="curve-editor">
            <div className="curve-header">
                <div className="curve-tabs">
                    <button className={mode === 'parametric' ? 'active' : ''} onClick={() => setMode('parametric')}>PARAMETRIC</button>
                    <button className={mode === 'point' ? 'active' : ''} onClick={() => setMode('point')}>POINT</button>
                </div>
                <button className="reset-btn" onClick={() => {
                    setPoints([{ x: 0, y: 0 }, { x: 255, y: 255 }]);
                    // Also reset parametrics?
                }}>RESET</button>
            </div>

            <div className="svg-wrapper"
                onMouseDown={mode === 'point' ? handleMouseDown : undefined}
                onMouseMove={mode === 'point' ? handleMouseMove : undefined}
                onMouseUp={mode === 'point' ? handleMouseUp : undefined}
                onMouseLeave={mode === 'point' ? handleMouseUp : undefined}
                style={{ cursor: mode === 'point' ? 'crosshair' : 'default' }}
            >
                <svg ref={svgRef} viewBox="0 0 255 255" className="curve-svg">
                    {/* Grid */}
                    <path d="M0,64 L255,64 M0,128 L255,128 M0,192 L255,192 M64,0 L64,255 M128,0 L128,255 M192,0 L192,255" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
                    <line x1="0" y1="255" x2="255" y2="0" stroke="rgba(255,255,255,0.2)" strokeDasharray="4" />
                    <path d={pathD} stroke="white" fill="none" strokeWidth="2" />
                    {mode === 'point' && points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={255 - p.y} r="4" fill="var(--accent-color)" />
                    ))}
                </svg>
            </div>

            {mode === 'parametric' && (
                <div className="parametric-controls">
                    <SliderControl label="Highlights" value={values.curveHighlights || 0} min={-100} max={100} onChange={v => onChange('curveHighlights', v)} />
                    <SliderControl label="Lights" value={values.curveLights || 0} min={-100} max={100} onChange={v => onChange('curveLights', v)} />
                    <SliderControl label="Darks" value={values.curveDarks || 0} min={-100} max={100} onChange={v => onChange('curveDarks', v)} />
                    <SliderControl label="Shadows" value={values.curveShadows || 0} min={-100} max={100} onChange={v => onChange('curveShadows', v)} />
                </div>
            )}

            <style>{`
                .curve-tabs { display: flex; gap: 8px; }
                .curve-tabs button {
                    background: none; border: none; color: #666; 
                    font-size: 10px; font-weight: bold; cursor: pointer;
                    padding-bottom: 2px;
                }
                .curve-tabs button.active {
                    color: white; border-bottom: 2px solid var(--accent-color);
                }
                .parametric-controls {
                    display: flex; flex-direction: column; gap: 8px; margin-top: 12px;
                }
                /* Reuse previous styles */
                .curve-editor { display: flex; flex-direction: column; gap: 8px; padding: 8px 0; user-select: none; }
                .curve-header { display: flex; justify-content: space-between; font-size: 10px; color: var(--text-secondary); font-weight: 600; }
                .reset-btn { background: none; border: none; color: var(--text-secondary); font-size: 9px; cursor: pointer; }
                .svg-wrapper { width: 100%; height: 0; padding-bottom: 100%; position: relative; background: rgba(0,0,0,0.2); border: 1px solid var(--panel-border); }
                .curve-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: visible; }
            `}</style>
        </div>
    );
}

// Need to import SliderControl since I use it
import SliderControl from '../ui/SliderControl';

export default ToneCurvePanel;
