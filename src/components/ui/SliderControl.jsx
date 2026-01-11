import { useRef } from 'react';

function SliderControl({ label, value, min = -100, max = 100, onChange, step = 1 }) {

    const handleReset = () => {
        onChange(0);
    };

    const handleInputChange = (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 0;
        if (val < min) val = min;
        if (val > max) val = max;
        onChange(val);
    };

    return (
        <div className="slider-control" onDoubleClick={handleReset}>
            <div className="slider-header">
                <label>{label}</label>
                <input
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    className="value-input"
                />
            </div>

            <div className="track-container">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    className="brutalist-slider"
                />
                {/* Center tick */}
                <div className="center-tick"></div>
            </div>

            <style>{`
        .slider-control {
          display: flex;
          flex-direction: column;
          gap: 6px;
          user-select: none;
        }

        .slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .slider-header label {
          font-size: 10px;
          color: var(--text-secondary);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .value-input {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-family: var(--font-mono);
          font-size: 11px;
          text-align: right;
          width: 40px;
          outline: none;
        }
        
        .value-input:focus {
          color: var(--accent-color);
        }

        .track-container {
          position: relative;
          height: 12px;
          display: flex;
          align-items: center;
        }

        .center-tick {
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 1px;
          background: var(--panel-border);
          pointer-events: none;
          z-index: 0;
        }

        .brutalist-slider {
          z-index: 1;
        }
      `}</style>
        </div>
    );
}

export default SliderControl;
