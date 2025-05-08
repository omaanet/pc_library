"use client";

import { useEffect, useRef, useState } from "react";
import { Book } from "@/types";
import { useUserPreferences } from "@/hooks/use-user-preferences";

interface PageReaderProps {
    book: Book;
    bookId: string;
}

export default function PageReader({ book, bookId }: PageReaderProps) {
    // Configuration
    const CONFIG = {
        viewMode: "double" as "single" | "double", // 'single' or 'double'
        zoomLevel: 100, // percentage
        pageGap: 20, // distance between pages in double view mode (px)
        sidebarCollapsed: true, // whether sidebar starts collapsed (true) or expanded (false)
        imagePrefix: `read-book/${bookId}/pages/page-`,
        imageExt: "-or8.png",
        preloadBuffer: 3, // Number of pages to preload ahead and behind
    };

    // References to DOM elements
    const pagesContainerRef = useRef<HTMLDivElement>(null);
    const viewerContainerRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const sidebarOverlayRef = useRef<HTMLDivElement>(null);
    const toggleSidebarBtnRef = useRef<HTMLButtonElement>(null);

    // State variables
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<"single" | "double">(CONFIG.viewMode);
    const [zoomLevel, setZoomLevel] = useState(CONFIG.zoomLevel);
    const [imagesLoaded, setImagesLoaded] = useState<Record<number, string>>({});
    const [isDragging, setIsDragging] = useState(false);
    const [initialTranslateX, setInitialTranslateX] = useState(0);
    const [initialTranslateY, setInitialTranslateY] = useState(0);
    const [currentTranslateX, setCurrentTranslateX] = useState(0);
    const [currentTranslateY, setCurrentTranslateY] = useState(0);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragStartY, setDragStartY] = useState(0);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(CONFIG.sidebarCollapsed);
    const [isLoading, setIsLoading] = useState(false);

    // Get total pages from book data
    const totalPages = book.pagesCount || 10; // Default to 10 pages if not specified

    // User preferences
    const { preferences } = useUserPreferences();

    // Format page number with leading zeros based on total pages
    const formatPageNumber = (num: number) => {
        // Calculate the number of digits needed based on total pages
        const digits = totalPages.toString().length;
        return num.toString().padStart(digits, "0");
    };

    // Get image path for a specific page
    const getImagePath = (pageNum: number) => {
        return `/epub/${bookId}/pages/page-${formatPageNumber(pageNum)}${CONFIG.imageExt}`;
    };

    // Get visible pages based on current view mode and page number
    const getVisiblePages = () => {
        const visiblePages: number[] = [];

        if (viewMode === "single") {
            visiblePages.push(currentPage);
        } else {
            // Double page view
            // If current page is odd, show current page and next page
            // If current page is even, show previous page and current page
            if (currentPage % 2 === 1) {
                visiblePages.push(currentPage);
                if (currentPage + 1 <= totalPages) {
                    visiblePages.push(currentPage + 1);
                }
            } else {
                visiblePages.push(currentPage - 1);
                visiblePages.push(currentPage);
            }
        }

        return visiblePages;
    };

    // Get pages to preload
    const getPagesToPreload = () => {
        const visiblePages = getVisiblePages();
        const pagesToPreload: number[] = [];

        // Add pages before current page
        for (let i = 1; i <= CONFIG.preloadBuffer; i++) {
            const pageToPreload = currentPage - i;
            if (pageToPreload > 0 && !visiblePages.includes(pageToPreload)) {
                pagesToPreload.push(pageToPreload);
            }
        }

        // Add pages after current page
        for (let i = 1; i <= CONFIG.preloadBuffer; i++) {
            const pageToPreload = currentPage + i;
            if (pageToPreload <= totalPages && !visiblePages.includes(pageToPreload)) {
                pagesToPreload.push(pageToPreload);
            }
        }

        return pagesToPreload;
    };

    // Load image for a specific page with caching
    const loadImage = (pageNum: number) => {
        return new Promise<string>((resolve, reject) => {
            if (imagesLoaded[pageNum]) {
                resolve(imagesLoaded[pageNum]);
                return;
            }

            const img = new Image();

            img.onload = () => {
                setImagesLoaded((prev) => ({ ...prev, [pageNum]: img.src }));
                resolve(img.src);
            };

            img.onerror = () => {
                console.error(`Failed to load image for page ${pageNum}`);
                reject(new Error(`Failed to load image for page ${pageNum}`));
            };

            img.src = getImagePath(pageNum);
        });
    };

    // Lazy load images
    const lazyLoadImages = async () => {
        const visiblePages = getVisiblePages();
        const pagesToPreload = getPagesToPreload();

        // Show loading indicator
        setIsLoading(true);

        try {
            // Load all visible pages in parallel
            await Promise.all(visiblePages.map((pageNum) => loadImage(pageNum)));

            // Update display
            setIsLoading(false);

            // Preload additional pages in the background
            preloadImages(pagesToPreload);
        } catch (error) {
            console.error("Error loading visible images:", error);
            setIsLoading(false);
        }
    };

    // Preload images in the background
    const preloadImages = (pageNumbers: number[]) => {
        if (!pageNumbers.length) return;

        // Load one image at a time to avoid overwhelming the browser
        const pageNum = pageNumbers.shift();
        if (!pageNum) return;

        loadImage(pageNum)
            .then(() => {
                // Continue preloading the rest
                if (pageNumbers.length) {
                    setTimeout(() => preloadImages(pageNumbers), 100);
                }
            })
            .catch(() => {
                // On error, continue with the next image
                if (pageNumbers.length) {
                    setTimeout(() => preloadImages(pageNumbers), 100);
                }
            });
    };

    // Go to previous page
    const goToPrevPage = () => {
        if (currentPage > 1) {
            // Reset translation when changing page
            resetTranslation();

            if (viewMode === "single") {
                setCurrentPage((prev) => prev - 1);
            } else {
                // In double page mode, go back by 2 pages
                setCurrentPage((prev) => Math.max(1, prev - 2));
            }
        }
    };

    // Go to next page
    const goToNextPage = () => {
        if (currentPage < totalPages) {
            // Reset translation when changing page
            resetTranslation();

            if (viewMode === "single") {
                setCurrentPage((prev) => prev + 1);
            } else {
                // In double page mode, advance by 2 pages
                setCurrentPage((prev) => Math.min(totalPages, prev + 2));
            }
        }
    };

    // Set view mode (single or double)
    const setViewModeHandler = (mode: "single" | "double") => {
        if (viewMode === mode) return;

        setViewMode(mode);
        resetTranslation();

        // Adjust current page for double view (ensure we start on odd page)
        if (mode === "double" && currentPage % 2 === 0) {
            setCurrentPage((prev) => Math.max(1, prev - 1));
        }
    };

    // Reset translation to center
    const resetTranslation = () => {
        setCurrentTranslateX(0);
        setCurrentTranslateY(0);
        setInitialTranslateX(0);
        setInitialTranslateY(0);
    };

    // Adjust zoom level
    const adjustZoom = (amount: number, centerX?: number, centerY?: number) => {
        setZoomLevel((prevZoom) => {
            const oldZoom = prevZoom;
            const newZoom = Math.max(10, Math.min(300, oldZoom + amount));
            if (oldZoom === newZoom) return oldZoom;

            // If zooming with a specific center point (e.g., mouse position)
            if (centerX !== undefined && centerY !== undefined && viewerContainerRef.current) {
                const viewerRect = viewerContainerRef.current.getBoundingClientRect();
                const viewerCenterX = viewerRect.width / 2;
                const viewerCenterY = viewerRect.height / 2;
                const dx = centerX - viewerCenterX;
                const dy = centerY - viewerCenterY;
                setCurrentTranslateX((prevX) => (prevX + dx) * newZoom / oldZoom - dx);
                setCurrentTranslateY((prevY) => (prevY + dy) * newZoom / oldZoom - dy);
            }

            return newZoom;
        });
    };

    // Reset zoom to 100%
    const resetZoom = () => {
        setZoomLevel(100);
        resetTranslation();
    };

    // Toggle sidebar
    const toggleSidebar = () => {
        setIsSidebarCollapsed((prev) => !prev);
    };

    // Start drag
    const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
        // Prevent default behavior
        e.preventDefault();

        // Get initial position
        if ('clientX' in e) {
            setDragStartX(e.clientX);
            setDragStartY(e.clientY);
        } else if (e.touches && e.touches.length > 0) {
            setDragStartX(e.touches[0].clientX);
            setDragStartY(e.touches[0].clientY);
        }

        setInitialTranslateX(currentTranslateX);
        setInitialTranslateY(currentTranslateY);
        setIsDragging(true);

        // Update cursor style
        if (pagesContainerRef.current) {
            pagesContainerRef.current.style.cursor = 'grabbing';
        }
        document.body.style.userSelect = 'none';
    };

    // Handle drag
    const doDrag = (e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;

        // Prevent default behavior
        e.preventDefault();

        let clientX: number, clientY: number;

        if ('clientX' in e) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            return;
        }

        // Calculate new position
        const deltaX = clientX - dragStartX;
        const deltaY = clientY - dragStartY;

        setCurrentTranslateX(initialTranslateX + deltaX);
        setCurrentTranslateY(initialTranslateY + deltaY);
    };

    // End drag
    const endDrag = () => {
        if (!isDragging) return;

        setIsDragging(false);

        // Restore the grab cursor
        if (pagesContainerRef.current) {
            pagesContainerRef.current.style.cursor = 'grab';
        }
        document.body.style.userSelect = '';
    };

    // Handle wheel for zooming
    const handleWheel = (e: WheelEvent) => {
        // Check if CTRL key is pressed (for zoom)
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 10 : -10; // 10% zoom step
            adjustZoom(delta, e.clientX, e.clientY);
        }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
            goToPrevPage();
        } else if (e.key === 'ArrowRight') {
            goToNextPage();
        } else if (e.key === '+' || e.key === '=') {
            adjustZoom(10);
        } else if (e.key === '-') {
            adjustZoom(-10);
        } else if (e.key === '0') {
            resetZoom();
        }
    };

    // No need to fetch page count from API anymore
    // Using book.pagesCount directly

    // Initialize event listeners and load initial pages
    useEffect(() => {
        // Event listeners for drag handling
        const handleDocumentMouseMove = (e: MouseEvent) => doDrag(e);
        const handleDocumentTouchMove = (e: TouchEvent) => doDrag(e);
        const handleDocumentMouseUp = () => endDrag();
        const handleDocumentTouchEnd = () => endDrag();
        const handleDocumentKeyDown = (e: KeyboardEvent) => handleKeyDown(e);
        const handleViewerContainerWheel = (e: WheelEvent) => handleWheel(e);

        // Add event listeners
        document.addEventListener('mousemove', handleDocumentMouseMove);
        document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false });
        document.addEventListener('mouseup', handleDocumentMouseUp);
        document.addEventListener('touchend', handleDocumentTouchEnd);
        document.addEventListener('keydown', handleDocumentKeyDown);

        if (viewerContainerRef.current) {
            viewerContainerRef.current.addEventListener('wheel', handleViewerContainerWheel, { passive: false });
        }

        // Load initial pages
        lazyLoadImages();

        // Clean up
        return () => {
            document.removeEventListener('mousemove', handleDocumentMouseMove);
            document.removeEventListener('touchmove', handleDocumentTouchMove);
            document.removeEventListener('mouseup', handleDocumentMouseUp);
            document.removeEventListener('touchend', handleDocumentTouchEnd);
            document.removeEventListener('keydown', handleDocumentKeyDown);

            if (viewerContainerRef.current) {
                viewerContainerRef.current.removeEventListener('wheel', handleViewerContainerWheel);
            }
        };
    }, [isDragging, currentPage, viewMode]); // Re-run when these values change

    // Load images when page or view mode changes
    useEffect(() => {
        lazyLoadImages();
    }, [currentPage, viewMode]);

    // Apply transform style to container
    const getTransformStyle = () => {
        return {
            transform: `translate3d(${currentTranslateX}px, ${currentTranslateY}px, 0) scale(${zoomLevel / 100})`,
            transformOrigin: 'center center',
            transition: 'none',
        };
    };

    // Get sidebar style based on collapse state
    const getSidebarStyle = () => {
        return {
            transform: isSidebarCollapsed ? 'translateX(calc(100% - 20px))' : 'translateX(0)',
            opacity: isSidebarCollapsed ? 0.8 : 1,
            backgroundColor: isSidebarCollapsed ? 'rgba(255, 255, 255, 0.5)' : '#ffffff',
            boxShadow: isSidebarCollapsed ? 'none' : '2px 0 5px rgba(0, 0, 0, 0.1)',
            borderLeft: isSidebarCollapsed ? 'none' : '1px solid rgba(0, 0, 0, 0.5)',
        };
    };

    // Get toggle button icon style
    const getToggleIconStyle = () => {
        return {
            transform: isSidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
        };
    };

    // Get page info text
    const getPageInfoText = () => {
        const visiblePages = getVisiblePages();
        return viewMode === 'single'
            ? `Page ${visiblePages[0]} of ${totalPages}`
            : `Pages ${visiblePages.join('-')} of ${totalPages}`;
    };

    return (
        <div className="h-full w-full">
            {/* Sidebar Overlay */}
            <div
                ref={sidebarOverlayRef}
                className={`fixed top-0 left-0 w-full h-full bg-black/50 z-[9] ${!isSidebarCollapsed && window.innerWidth <= 768 ? 'block' : 'hidden'}`}
                onClick={toggleSidebar}
            ></div>

            {/* Sidebar */}
            <div
                ref={sidebarRef}
                className="fixed top-0 right-0 w-[250px] h-full bg-white z-[10] flex flex-col p-6 transition-transform duration-300 ease-in-out shadow-md"
                style={getSidebarStyle()}
            >
                <button
                    ref={toggleSidebarBtnRef}
                    className="absolute top-[62px] -left-[12px] w-[22px] h-[22px] rounded-full bg-blue-500/80 hover:bg-blue-500 flex justify-center items-center cursor-pointer shadow-sm border-none text-white p-0 z-[11] transform -translate-y-1/2 transition-colors"
                    onClick={toggleSidebar}
                    aria-label="Toggle sidebar"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-[14px] h-[14px] fill-white transition-transform duration-300 ease-in-out"
                        style={getToggleIconStyle()}
                    >
                        <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
                    </svg>
                </button>

                <h3 className="mb-5 pb-2.5 border-b border-gray-200">Settings</h3>

                <div className="mb-5 w-full">
                    <h3 className="mb-2.5 text-base">View Mode</h3>
                    <div className="flex justify-center w-full mt-2.5">
                        <div className="grid grid-cols-2 gap-0 w-full">
                            <button
                                className={`py-3 px-4 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white border-none rounded-l cursor-pointer transition-colors ${viewMode === 'single' ? 'bg-blue-600' : ''}`}
                                onClick={() => setViewModeHandler('single')}
                                title="Single Page View"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                </svg>
                            </button>
                            <button
                                className={`py-3 px-4 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white border-none rounded-r cursor-pointer transition-colors ${viewMode === 'double' ? 'bg-blue-600' : ''}`}
                                onClick={() => setViewModeHandler('double')}
                                title="Two Pages View"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 6h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-8" />
                                    <path d="M4 6h8v16H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mb-5 w-full">
                    <h3 className="mb-2.5 text-base">Zoom</h3>
                    <div className="flex justify-center w-full mt-2.5">
                        <div className="grid grid-cols-3 gap-0 w-full">
                            <button
                                className="py-3 px-4 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white border-none rounded-l cursor-pointer transition-colors"
                                onClick={() => adjustZoom(-10)}
                                title="Zoom Out"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    <line x1="8" y1="11" x2="14" y2="11"></line>
                                </svg>
                            </button>
                            <button
                                className="py-3 px-4 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white border-none cursor-pointer transition-colors"
                                onClick={resetZoom}
                                title="Reset Zoom"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </button>
                            <button
                                className="py-3 px-4 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white border-none rounded-r cursor-pointer transition-colors"
                                onClick={() => adjustZoom(10)}
                                title="Zoom In"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    <line x1="11" y1="8" x2="11" y2="14"></line>
                                    <line x1="8" y1="11" x2="14" y2="11"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content with image viewer - this div takes full screen height */}
            <div className="h-screen w-full flex flex-col relative bg-gray-100 text-gray-800">
                {/* Main Content Area - Centered both horizontally and vertically */}
                <div
                    ref={viewerContainerRef}
                    className="flex-1 flex justify-center items-center relative overflow-hidden touch-none"
                    onMouseDown={startDrag}
                    onTouchStart={startDrag}
                >
                    {/* Pages Container - centered horizontally and vertically */}
                    <div
                        ref={pagesContainerRef}
                        className={`flex justify-center items-center h-full cursor-grab transition-none transform-gpu ${viewMode === 'double' ? 'gap-5' : ''}`}
                        style={getTransformStyle()}
                    >
                        {/* Render Pages */}
                        {getVisiblePages().map((pageNum) => (
                            <div key={pageNum} className="h-full flex justify-center items-center p-5 select-none">
                                <img
                                    src={imagesLoaded[pageNum] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1.4"%3E%3C/svg%3E'}
                                    alt={`Page ${pageNum}`}
                                    className="max-h-full max-w-full object-contain shadow-md bg-white pointer-events-none select-none"
                                    draggable="false"
                                    data-page={pageNum}
                                />
                            </div>
                        ))}
                    </div>
                    {/* Navigation Buttons - centered vertically */}
                    <div className="absolute w-full flex justify-between px-5 top-1/2 transform -translate-y-1/2 z-[5] pointer-events-none">
                        <div
                            className={`w-[50px] h-[50px] rounded-full bg-white/80 hover:bg-white/90 flex justify-center items-center cursor-pointer shadow-md transition-transform hover:scale-110 opacity-80 pointer-events-auto ${currentPage <= 1 ? 'opacity-50 pointer-events-none' : ''}`}
                            onClick={goToPrevPage}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 fill-gray-800">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                            </svg>
                        </div>
                        <div
                            className={`w-[50px] h-[50px] rounded-full bg-white/80 hover:bg-white/90 flex justify-center items-center cursor-pointer shadow-md transition-transform hover:scale-110 opacity-80 pointer-events-auto ${currentPage >= totalPages ? 'opacity-50 pointer-events-none' : ''}`}
                            onClick={goToNextPage}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 fill-gray-800">
                                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Page Info */}
                <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-white/80 text-gray-800 py-2 px-4 rounded-full shadow-sm z-[5] pointer-events-none">
                    {getPageInfoText()}
                </div>

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white py-4 px-5 rounded z-[100]">
                        Loading...
                    </div>
                )}
            </div>
        </div>
    );
}
