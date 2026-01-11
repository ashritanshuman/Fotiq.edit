import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addImageToCatalog } from '../../db/db';
import { useWorkspace } from '../../context/WorkspaceContext';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { FixedSizeGrid } from 'react-window';
import { Upload, Image as ImageIcon } from 'lucide-react';
import LibrarySidebar from './LibrarySidebar';

const Thumbnail = ({ columnIndex, rowIndex, style, items, onSelect, activeId, columnCount }) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= items.length) return null;

    const item = items[index];
    const isSelected = activeId === item.id;

    return (
        <div style={{ ...style, padding: '8px' }}>
            <div
                className={`thumb-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelect(item.id)}
                onDoubleClick={() => onSelect(item.id, true)}
            >
                <div className="thumb-preview">
                    <ImageIcon size={32} color="#666" />
                </div>
                <div className="thumb-name">{item.name}</div>
            </div>
        </div>
    );
};

export default function LibraryView() {
    const { openDevelop, openPrint, selection, setSelection } = useWorkspace();
    const [filters, setFilters] = useState({ search: '', minRating: 0 });
    const fileInputRef = useRef(null);

    const images = useLiveQuery(async () => {
        let collection = db.images.orderBy('dateAdded').reverse();

        if (filters.minRating > 0) {
            // Dexie filtering
            collection = collection.filter(img => img.rating >= filters.minRating);
        }

        let results = await collection.toArray();

        if (filters.search) {
            const lower = filters.search.toLowerCase();
            results = results.filter(img => img.name.toLowerCase().includes(lower));
        }

        return results;
    }, [filters]) || [];

    const columnCount = 4;

    const handleSelect = (id, enter = false) => {
        setSelection([id]);
        if (enter) {
            openDevelop(id);
        }
    };

    const handleFilterChange = (key, val) => {
        setFilters(prev => ({ ...prev, [key]: val }));
    };

    const handleImportClick = async () => {
        if (window.showOpenFilePicker) {
            try {
                const handles = await window.showOpenFilePicker({
                    multiple: true,
                    types: [{
                        description: 'Images',
                        accept: {
                            'image/*': ['.png', '.gif', '.jpeg', '.jpg', '.webp'],
                            'image/x-adobe-dng': ['.dng'],
                            'image/x-canon-cr2': ['.cr2'],
                            'image/x-nikon-nef': ['.nef']
                        }
                    }]
                });

                for (const handle of handles) {
                    await addImageToCatalog(handle);
                }
            } catch (err) {
                console.error('Import cancelled or failed', err);
            }
        } else {
            // Fallback for Mobile/Firefox
            fileInputRef.current?.click();
        }
    };

    const handleFileInputChange = async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
            await addImageToCatalog(file);
        }
        e.target.value = '';
    };

    return (
        <div className="library-container">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                multiple
                accept="image/*,.dng,.cr2,.nef"
                style={{ display: 'none' }}
            />
            <div className="library-main">
                <div className="library-toolbar">
                    <button className="btn-primary" onClick={handleImportClick} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Upload size={16} />
                        <span>IMPORT</span>
                    </button>

                    <div className="divider" style={{ width: 1, height: 20, background: '#444', margin: '0 16px' }}></div>

                    <button className="btn-secondary" onClick={() => selection.length > 0 ? openPrint() : alert("Select images to print")} disabled={selection.length === 0}>
                        PRINT
                    </button>
                    <button className="btn-secondary" onClick={() => selection.length > 0 ? alert("Batch Export Started (Console)") : alert("Select images")} disabled={selection.length === 0}>
                        BATCH EXPORT
                    </button>

                    <span className="stats" style={{ marginLeft: 'auto', fontSize: '12px', color: '#888' }}>
                        {images.length} Photos
                    </span>
                </div>

                <div className="library-grid-area">
                    <AutoSizer>
                        {({ height, width }) => {
                            const effectiveWidth = width || 800;
                            const effectiveHeight = height || 600;
                            const columnWidth = effectiveWidth / columnCount;
                            const rowCount = Math.ceil(images.length / columnCount);
                            return (
                                <FixedSizeGrid
                                    columnCount={columnCount}
                                    columnWidth={columnWidth}
                                    height={effectiveHeight}
                                    rowCount={rowCount}
                                    rowHeight={200}
                                    width={effectiveWidth}
                                >
                                    {({ columnIndex, rowIndex, style }) => (
                                        <Thumbnail
                                            columnIndex={columnIndex}
                                            rowIndex={rowIndex}
                                            style={style}
                                            items={images}
                                            onSelect={handleSelect}
                                            activeId={selection[0]}
                                            columnCount={columnCount}
                                        />
                                    )}
                                </FixedSizeGrid>
                            );
                        }}
                    </AutoSizer>
                </div>
            </div>

            <LibrarySidebar
                selection={selection}
                activeFilters={filters}
                onFilterChange={handleFilterChange}
            />

            <style>{`
                .library-container {
                    display: flex;
                    height: 100vh;
                    background: var(--bg-color);
                    overflow: hidden;
                }
                .library-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .library-toolbar {
                    padding: 16px;
                    border-bottom: 1px solid var(--panel-border);
                    display: flex;
                    align-items: center;
                    background: var(--panel-bg);
                }
                .library-grid-area {
                    flex: 1;
                    padding: 16px;
                }
                .thumb-card {
                    height: 100%;
                    background: #222;
                    border-radius: 6px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    border: 1px solid transparent;
                    transition: border 0.1s, background 0.1s;
                }
                .thumb-card:hover {
                    background: #2a2a2a;
                }
                .thumb-card.selected {
                    border-color: var(--accent-color);
                }
                .thumb-name {
                    margin-top: 8px;
                    font-size: 11px;
                    color: #aaa;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 90%;
                    text-align: center;
                }
            `}</style>
        </div>
    );
}
