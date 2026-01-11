import { useState } from 'react';
import SliderControl from '../ui/SliderControl';

const CHANNELS = [
    { id: 'red', label: 'Red' },
    { id: 'orange', label: 'Orange' },
    { id: 'yellow', label: 'Yellow' },
    { id: 'green', label: 'Green' },
    { id: 'aqua', label: 'Aqua' },
    { id: 'blue', label: 'Blue' },
    { id: 'purple', label: 'Purple' },
    { id: 'magenta', label: 'Magenta' }
];

const TABS = ['Hue', 'Saturation', 'Luminance'];

function ColorMixerPanel({ values = {}, onChange }) {
    const [activeTab, setActiveTab] = useState('Saturation');

    const getVal = (channel, tab) => {
        const suffix = tab.charAt(0).toLowerCase();
        const key = `hsl_${channel.id}_${suffix}`;
        return values[key] || 0;
    };

    const handleChange = (channel, tab, val) => {
        const suffix = tab.charAt(0).toLowerCase();
        const key = `hsl_${channel.id}_${suffix}`;
        onChange(key, val);
    };

    return (
        <div className="color-mixer">
            <div className="mixer-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="mixer-sliders">
                {CHANNELS.map(channel => (
                    <div key={channel.id} className="channel-slider">
                        <div className={`channel-indicator ${channel.id}`}></div>
                        <SliderControl
                            label={channel.label}
                            min={-100}
                            max={100}
                            value={getVal(channel, activeTab)}
                            onChange={(val) => handleChange(channel, activeTab, val)}
                        />
                    </div>
                ))}
            </div>

            <style>{`
         .color-mixer {
            display: flex;
            flex-direction: column;
            gap: 12px;
         }
         .mixer-tabs {
            display: flex;
            gap: 2px;
            background: rgba(0,0,0,0.3);
            border-radius: 4px;
            padding: 2px;
         }
         .tab-btn {
            flex: 1;
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 10px;
            padding: 4px 0;
            cursor: pointer;
            border-radius: 2px;
         }
         .tab-btn.active {
            background: var(--text-primary);
            color: var(--bg-color);
            font-weight: 600;
         }
         
         .mixer-sliders {
            display: flex;
            flex-direction: column;
            gap: 12px;
         }
         
         .channel-slider {
            display: flex;
            gap: 8px;
            align-items: flex-end; /* Align with slider track */
         }
         
         .channel-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-bottom: 6px;
         }
         
         .channel-slider .slider-control {
            flex: 1;
         }
         
         .red { background: #ff4d4d; }
         .orange { background: #ffaa00; }
         .yellow { background: #ffff00; }
         .green { background: #00ff00; }
         .aqua { background: #00ffff; }
         .blue { background: #0000ff; }
         .purple { background: #aa00ff; }
         .magenta { background: #ff00ff; }
       `}</style>
        </div>
    );
}

export default ColorMixerPanel;
