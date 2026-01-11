import { useState, useRef, useEffect, useCallback } from 'react';
import { WebGLEngine } from '../engine/WebGLEngine';
import { RawLoader } from '../engine/RawLoader';

const INITIAL_ADJUSTMENTS = {
    exposure: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    temp: 0,
    tint: 0,
    vibrance: 0,
    saturation: 0,
    rotation: 0,
    distortion: 0,
    masks: [], // Array of { id, type: 'linear'|'radial', params: {}, adjustments: {} }
};

export function useEditor() {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const [originalImage, setOriginalImage] = useState(null);
    const [imageState, setImageState] = useState({
        url: null,
        width: 0,
        height: 0,
        name: 'Untitled',
    });

    // History Management
    const [history, setHistory] = useState([INITIAL_ADJUSTMENTS]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Advanced State (Not in simple history for now, or add it?)
    // Requirement says "Undo/Redo" should work for everything.
    // So Tone Curve should be in history.
    // Ideally we flatten it or keep it alongside.
    // Let's rely on standard adjustments object extended.

    // Derived current adjustments
    const adjustments = history[historyIndex];

    // Initialize Engine
    useEffect(() => {
        if (canvasRef.current && !engineRef.current) {
            engineRef.current = new WebGLEngine(canvasRef.current);
        }
    }, []);

    const loadImage = useCallback(async (file) => {
        if (!file) return;

        // Check file extension for RAW
        const ext = file.name.split('.').pop().toLowerCase();
        const isRaw = ['dng', 'cr2', 'nef', 'arw', 'raf', 'orf'].includes(ext);

        try {
            let loadResult;

            if (isRaw) {
                console.log("Loading RAW file...");
                loadResult = await RawLoader.load(file);
            } else {
                // Standard Image
                loadResult = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = new Image();
                        img.onload = () => {
                            resolve({
                                data: img,
                                width: img.width,
                                height: img.height,
                                metadata: {}
                            });
                        };
                        img.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                });
            }

            const { data, width, height, metadata } = loadResult;

            setImageState({
                url: isRaw ? null : (data.src || null),
                width,
                height,
                name: file.name,
                ...metadata
            });

            // Reset history
            setHistory([INITIAL_ADJUSTMENTS]);
            setHistoryIndex(0);

            if (engineRef.current) {
                engineRef.current.loadImage(data, width, height);
                engineRef.current.render(INITIAL_ADJUSTMENTS);
            }

        } catch (err) {
            console.error("Failed to load image", err);
            alert("Failed to load image: " + err.message);
        }
    }, []);

    const updateAdjustment = (key, value) => {
        const newAdj = { ...adjustments, [key]: value };

        // Add to history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAdj);

        if (newHistory.length > 50) newHistory.shift();

        setHistory(newHistory);
        // Correct index update
        setHistoryIndex(newHistory.length - 1);

        if (engineRef.current) {
            requestAnimationFrame(() => {
                // Check if key is 'toneCurve' (array) vs scalar
                if (key === 'toneCurve') {
                    engineRef.current.updateToneCurve(value);
                }
                // Handle masks update specially?
                // Engine needs to flatten it to uniforms.
                if (key === 'masks') {
                    // Engine handles it in render
                }
                engineRef.current.render(newAdj);
            });
        }
    };

    const addMask = (type) => {
        const newMask = {
            id: Date.now(),
            type,
            // Default params
            params: type === 'linear'
                ? { x: 0.5, y: 0.5, rotation: 0, feather: 0.1 }
                : { x: 0.5, y: 0.5, rx: 0.2, ry: 0.2, feather: 0.1 },
            adjustments: { exposure: 0, contrast: 0, saturation: 0 }
        };
        const currentMasks = adjustments.masks || [];
        updateAdjustment('masks', [...currentMasks, newMask]);
    };

    const updateMask = (id, subKey, val) => {
        // subKey: 'params.x' or 'adjustments.exposure'
        const currentMasks = adjustments.masks || [];
        const newMasks = currentMasks.map(m => {
            if (m.id === id) {
                const [cat, prop] = subKey.split('.');
                return { ...m, [cat]: { ...m[cat], [prop]: val } };
            }
            return m;
        });
        updateAdjustment('masks', newMasks);
    };

    const deleteMask = (id) => {
        const currentMasks = adjustments.masks || [];
        updateAdjustment('masks', currentMasks.filter(m => m.id !== id));
    };

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            const prevAdj = history[newIndex];
            if (engineRef.current) {
                if (prevAdj.toneCurve) engineRef.current.updateToneCurve(prevAdj.toneCurve);
                engineRef.current.render(prevAdj);
            }
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            const nextAdj = history[newIndex];
            if (engineRef.current) {
                if (nextAdj.toneCurve) engineRef.current.updateToneCurve(nextAdj.toneCurve);
                engineRef.current.render(nextAdj);
            }
        }
    };

    const toggleCompare = (isComparing) => {
        if (!engineRef.current) return;
        if (isComparing) {
            engineRef.current.render(INITIAL_ADJUSTMENTS);
        } else {
            engineRef.current.render(adjustments);
        }
    };

    const downloadImage = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = `adjusted_${imageState.name || 'photo'}.jpg`;
        // Use 0.95 quality for better retention
        link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
        link.click();
    };

    const reset = () => {
        setHistory([INITIAL_ADJUSTMENTS]);
        setHistoryIndex(0);
        if (engineRef.current) engineRef.current.render(INITIAL_ADJUSTMENTS);
    };

    const getHistogram = () => {
        if (engineRef.current) {
            return engineRef.current.getHistogramData();
        }
        return null;
    };

    return {
        canvasRef,
        imageState,
        adjustments,
        loadImage,
        updateAdjustment,
        addMask,
        updateMask,
        deleteMask,
        undo,
        redo,
        reset,
        getHistogram,
        historyIndex,
        historyLength: history.length,
        toggleCompare,
        downloadImage
    };
}
