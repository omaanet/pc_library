"use client";
import * as React from "react";
import { RefreshCw } from 'lucide-react';
import { useTheme } from 'next-themes';

interface OptionsSidebarProps {
    open: boolean;
    onClose: () => void;
    styleConfig: any;
    onStyleChange: (config: any) => void;
}

// use client only: persisted values available immediately
export default function OptionsSidebar({ open, onClose, styleConfig, onStyleChange }: OptionsSidebarProps) {
    // Determine hover background based on current or system theme
    const { resolvedTheme } = useTheme();
    const effectiveTheme = styleConfig.theme === 'system' ? resolvedTheme : (styleConfig.theme || 'light');
    const btnHoverClass = effectiveTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200';

    return (
        <div
            className={`fixed z-[1010] top-0 right-0 h-full w-72 bg-background shadow-lg z-50 transition-transform duration-300 ease-in-out border-l border-border flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ minHeight: '100vh' }}
            aria-hidden={!open}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-semibold text-lg">Impostazioni</span>
                <button
                    onClick={onClose}
                    className="rounded-full p-2 hover:bg-accent focus:outline-none focus:ring"
                    aria-label="Chiudi impostazioni"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M6 14L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
            </div>
            <div className="p-4">
                <div className="mb-4">
                    <span className="block mb-2 font-medium">Tema</span>
                    <select
                        className="w-full border rounded p-2"
                        value={styleConfig.theme || 'light'}
                        onChange={e => onStyleChange({ ...styleConfig, theme: e.target.value })}
                    >
                        <option value="system">Sistema</option>
                        <option value="light">Chiaro</option>
                        <option value="dark">Scuro</option>
                        {/* <option value="sepia">Seppia</option> */}
                    </select>
                </div>
                <div className="mb-4">
                    <span className="block mb-2 font-medium">Famiglia carattere</span>
                    <select
                        className="w-full border rounded p-2"
                        value={styleConfig.fontFamily || ''}
                        onChange={e => onStyleChange({ ...styleConfig, fontFamily: e.target.value })}
                    >
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="Times New Roman, serif">Times New Roman</option>
                        <option value="Courier New, monospace">Courier New</option>
                        <option value="">Predefinito</option>
                    </select>
                </div>
                <div className="mb-4">
                    <span className="block mb-2 font-medium">Dimensione carattere</span>
                    <div className="flex items-center justify-start space-x-7">
                        <div className="flex items-center space-x-4">
                            <button
                                className={`border rounded w-8 h-8 flex items-center justify-center text-base ${btnHoverClass}`}
                                onClick={() => {
                                    const current = parseInt((styleConfig.fontSize || '100%').replace('%', '')) || 100;
                                    onStyleChange({ ...styleConfig, fontSize: `${current - 10}%` });
                                }}
                            >A-</button>
                            <span className="w-10 text-center text-base">{styleConfig.fontSize || '100%'}</span>
                            <button
                                className={`border rounded w-8 h-8 flex items-center justify-center text-base ${btnHoverClass}`}
                                onClick={() => {
                                    const current = parseInt((styleConfig.fontSize || '100%').replace('%', '')) || 100;
                                    onStyleChange({ ...styleConfig, fontSize: `${current + 10}%` });
                                }}
                            >A+</button>
                        </div>
                        <button
                            className={`border rounded w-8 h-8 flex items-center justify-center ${btnHoverClass}`}
                            onClick={() => onStyleChange({ ...styleConfig, fontSize: `100%` })}
                            aria-label="Reimposta dimensione carattere"
                        >
                            <RefreshCw className="text-base h-4 w-4" />
                        </button>
                    </div>
                </div>
                {/* Removed Line Height option block */}
            </div>
        </div>
    );
}
