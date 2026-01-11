import React, { useState, useEffect } from 'react';
import { db } from '../../db/db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function LibrarySidebar({ selection = [], onFilterChange, activeFilters }) {
    // If single selection, load metadata
    const activeId = selection.length === 1 ? selection[0] : null;
    const activeItem = useLiveQuery(
        () => (activeId ? db.images.get(activeId) : null),
        [activeId]
    );

    const [metaInputs, setMetaInputs] = useState({});

    useEffect(() => {
        if (activeItem) {
            setMetaInputs({
                title: activeItem.name,
                description: activeItem.metadata?.description || '',
                copyright: activeItem.metadata?.copyright || '',
                rating: activeItem.rating || 0
            });
        } else {
            setMetaInputs({});
        }
    }, [activeItem]);

    const handleMetaChange = (key, value) => {
        setMetaInputs(prev => ({ ...prev, [key]: value }));
    };

    const saveMetadata = async () => {
        if (!activeId) return;
        await db.images.update(activeId, {
            name: metaInputs.title,
            rating: parseInt(metaInputs.rating) || 0,
            'metadata.description': metaInputs.description,
            'metadata.copyright': metaInputs.copyright
        });
    };

    return (
        <div className="library-sidebar glass-panel">
            <div className="panel-section">
                <h3>SEARCH & FILTER</h3>
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={activeFilters.search}
                    onChange={(e) => onFilterChange('search', e.target.value)}
                    className="search-input"
                />

                <div className="filter-group">
                    <label>Rating &ge;</label>
                    <div className="rating-picker">
                        {[0, 1, 2, 3, 4, 5].map(r => (
                            <span
                                key={r}
                                className={activeFilters.minRating === r ? 'active' : ''}
                                onClick={() => onFilterChange('minRating', r)}
                            >
                                {r === 0 ? 'All' : r}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {selection.length > 0 ? (
                <div className="panel-section">
                    <h3>METADATA ({selection.length} Selected)</h3>
                    {activeItem ? (
                        <div className="metadata-form">
                            <div className="form-group">
                                <label>File Name</label>
                                <input value={metaInputs.title || ''} onChange={e => handleMetaChange('title', e.target.value)} onBlur={saveMetadata} />
                            </div>
                            <div className="form-group">
                                <label>Rating</label>
                                <input type="number" min="0" max="5" value={metaInputs.rating || 0} onChange={e => handleMetaChange('rating', e.target.value)} onBlur={saveMetadata} />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea value={metaInputs.description || ''} onChange={e => handleMetaChange('description', e.target.value)} onBlur={saveMetadata} />
                            </div>
                            <div className="form-group">
                                <label>Copyright</label>
                                <input value={metaInputs.copyright || ''} onChange={e => handleMetaChange('copyright', e.target.value)} onBlur={saveMetadata} />
                            </div>
                            <div className="form-group">
                                <label>Info</label>
                                <div className="info-readout">
                                    {activeItem.width && `${activeItem.width}x${activeItem.height}`} <br />
                                    {new Date(activeItem.dateAdded).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">Multi-edit not supported yet</div>
                    )}
                </div>
            ) : (
                <div className="panel-section">
                    <div className="empty-state">Select an image to view metadata</div>
                </div>
            )}

            <style>{`
                .library-sidebar {
                    width: 300px;
                    border-left: var(--glass-border);
                    display: flex;
                    flex-direction: column;
                    background: var(--panel-bg);
                }
                .panel-section {
                    padding: 16px;
                    border-bottom: 1px solid var(--panel-border);
                }
                .panel-section h3 {
                    font-size: 11px;
                    color: var(--text-secondary);
                    margin-bottom: 12px;
                    letter-spacing: 0.05em;
                }
                .search-input {
                    width: 100%;
                    padding: 8px;
                    background: #222;
                    border: 1px solid #444;
                    color: white;
                    border-radius: 4px;
                    margin-bottom: 12px;
                }
                .filter-group {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 11px;
                }
                .rating-picker {
                    display: flex;
                    gap: 4px;
                }
                .rating-picker span {
                    cursor: pointer;
                    padding: 2px 6px;
                    border-radius: 2px;
                    background: #333;
                    color: #888;
                }
                .rating-picker span.active {
                    background: var(--accent-color);
                    color: white;
                }
                .form-group {
                    margin-bottom: 12px;
                }
                .form-group label {
                    display: block;
                    font-size: 10px;
                    color: #888;
                    margin-bottom: 4px;
                }
                .form-group input, .form-group textarea {
                    width: 100%;
                    background: #222;
                    border: 1px solid #333;
                    color: #ddd;
                    padding: 6px;
                    font-size: 12px;
                    border-radius: 4px;
                }
                .form-group textarea {
                    resize: vertical;
                    height: 60px;
                }
                .info-readout {
                    font-size: 11px;
                    color: #666;
                    font-family: monospace;
                }
                .empty-state {
                    color: #666;
                    font-style: italic;
                    font-size: 12px;
                    text-align: center;
                    padding: 20px 0;
                }
            `}</style>
        </div>
    );
}
