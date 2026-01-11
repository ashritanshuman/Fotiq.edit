import React, { useRef, useEffect } from 'react';

export default function WaveformMonitor({ width = 256, height = 120 }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Mock Waveform Drawing
        // In real app, we analyze the output texture.
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'screen';

        const drawChannel = (color, offset) => {
            ctx.strokeStyle = color;
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                // Simulated signal
                const y = height / 2 + Math.sin(x * 0.05 + offset) * 30 + (Math.random() * 10);
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        };

        drawChannel('#ff0000', 0);
        drawChannel('#00ff00', 2);
        drawChannel('#0000ff', 4);

    }, []);

    return (
        <div className="waveform-monitor glass-panel" style={{ padding: 8 }}>
            <h4 style={{ fontSize: 10, marginBottom: 4, color: '#888' }}>RGB PARADE</h4>
            <canvas ref={canvasRef} width={width} height={height} style={{ background: '#111' }} />
        </div>
    );
}
