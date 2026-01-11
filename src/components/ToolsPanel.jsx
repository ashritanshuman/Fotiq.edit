import { Upload, RotateCcw, RotateCw, ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { useRef, useState } from 'react';
import SliderControl from './ui/SliderControl';
import ToneCurvePanel from './tools/ToneCurvePanel';
import ColorMixerPanel from './tools/ColorMixerPanel';
import DetailPanel from './tools/DetailPanel';
import MaskManagerPanel from './tools/MaskManagerPanel';

const GROUPS = [
  {
    id: 'light',
    title: 'LIGHT',
    tools: [
      { id: 'exposure', label: 'Exposure', min: -100, max: 100 },
      { id: 'contrast', label: 'Contrast', min: -100, max: 100 },
      { id: 'highlights', label: 'Highlights', min: -100, max: 100 },
      { id: 'shadows', label: 'Shadows', min: -100, max: 100 },
      { id: 'whites', label: 'Whites', min: -100, max: 100 },
      { id: 'blacks', label: 'Blacks', min: -100, max: 100 },
    ]
  },
  {
    id: 'curve',
    title: 'TONE CURVE',
    custom: true,
    component: ToneCurvePanel
  },
  {
    id: 'color',
    title: 'COLOR (BASIC)',
    tools: [
      { id: 'temp', label: 'Temp', min: -100, max: 100 },
      { id: 'tint', label: 'Tint', min: -100, max: 100 },
      { id: 'vibrance', label: 'Vibrance', min: -100, max: 100 },
      { id: 'saturation', label: 'Saturation', min: -100, max: 100 },
    ]
  },
  {
    id: 'mixer',
    title: 'COLOR MIXER',
    custom: true,
    component: ColorMixerPanel
  },
  {
    id: 'detail',
    title: 'DETAIL',
    custom: true,
    component: DetailPanel
  },
  {
    id: 'geometry',
    title: 'GEOMETRY',
    tools: [
      { id: 'distortion', label: 'Distortion', min: -100, max: 100 },
    ]
  },
  {
    id: 'masking',
    title: 'LOCAL MASKING',
    custom: true,
    component: MaskManagerPanel
  }
];

function ToolsPanel({ onUpload, onAdjustment, values = {}, onUndo, onRedo, onCompare, onAddMask, onUpdateMask, onDeleteMask }) {
  const fileInputRef = useRef(null);
  const [openGroups, setOpenGroups] = useState({ light: true, curve: false, color: true, mixer: false, geometry: false });

  const toggleGroup = (id) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="tools-container">
      {/* Upload Section */}
      <div className="tool-section">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          // Accept RAW formats too
          accept="image/*,.dng,.cr2,.nef,.arw,.raf,.orf"
        />
        <button
          className="btn-primary full-width"
          onClick={() => fileInputRef.current.click()}
        >
          <Upload size={16} />
          <span>OPEN PHOTO</span>
        </button>
      </div>

      <div className="divider"></div>

      <div className="scroll-area">
        {GROUPS.map(group => (
          <div key={group.id} className="accordion-group">
            <button className="accordion-header" onClick={() => toggleGroup(group.id)}>
              <span className="group-title">{group.title}</span>
              {openGroups[group.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {openGroups[group.id] && (
              <div className="accordion-content">
                {group.custom ? (
                  <group.component
                    values={values}
                    onChange={(key, val) => onAdjustment(key, val)}
                    masks={values.masks || []}
                    onAdd={onAddMask}
                    onUpdate={onUpdateMask}
                    onDelete={onDeleteMask}
                  />
                ) : (
                  group.tools.map(tool => (
                    <SliderControl
                      key={tool.id}
                      label={tool.label}
                      min={tool.min}
                      max={tool.max}
                      value={values[tool.id] || 0}
                      onChange={(val) => onAdjustment(tool.id, val)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="divider"></div>

      <div className="footer-controls">
        <div className="history-controls">
          <button className="icon-btn" title="Undo" onClick={onUndo}>
            <RotateCcw size={18} />
          </button>
          <button className="icon-btn" title="Redo" onClick={onRedo}>
            <RotateCw size={18} />
          </button>
        </div>

        <button
          className="btn-secondary compare-btn"
          onMouseDown={() => onCompare(true)}
          onMouseUp={() => onCompare(false)}
          onMouseLeave={() => onCompare(false)}
          onTouchStart={() => onCompare(true)}
          onTouchEnd={() => onCompare(false)}
        >
          <Eye size={16} />
          <span>HOLD</span>
        </button>
      </div>

      <style>{`
        .tools-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: 100%;
        }

        .scroll-area {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-right: 4px;
        }

        .scroll-area::-webkit-scrollbar {
          width: 4px;
        }
        .scroll-area::-webkit-scrollbar-thumb {
          background: var(--panel-border);
        }

        .accordion-group {
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 12px;
        }
        
        .accordion-header {
          width: 100%;
          background: transparent;
          color: var(--text-secondary);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          transition: color 0.2s;
        }
        
        .accordion-header:hover {
          color: var(--text-primary);
        }

        .group-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
        }

        .accordion-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-top: 8px;
        }

        .footer-controls {
            margin-top: auto;
            display: flex;
            gap: 12px;
        }

        .history-controls {
          display: flex;
          gap: 4px;
        }
        
        .compare-btn {
            flex: 1;
            justify-content: center;
        }
      `}</style>
    </div>
  );
}

export default ToolsPanel;
