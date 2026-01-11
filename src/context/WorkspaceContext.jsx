import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

const WorkspaceContext = createContext();

export function WorkspaceProvider({ children }) {
    const [mode, setMode] = useState('library'); // 'library', 'develop', 'print'
    const [activeImageId, setActiveImageId] = useState(null);
    const [selection, setSelection] = useState([]);

    // Load active image if ID is set
    const activeImage = useLiveQuery(
        () => (activeImageId ? db.images.get(activeImageId) : null),
        [activeImageId]
    );

    const openDevelop = (id) => {
        setActiveImageId(id);
        setMode('develop');
    };

    const openLibrary = () => {
        setMode('library');
        // Keep activeImageId? Optional.
    };

    const openPrint = () => {
        setMode('print');
    };

    const value = {
        mode,
        setMode,
        activeImageId,
        setActiveImageId,
        selection,
        setSelection,
        activeImage,
        openDevelop,
        openLibrary,
        openPrint
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    return useContext(WorkspaceContext);
}
