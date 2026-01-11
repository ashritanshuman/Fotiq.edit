import React, { useState } from 'react';
import SliderControl from '../ui/SliderControl';

const MaskManagerPanel = ({ masks, onAdd, onUpdate, onDelete }) => {
    const [selectedMaskId, setSelectedMaskId] = useState(null);

    const selectedMask = masks.find(m => m.id === selectedMaskId);

    return (
        <div className="mask-manager">
            <div className="mask-list-header" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                    onClick={() => onAdd('linear')}
                    disabled={masks.filter(m => m.type === 'linear').length >= 3}
                    style={{ flex: 1, padding: '8px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    + Linear
                </button>
                <button
                    onClick={() => onAdd('radial')}
                    disabled={masks.filter(m => m.type === 'radial').length >= 3}
                    style={{ flex: 1, padding: '8px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    + Radial
                </button>
            </div>

            <div className="mask-list" style={{ marginBottom: '16px' }}>
                {/* The provided CSS classes are interpreted and applied here.
                    .mask-header-row and .invert-toggle are not directly used in the existing structure,
                    so they are added as a comment for context.
                    .mask-item.active is applied to the mask item div.
                */}
                {/*
                .mask-header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .invert-toggle {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 10px;
                    color: var(--text-secondary);
                    cursor: pointer;
                }
                */}
                {masks.map(mask => (
                    <div
                        key={mask.id}
                        onClick={() => setSelectedMaskId(mask.id)}
                        className={selectedMaskId === mask.id ? 'mask-item active' : 'mask-item'}
                        style={{
                            padding: '8px',
                            // The original inline background is replaced by the .active class style if active
                            background: selectedMaskId === mask.id ? styles.maskItemActive.background : '#222',
                            color: selectedMaskId === mask.id ? styles.maskItemActive.color : 'inherit',
                            marginBottom: '4px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <span>{mask.type === 'linear' ? 'Linear Gradient' : 'Radial Gradient'}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(mask.id); if (selectedMaskId === mask.id) setSelectedMaskId(null); }}
                            style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer' }}
                        >
                            ✕
                        </button>
                    </div>
                ))}
                {masks.length === 0 && <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>No masks active</div>}
            </div>

            {selectedMask && (
                <div className="mask-controls" style={{ borderTop: '1px solid #333', paddingTop: '16px' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#ccc' }}>Geometry</h4>
                    <SliderControl
                        label="Center X"
                        value={Math.round(selectedMask.params.x * 100)}
                        min={0} max={100}
                        onChange={(v) => onUpdate(selectedMask.id, 'params.x', v / 100)}
                    />
                    <SliderControl
                        label="Center Y"
                        value={Math.round(selectedMask.params.y * 100)}
                        min={0} max={100}
                        onChange={(v) => onUpdate(selectedMask.id, 'params.y', v / 100)}
                    />

                    {selectedMask.type === 'linear' && (
                        <SliderControl
                            label="Rotation"
                            value={selectedMask.params.rotation}
                            min={-180} max={180}
                            onChange={(v) => onUpdate(selectedMask.id, 'params.rotation', v)}
                        />
                    )}

                    {selectedMask.type === 'radial' && (
                        <>
                            <SliderControl
                                label="Radius X"
                                value={Math.round(selectedMask.params.rx * 100)}
                                min={1} max={100}
                                onChange={(v) => onUpdate(selectedMask.id, 'params.rx', v / 100)}
                            />
                            <SliderControl
                                label="Radius Y"
                                value={Math.round(selectedMask.params.ry * 100)}
                                min={1} max={100}
                                onChange={(v) => onUpdate(selectedMask.id, 'params.ry', v / 100)}
                            />
                        </>
                    )}

                    <SliderControl
                        label="Feather"
                        value={Math.round(selectedMask.params.feather * 100)}
                        min={0} max={100}
                        onChange={(v) => onUpdate(selectedMask.id, 'params.feather', v / 100)}
                    />

                    <h4 style={{ margin: '12px 0', color: '#ccc' }}>Mask Adjustments</h4>
                    <SliderControl
                        label="Exposure"
                        value={selectedMask.adjustments.exposure}
                        min={-100} max={100}
                        onChange={(v) => onUpdate(selectedMask.id, 'adjustments.exposure', v)}
                    />
                    <SliderControl
                        label="Contrast"
                        value={selectedMask.adjustments.contrast}
                        min={-100} max={100}
                        onChange={(v) => onUpdate(selectedMask.id, 'adjustments.contrast', v)}
                    />
                    <SliderControl
                        label="Saturation"
                        value={selectedMask.adjustments.saturation}
                        min={-100} max={100}
                        onChange={(v) => onUpdate(selectedMask.id, 'adjustments.saturation', v)}
                    />
                </div>
            )}
        </div>
    );
};

export default MaskManagerPanel;
