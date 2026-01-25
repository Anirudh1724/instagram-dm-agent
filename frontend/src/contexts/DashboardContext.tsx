import React, { createContext, useContext, useState, ReactNode } from 'react';

type AgentMode = 'text' | 'voice';

interface DashboardContextType {
    mode: AgentMode;
    setMode: (mode: AgentMode) => void;
    isLogoutConfirmOpen: boolean;
    setIsLogoutConfirmOpen: (open: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<AgentMode>('text');
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

    return (
        <DashboardContext.Provider value={{ mode, setMode, isLogoutConfirmOpen, setIsLogoutConfirmOpen }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
