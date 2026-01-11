import SliderControl from '../ui/SliderControl';

function DetailPanel({ values, onChange }) {
    return (
        <div className="detail-panel">
            <div className="section-header">SHARPENING</div>
            <SliderControl
                label="Amount"
                min={0}
                max={150}
                value={values.sharpenAmount || 0}
                onChange={(val) => onChange('sharpenAmount', val)}
            />
            {/* Radius implies logic complexity, skipping for simple convolution width in MVP or hardcoding usually 1.0 */}

            <div className="spacer"></div>

            <div className="section-header">NOISE REDUCTION</div>
            <SliderControl
                label="Luminance"
                min={0}
                max={100}
                value={values.noiseLuminance || 0}
                onChange={(val) => onChange('noiseLuminance', val)}
            />

            <div className="spacer"></div>

            <style>{`
        .detail-panel {
           display: flex;
           flex-direction: column;
           gap: 12px;
        }
        .section-header {
           font-size: 10px;
           color: var(--text-secondary);
           font-weight: 600;
           margin-bottom: 4px;
        }
        .spacer {
           height: 8px;
        }
      `}</style>
        </div>
    );
}

export default DetailPanel;
