// src/context/TripsContext.jsx  (updated — adds app:datasaved dispatch)
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { generateId } from "@/utils/imageHelpers";

const MEMORIES_STORAGE_KEY = "favorite_memories_v1";

function loadMemories() {
    try {
        const raw = localStorage.getItem(MEMORIES_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];

    } catch { return [];}
}

function saveMemories(memories) {
    try {
        localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(memories));
    } catch (err) {
        if (err.name === "QuotaExceededError") {
            throw new Error("Storage is full. Try removing some memories before adding new ones.");
        }
        throw err;
    }
}

function notifyDataSaved() {
    window.dispatchEvent(new CustomEvent("app:datasaved"))
}

const MemoriesContext = createContext(null);



export function MemoriesProvider({ children }) {
    const [memories,      setMemories] = useState([]);
    const [loading,       setLoading]   = useState(true);
    const [error,         setError]     = useState(null);

    useEffect(() => {
        try { setMemories(loadMemories()); }
        catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    const addMemory = useCallback((memoryData) => {
        const memory = { ...memoryData, id: memoryData.id || generateId() };
        setMemories(prev => {
            const updated = [...prev, memory];
            saveMemories(updated);
            notifyDataSaved();
            return updated;
        });
        return memory;
    }, []);

    const updateMemory = useCallback((updatedMemory) => {
        if (!updatedMemory.id) return;
        setMemories(prev => {
            const updated = prev.map(m => m.id === updatedMemory.id ? {...m, ...updatedMemory } :m);
            saveMemories(updated);
            notifyDataSaved();
            return updated;
        });
    }, []);

    const deleteMemory = useCallback((id) => {
        setMemories(prev => {
            const updated = prev.filter(m => m.id !== id);
            saveMemories(updated);
            notifyDataSaved();
            return updated;
        });
    }, []);

    return (
        <MemoriesContext.Provider value={{ memories, loading, error, addMemory, updateMemory, deleteMemory }}>
            {children}
        </MemoriesContext.Provider>
    );

}

export function useMemories() {
    const ctx = useContext(MemoriesContext);
    if (!ctx) throw new Error("useMemories must be used inside <MemoriesProvider>");
    return ctx;
}