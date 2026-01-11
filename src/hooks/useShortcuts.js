import { useEffect } from 'react';

export function useShortcuts({ onUndo, onRedo, onExport, onReset, onCompare }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Check for modifiers
            const cmd = e.metaKey || e.ctrlKey;
            const shift = e.shiftKey;

            // Undo: Cmd + Z
            if (cmd && !shift && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                onUndo();
            }

            // Redo: Cmd + Shift + Z
            if (cmd && shift && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                onRedo();
            }

            // Export: Cmd + Shift + E
            if (cmd && shift && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                onExport();
            }

            // Reset: Cmd + R (Only if allowed, risky due to browser refresh)
            // We will allow it but users need to be careful or we only bind if focused on canvas?
            // Browsers often lock Ctrl+R. Let's try Alt+R or just warn.
            if (cmd && e.key.toLowerCase() === 'r') {
                e.preventDefault();
                onReset();
            }

            // Compare: Backslash \
            if (e.key === '\\') {
                onCompare(true);
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === '\\') {
                onCompare(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [onUndo, onRedo, onExport, onReset, onCompare]);
}
