"use client";
import * as React from "react";
import { ThemeSwitcher } from '@/components/theme-switcher';

interface OptionsSidebarProps {
    open: boolean;
    onClose: () => void;
    styleConfig: any;
    onStyleChange: (config: any) => void;
}

export default function OptionsSidebar({ open, onClose, styleConfig, onStyleChange }: OptionsSidebarProps) {
    return (
        <div
            className={`fixed top-0 right-0 h-full w-72 bg-background shadow-lg z-50 transition-transform duration-300 ease-in-out border-l border-border flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ minHeight: '100vh' }}
            aria-hidden={!open}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-semibold text-lg">Settings</span>
                <button
                    onClick={onClose}
                    className="rounded-full p-2 hover:bg-accent focus:outline-none focus:ring"
                    aria-label="Close sidebar"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M6 14L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
            </div>
            <div className="p-4">
                <div className="mb-4">
                    <span className="block mb-2 font-medium">Theme</span>
                    <ThemeSwitcher />
                </div>
                <div className="mb-4">
                    <span className="block mb-2 font-medium">Font Family</span>
                    <select
                        className="w-full border rounded p-2"
                        value={styleConfig.fontFamily || ''}
                        onChange={e => onStyleChange({ ...styleConfig, fontFamily: e.target.value })}
                    >
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="Times New Roman, serif">Times New Roman</option>
                        <option value="Courier New, monospace">Courier New</option>
                        <option value="">Default</option>
                    </select>
                </div>
                <div className="mb-4">
                    <span className="block mb-2 font-medium">Font Size</span>
                    <input
                        type="text"
                        className="w-full border rounded p-2"
                        value={styleConfig.fontSize || ''}
                        placeholder="e.g. 1.1rem"
                        onChange={e => onStyleChange({ ...styleConfig, fontSize: e.target.value })}
                    />
                </div>
                <div className="mb-4">
                    <span className="block mb-2 font-medium">Line Height</span>
                    <input
                        type="text"
                        className="w-full border rounded p-2"
                        value={styleConfig.lineHeight || ''}
                        placeholder="e.g. 1.5"
                        onChange={e => onStyleChange({ ...styleConfig, lineHeight: e.target.value })}
                    />
                </div>

            </div>
        </div>
    );
}
