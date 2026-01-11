import { useEffect } from 'react';
import Header from '../Header';
import ToolsPanel from '../ToolsPanel';
import CanvasWorkspace from '../CanvasWorkspace';
import InfoPanel from '../InfoPanel';
import { useEditor } from '../../hooks/useEditor';
import { useShortcuts } from '../../hooks/useShortcuts';
import { useWorkspace } from '../../context/WorkspaceContext';

export default function DevelopView() {
    const { activeImage, openLibrary } = useWorkspace();
    const {
        canvasRef,
        imageState,
        adjustments,
        loadImage,
        updateAdjustment,
        undo,
        redo,
        toggleCompare,
        downloadImage,
        reset,
        addMask,
        updateMask,
        deleteMask,
        getHistogram
    } = useEditor();

    useShortcuts({
        onUndo: undo,
        onRedo: redo,
        onExport: downloadImage,
        onReset: reset,
        onCompare: toggleCompare
    });

    // Load image from Workspace Selection
    useEffect(() => {
        if (activeImage && activeImage.fileHandle) {
            // Async load
            (async () => {
                // If fileHandle is stored in DB, it might be a handle object.
                // Chrome stores handles.
                // We need to verify if query permission is needed.
                // For now assume we can access or user re-grants.
                try {
                    // If it's a File object (from memory in simple case), works directly.
                    // If it's a FileSystemFileHandle:
                    const handle = activeImage.fileHandle;
                    if (handle.getFile) {
                        const file = await handle.getFile();
                        loadImage(file);
                    } else if (handle instanceof File || handle instanceof Blob) {
                        loadImage(handle);
                    }
                } catch (e) {
                    console.error("Failed to load image from handle", e);
                }
            })();
        }
    }, [activeImage, loadImage]);

    return (
        <div className="app-container">
            <Header onDownload={downloadImage} />

            <main className="main-grid">
                <aside className="left-panel glass-panel">
                    <div className="panel-header"><h3>LIBRARY LINK</h3></div>
                    <button onClick={openLibrary} style={{
                        color: 'var(--text-primary)',
                        background: 'var(--panel-bg)',
                        border: '1px solid var(--panel-border)',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '4px'
                    }}>
                        <span>&larr; Back to Grid</span>
                    </button>
                    <div style={{ padding: '0 8px', color: '#666', fontStyle: 'italic', fontSize: '12px' }}>
                        History Browser Placeholder
                    </div>
                </aside>

                <section className="canvas-area">
                    <CanvasWorkspace
                        canvasRef={canvasRef}
                        image={imageState.url ? imageState : null}
                    />
                </section>

                <aside className="right-panel glass-panel">
                    <div style={{ padding: '16px', paddingBottom: '0', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0' }}>
                        <InfoPanel
                            metadata={imageState}
                            getHistogram={getHistogram}
                            trigger={adjustments}
                        />
                    </div>

                    <div style={{ flex: 1, overflow: 'hidden', padding: '16px', paddingTop: '0' }}>
                        <ToolsPanel
                            onUpload={loadImage}
                            onAdjustment={updateAdjustment}
                            values={adjustments}
                            onUndo={undo}
                            onRedo={redo}
                            onCompare={toggleCompare}
                            onAddMask={addMask}
                            onUpdateMask={updateMask}
                            onDeleteMask={deleteMask}
                        />
                    </div>
                </aside>
            </main>

            <style>{`
        .app-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
        }

        .main-grid {
          display: grid;
          grid-template-columns: var(--panel-width) 1fr var(--panel-width);
          flex: 1;
          height: calc(100vh - var(--header-height));
          position: relative;
          z-index: 10;
        }
        
        .left-panel, .right-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 20px;
          border-right: var(--glass-border);
        }

        .right-panel {
          border-left: var(--glass-border);
          border-right: none;
           overflow-y: hidden;
           padding: 0;
        }
        
        .canvas-area {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-color);
          position: relative;
          overflow: hidden;
        }
        
        .tools-container {
           height: 100%;
        }
      `}</style>
        </div>
    );
}
