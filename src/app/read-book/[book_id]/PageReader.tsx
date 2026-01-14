"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Minimize, ChevronLeft, ChevronRight, Fullscreen } from "lucide-react";
import { Book } from "@/types";
import { User } from "@/types";
import { useLogger } from '@/lib/logging';
import { 
    useReaderPreferences,
    useSetViewMode,
    useSetZoomLevel
} from '@/stores/preferences-store';

interface PageReaderProps {
    book: Book;
    bookId: string;
    user: User;
}

export default function PageReader({ book, bookId, user }: PageReaderProps) {
    const source = 'PageReader';
    const logger = useLogger(source);
    
    // Get reader preferences from Zustand store
    const readerPrefs = useReaderPreferences();
    const setViewMode = useSetViewMode();
    const setZoomLevel = useSetZoomLevel();
    
    // Configuration - use values from store as defaults
    const CONFIG = {
        viewMode: readerPrefs.viewMode || "double" as "single" | "double",
        zoomLevel: (readerPrefs.zoomLevel || 1.0) * 100,
        pageStart: 1,
        pageGap: 5,
        sidebarCollapsed: true,
        imagePrefix: undefined,
        sourceCDN: `https://s3.eu-south-1.wasabisys.com/piero-audiolibri/bookshelf/${bookId}/pages/page-`,
        imageExt: "-or8.png",
        preloadBuffer: 4,
    };

    // References to DOM elements
    const pagesContainerRef = useRef<HTMLDivElement>(null);
    const viewerContainerRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const sidebarOverlayRef = useRef<HTMLDivElement>(null);
    const toggleSidebarBtnRef = useRef<HTMLButtonElement>(null);

    // State variables - sync with store
    const [currentPage, setCurrentPage] = useState(Math.max(1, CONFIG.pageStart ?? 1));
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [imagesLoaded, setImagesLoaded] = useState<Record<number, string>>({});
    const [imagesFailed, setImagesFailed] = useState<Record<number, boolean>>({});
    const [isDragging, setIsDragging] = useState(false);
    const [initialTranslateX, setInitialTranslateX] = useState(0);
    const [initialTranslateY, setInitialTranslateY] = useState(0);
    const [currentTranslateX, setCurrentTranslateX] = useState(0);
    const [currentTranslateY, setCurrentTranslateY] = useState(0);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragStartY, setDragStartY] = useState(0);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(CONFIG.sidebarCollapsed);
    const [isLoading, setIsLoading] = useState(true);
    const [visiblePages, setVisiblePages] = useState<number[]>([]);
    const pinchInitialDistance = useRef<number | null>(null);
    const pinchInitialZoom = useRef<number>((readerPrefs.zoomLevel || 1.0) * 100);
    const lastTapTime = useRef<number>(0);
    const pinchInitialMidpoint = useRef<{ x: number; y: number } | null>(null);
    const pinchInitialTranslate = useRef<{ x: number; y: number } | null>(null);

    // Update store when viewMode changes
    const handleViewModeChange = useCallback((newMode: 'single' | 'double') => {
        setViewMode(newMode);
        resetTranslation();

        // Adjust current page for double view (ensure we start on odd page)
        if (newMode === "double" && currentPage % 2 === 0) {
            setCurrentPage((prev) => Math.max(1, prev - 1));
        }

        // Add transition effect
        if (pagesContainerRef.current) {
            pagesContainerRef.current.style.transition = 'opacity 0.2s ease-in-out';
            pagesContainerRef.current.style.opacity = '0';
            setTimeout(() => {
                if (pagesContainerRef.current) {
                    pagesContainerRef.current.style.opacity = '1';
                    setTimeout(() => {
                        if (pagesContainerRef.current) {
                            pagesContainerRef.current.style.transition = 'none';
                        }
                    }, 220);
                }
            }, 20);
        }
    }, [setViewMode, currentPage]);

    // Update store when zoomLevel changes
    const handleZoomLevelChange = useCallback((newZoom: number) => {
        setZoomLevel(newZoom / 100);
    }, [setZoomLevel]);
    const totalPages = book.pagesCount || 10; // Default to 10 pages if not specified

    // Format page number with leading zeros based on total pages
    const formatPageNumber = (num: number) => {
        // Calculate the number of digits needed based on total pages
        const digits = totalPages.toString().length;
        return num.toString().padStart(digits, "0");
    };

    // Get image path for a specific page
    const getImagePath = (pageNum: number) => {
        // Add anti-cache query param using current time (updates on every request)
        const antiCache = `?t=${Date.now()}`;
        return `${CONFIG.sourceCDN ?? CONFIG.imagePrefix}${formatPageNumber(pageNum)}${CONFIG.imageExt}${antiCache}`;
    };

    // Get visible pages based on current view mode and page number
    const getVisiblePages = () => {
        const visiblePages: number[] = [];

        if (readerPrefs.viewMode === "single") {
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

            // If we already know this image failed, resolve with placeholder immediately
            if (imagesFailed[pageNum]) {
                resolve('failed');
                return;
            }

            const img = new Image();

            img.onload = () => {
                setImagesLoaded((prev) => ({ ...prev, [pageNum]: img.src }));
                setImagesFailed((prev) => ({ ...prev, [pageNum]: false }));
                resolve(img.src);
            };

            img.onerror = () => {
                logger.warning(`Failed to load image for page ${pageNum}`, {
                    pageNum,
                    bookId,
                    imagePath: getImagePath(pageNum)
                });
                // Mark image as failed and resolve (don't reject) to prevent breaking the flow
                setImagesFailed((prev) => ({ ...prev, [pageNum]: true }));
                resolve('failed');
            };

            img.src = getImagePath(pageNum);
        });
    };

    // Lazy load images
    const lazyLoadImages = async () => {
        const newVisiblePages = getVisiblePages();
        const pagesToPreload = getPagesToPreload();

        // Show loading indicator
        setIsLoading(true);

        try {
            // Load all visible pages in parallel (now resolves even on failure)
            await Promise.all(newVisiblePages.map((pageNum) => loadImage(pageNum)));

            // Update visible pages (will show placeholders for failed images)
            setVisiblePages(newVisiblePages);

            // Preload additional pages in the background
            preloadImages(pagesToPreload);
        } catch (error) {
            // This should rarely happen now since loadImage resolves on error
            logger.error("Unexpected error loading visible images", { error });
            // Still show pages
            setVisiblePages(newVisiblePages);
        } finally {
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
    const goToPrevPage = (e?: React.MouseEvent | React.TouchEvent) => {
        // Stop event propagation to prevent panning/zooming
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        if (currentPage <= 1) return; // Already at first page

        // Add page transition effect
        if (pagesContainerRef.current) {
            pagesContainerRef.current.style.transition = 'transform 0.3s ease-in-out';
            // Reset transition after animation completes
            setTimeout(() => {
                if (pagesContainerRef.current) {
                    pagesContainerRef.current.style.transition = 'none';
                }
            }, 300);
        }

        // Update page after a small delay to allow for animation
        setTimeout(() => {
            if (readerPrefs.viewMode === "single") {
                setCurrentPage((prev) => prev - 1);
            } else {
                // In double page mode, go back by 2 pages
                setCurrentPage((prev) => Math.max(1, prev - 2));
            }
        }, 10);
    };

    // Go to next page
    const goToNextPage = (e?: React.MouseEvent | React.TouchEvent) => {
        // Stop event propagation to prevent panning/zooming
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        if (currentPage >= totalPages) return; // Already at last page

        // Add page transition effect
        if (pagesContainerRef.current) {
            pagesContainerRef.current.style.transition = 'transform 0.3s ease-in-out';
            // Reset transition after animation completes
            setTimeout(() => {
                if (pagesContainerRef.current) {
                    pagesContainerRef.current.style.transition = 'none';
                }
            }, 300);
        }

        // Update page after a small delay to allow for animation
        setTimeout(() => {
            if (readerPrefs.viewMode === "single") {
                setCurrentPage((prev) => prev + 1);
            } else {
                // In double page mode, advance by 2 pages
                setCurrentPage((prev) => Math.min(totalPages, prev + 2));
            }
        }, 10);
    };

    // Set view mode (single or double)
    const setViewModeHandler = (mode: "single" | "double") => {
        if (readerPrefs.viewMode === mode) return;

        handleViewModeChange(mode);
    };

    // Reset translation to center
    const resetTranslation = () => {
        setCurrentTranslateX(0);
        setCurrentTranslateY(0);
        setInitialTranslateX(0);
        setInitialTranslateY(0);
    };

    // Adjust zoom level with smooth transitions
    const adjustZoom = (amount: number) => {
        // Add smooth transition when zooming (except on pinch)
        if (pagesContainerRef.current) {
            pagesContainerRef.current.style.transition = 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)';
            // Remove transition after animation completes
            setTimeout(() => {
                if (pagesContainerRef.current) {
                    pagesContainerRef.current.style.transition = 'none';
                }
            }, 220); // Slightly shorter than animation to ensure it completes
        }

        const newZoom = Math.max(10, Math.min(300, (readerPrefs.zoomLevel || 1.0) * 100 + amount));
        handleZoomLevelChange(newZoom);
    };

    // Reset zoom to 100% and recenter with smooth transition
    const resetZoom = () => {
        // Add smooth transition
        if (pagesContainerRef.current) {
            pagesContainerRef.current.style.transition = 'transform 0.3s ease-out';
            // Remove transition after animation completes
            setTimeout(() => {
                if (pagesContainerRef.current) {
                    pagesContainerRef.current.style.transition = 'none';
                }
            }, 350);
        }

        handleZoomLevelChange(100 * 100);
        setCurrentTranslateX(0);
        setCurrentTranslateY(0);
    };

    // Alias for consistency
    const resetZoomCenter = resetZoom;

    // Toggle fullscreen
    const toggleFullscreen = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }

        // Haptic feedback on mobile
        if (navigator.vibrate) {
            navigator.vibrate(20);
        }
    }, []);

    // Toggle sidebar
    const toggleSidebar = (e?: React.MouseEvent | React.TouchEvent) => {
        // Stop event propagation to prevent panning/zooming
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        // Play a subtle haptic feedback on mobile if available
        if (navigator.vibrate) {
            navigator.vibrate(40);
        }

        setIsSidebarCollapsed((prev) => !prev);
    };

    // Start drag
    const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
        // Check if the event originated from a navigation control
        // If it's coming from a navigation control, don't start dragging
        const target = e.target as HTMLElement;
        if (target.closest('.pointer-events-auto')) {
            // Don't start dragging when clicking navigation controls
            return;
        }

        // Handle pinch start
        if ('touches' in e && e.touches.length >= 2) {
            const [t1, t2] = [e.touches[0], e.touches[1]];
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            pinchInitialDistance.current = dist;
            pinchInitialZoom.current = readerPrefs.zoomLevel;

            // Calculate and store initial midpoint and translation for pinch origin
            const initialMidX = (t1.clientX + t2.clientX) / 2;
            const initialMidY = (t1.clientY + t2.clientY) / 2;
            pinchInitialMidpoint.current = { x: initialMidX, y: initialMidY };
            pinchInitialTranslate.current = { x: currentTranslateX, y: currentTranslateY };

            setIsDragging(true); // Enable doDrag for pinch
            return; // Prevent single-touch drag logic
        }

        // Prevent default behavior for single touch/mouse drag start if needed
        // e.preventDefault(); // Currently commented, evaluate if needed

        // Get initial position for single touch/mouse drag
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

        // Check if the event originated from a navigation control
        const target = e.target as HTMLElement;
        if (target.closest('.pointer-events-auto')) {
            // Don't continue dragging when interacting with navigation controls
            endDrag();
            return;
        }

        // Pinch to zoom
        if ('touches' in e && e.touches.length >= 2 && pinchInitialDistance.current !== null && pinchInitialMidpoint.current && pinchInitialTranslate.current && pinchInitialZoom.current !== null) {
            e.preventDefault(); // Prevent browser default actions during pinch
            const [t1, t2] = [e.touches[0], e.touches[1]];
            const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            const scaleFactor = currentDist / pinchInitialDistance.current;

            const newZoomLevel = Math.max(10, Math.min(300, pinchInitialZoom.current * scaleFactor));
            handleZoomLevelChange(newZoomLevel);

            // Calculate current midpoint
            const currentMidX = (t1.clientX + t2.clientX) / 2;
            const currentMidY = (t1.clientY + t2.clientY) / 2;

            // Adjust translation to keep content under pinch midpoint stable
            const zoomRatio = newZoomLevel / pinchInitialZoom.current;
            const newTranslateX = currentMidX - (pinchInitialMidpoint.current.x - pinchInitialTranslate.current.x) * zoomRatio;
            const newTranslateY = currentMidY - (pinchInitialMidpoint.current.y - pinchInitialTranslate.current.y) * zoomRatio;

            setCurrentTranslateX(newTranslateX);
            setCurrentTranslateY(newTranslateY);
            return; // Pinch handled
        }

        // Panning logic (single touch or mouse)
        if ('touches' in e) {
            e.preventDefault(); // Prevent browser default actions during touch pan
        }

        let clientX: number, clientY: number;

        if ('clientX' in e) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.touches && e.touches.length > 0) { // Should be 1 touch if it reaches here
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            return; // No relevant event data / or more than 1 touch but not pinch-ready
        }

        // Calculate new position for panning
        const deltaX = clientX - dragStartX;
        const deltaY = clientY - dragStartY;

        setCurrentTranslateX(initialTranslateX + deltaX);
        setCurrentTranslateY(initialTranslateY + deltaY);
    };

    // End drag
    const endDrag = () => {
        if (!isDragging) return;
        setIsDragging(false);

        // Reset pinch-specific states
        pinchInitialDistance.current = null;
        // pinchInitialZoom.current is the new base zoom, no need to reset to CONFIG default here.
        pinchInitialMidpoint.current = null;
        pinchInitialTranslate.current = null;

        // Update cursor style
        if (pagesContainerRef.current) {
            pagesContainerRef.current.style.cursor = 'grab';
        }
        document.body.style.userSelect = '';
    };

    // Handle wheel for zooming
    const handleWheel = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();

            // Throttle wheel events for smoother zoom
            if (!isWheelThrottled.current) {
                isWheelThrottled.current = true;

                // Apply zoom based on wheel direction
                const delta = e.deltaY < 0 ? 10 : -10; // 10% zoom step
                adjustZoom(delta);

                // Reset throttle after short delay (60fps = ~16ms)
                setTimeout(() => {
                    isWheelThrottled.current = false;
                }, 16);
            }
        }
    };

    // Handle keyboard navigation and zoom controls
    const handleKeyDown = (e: KeyboardEvent) => {
        // Don't handle events when text inputs are focused
        const activeElement = document.activeElement as HTMLElement;
        if (
            activeElement &&
            (activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable)
        ) {
            return;
        }

        // Handle keyboard zoom controls (+ and - keys with or without CTRL)
        if (e.key === '+' || (e.key === 'ArrowUp' && e.ctrlKey)) {
            e.preventDefault();
            adjustZoom(10); // Zoom in by 10%
            return;
        }

        if (e.key === '-' || (e.key === 'ArrowDown' && e.ctrlKey)) {
            e.preventDefault();
            adjustZoom(-10); // Zoom out by 10%
            return;
        }

        if (e.key === '0' || (e.key === '0' && e.ctrlKey)) {
            e.preventDefault();
            resetZoom(); // Reset zoom to 100%
            return;
        }

        // Give navigation priority by stopping propagation and preventing default
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.stopPropagation();
            e.preventDefault();

            if (e.key === 'ArrowLeft') goToPrevPage();
            else if (e.key === 'ArrowRight') goToNextPage();
        }
    };

    // Handle double-tap to reset zoom on touch
    const handleDoubleTap = (e: React.TouchEvent) => {
        e.preventDefault();
        const now = Date.now();
        if (now - lastTapTime.current < 300) resetZoomCenter();
        lastTapTime.current = now;
    };

    // No need to fetch page count from API anymore
    // Using book.pagesCount directly

    // Performance optimization for wheel event
    const isWheelThrottled = useRef<boolean>(false);

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
    }, [isDragging, currentPage, readerPrefs.viewMode, readerPrefs.zoomLevel]); // Re-run when these values change

    // Load images when page or view mode changes
    useEffect(() => {
        lazyLoadImages();
    }, [currentPage, readerPrefs.viewMode]);

    // Apply transform style to container
    const getTransformStyle = () => {
        return {
            transform: `translate3d(${currentTranslateX}px, ${currentTranslateY}px, 0) scale(${readerPrefs.zoomLevel})`,
            transformOrigin: 'center center',
            // Transition applied directly in the adjustZoom function when needed
        };
    };

    // Get sidebar style based on collapse state
    const getSidebarStyle = () => {
        return {
            transform: isSidebarCollapsed ? 'translateX(calc(100% - 10px))' : 'translateX(0)',
            opacity: isSidebarCollapsed ? 0.75 : 1,
            backgroundColor: isSidebarCollapsed ? 'hsla(0, 0.00%, 100.00%, 0.50)' : '#fff',
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
        return readerPrefs.viewMode === 'single'
            ? `Pagina ${visiblePages[0]} di ${totalPages}`
            : `Pagine ${visiblePages.join('-')} di ${totalPages}`;
    };

    const getButtonClassName = (
        currentPage: number,
        direction: 'prev' | 'next',
        totalPages: number
    ): string => {
        // Increased touch target size and better visibility
        const baseClasses = 'w-[30px] h-[45px] sm:w-[45px] sm:h-[45px] rounded-full flex justify-center items-center shadow-lg transition-transform pointer-events-auto';

        const isDisabled =
            (direction === 'prev' && currentPage <= 1) ||
            (direction === 'next' && currentPage >= totalPages);

        if (isDisabled) {
            return `${baseClasses} opacity-0 pointer-events-none bg-transparent`;
        }

        return `${baseClasses} bg-gray-500/90 hover:bg-pink-500 active:bg-pink-600 hover:scale-110 cursor-pointer`;
    };

    // Log reader usage only once per session when the book is first opened
    useEffect(() => {
        const logKey = `book-opened-${bookId}-${user.id}`;

        if (!sessionStorage.getItem(logKey) && currentPage === 1) {
            logger.info('[read-book]', {
                userMail: user.email,
                bookTitle: book.title,
                userId: user.id,
                bookId: bookId,
            });
            sessionStorage.setItem(logKey, 'true');
        }
    }, [bookId, user.id, user.email, book.title, currentPage]);

    return (
        <div className="relative h-full w-full">
            {/* <div
                id="debug"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    borderRadius: '0 0 8px 8px',
                    color: 'white',
                    padding: '8px 16px',
                    zIndex: 9999,
                    fontSize: '14px',
                    pointerEvents: 'none',
                    minWidth: '100px',
                    textAlign: 'center',
                }}
            >0</div> */}

            {/* Sidebar Overlay */}
            {/* && window.innerWidth <= 768 */}
            <div
                ref={sidebarOverlayRef}
                className={`fixed top-0 left-0 w-full h-full bg-neutral-500/50 z-[9] ${!isSidebarCollapsed ? 'block' : 'hidden'}`}
                onClick={toggleSidebar}
            ></div>

            {/* Sidebar */}
            <div
                ref={sidebarRef}
                className="fixed top-0 right-0 w-[250px] h-full bg-white z-[10] flex flex-col pt-20 pb-6 px-6 transition-transform duration-300 ease-in-out shadow-md"
                style={getSidebarStyle()}
            >
                <button
                    ref={toggleSidebarBtnRef}
                    className="absolute top-[150px] -left-[29px] w-[28px] h-[36px] rounded-sm bg-sky-500/50 hover:bg-sky-600 flex justify-center items-center cursor-pointer shadow-sm border-none text-white p-0 z-[11] transform -translate-y-1/2 transition-colors select-none"
                    onClick={(e) => toggleSidebar(e)}
                    aria-label="Toggle sidebar"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-[24px] h-[24px] fill-white transition-transform duration-300 ease-in-out"
                        style={getToggleIconStyle()}
                    >
                        <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
                    </svg>
                </button>

                <h3 className="mb-5 pb-2.5 border-b border-gray-200 text-center font-semibold text-gray-800">Opzioni di lettura</h3>

                <div className="mb-5 w-full">
                    <h3 className="mb-2.5 text-sm text-center text-gray-700">Visualizzazione</h3>
                    <div className="flex justify-center w-full mt-2.5">
                        <div className="grid grid-cols-2 gap-0 w-full">
                            <button
                                className={`py-3 px-4 flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white border-none rounded-l cursor-pointer transition-colors ${readerPrefs.viewMode === 'single' ? 'bg-sky-700' : ''}`}
                                onClick={() => setViewModeHandler('single')}
                                title="Una pagina"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                </svg>
                            </button>
                            <button
                                className={`py-3 px-4 flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white border-none rounded-r cursor-pointer transition-colors ${readerPrefs.viewMode === 'double' ? 'bg-sky-700' : ''}`}
                                onClick={() => setViewModeHandler('double')}
                                title="Due pagine"
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
                    <h3 className="mb-2.5 text-sm text-center text-gray-700">Zoom</h3>
                    <div className="flex justify-center w-full mt-2.5">
                        <div className="grid grid-cols-3 gap-0 w-full">
                            <button
                                className="py-3 px-4 flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white border-none rounded-l cursor-pointer transition-colors"
                                onClick={() => adjustZoom(-10)}
                                title="Rimpicciolisci"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    <line x1="8" y1="11" x2="14" y2="11"></line>
                                </svg>
                            </button>
                            <button
                                className="py-3 px-4 flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white border-none cursor-pointer transition-colors"
                                onClick={resetZoom}
                                title="Ripristina zoom"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </button>
                            <button
                                className="py-3 px-4 flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white border-none rounded-r cursor-pointer transition-colors"
                                onClick={() => adjustZoom(10)}
                                title="Ingrandisci"
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
            <div className="h-screen w-full flex flex-col relative bg-gray-600 text-gray-800">
                {/* Main Content Area - Centered both horizontally and vertically */}
                <div
                    ref={viewerContainerRef}
                    className="flex-1 flex justify-center items-center relative overflow-hidden touch-none"
                >
                    {/* Render Pages */}
                    <div
                        className={`flex h-full justify-center items-center ${isLoading ? 'invisible' : ''}`}
                        style={{
                            gap: readerPrefs.viewMode === 'double' ? `${CONFIG.pageGap}px` : '0'
                        }}
                    >
                        {visiblePages.map((pageNum) => (
                            <div key={pageNum} className="h-full flex justify-center items-center select-none">
                                {imagesFailed[pageNum] ? (
                                    // Show placeholder for failed images
                                    <div className="max-h-full max-w-full flex flex-col items-center justify-center bg-gray-100 shadow-md p-8 rounded">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-16 h-16 text-gray-400 mb-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <p className="text-gray-600 text-center font-medium">Immagine non disponibile</p>
                                        <p className="text-gray-500 text-sm mt-2">Pagina {pageNum}</p>
                                    </div>
                                ) : (
                                    <img
                                        src={imagesLoaded[pageNum] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1.4"%3E%3C/svg%3E'}
                                        alt={`Pagina ${pageNum}`}
                                        className="max-h-full max-w-full object-contain shadow-md bg-white pointer-events-none select-none"
                                        draggable="false"
                                        data-page={pageNum}
                                        loading="eager"
                                        onLoad={() => {
                                            // When an image loads, ensure it's marked as loaded in our state
                                            if (!imagesLoaded[pageNum]) {
                                                setImagesLoaded(prev => ({
                                                    ...prev,
                                                    [pageNum]: getImagePath(pageNum)
                                                }));
                                            }
                                        }}
                                        onError={() => {
                                            // Handle inline image load failures as well
                                            if (!imagesFailed[pageNum]) {
                                                logger.warning(`Image load failed in render for page ${pageNum}`);
                                                setImagesFailed(prev => ({ ...prev, [pageNum]: true }));
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation Buttons are now placed outside the viewer container for better touch handling */}
                <div className="fixed inset-0 pointer-events-none z-[25]">
                    <div className="absolute w-full flex justify-between px-1 sm:px-4 top-1/2 transform -translate-y-1/2">
                        <button
                            className={`${getButtonClassName(currentPage, 'prev', totalPages)} touch-manipulation`}
                            onClick={goToPrevPage}
                            onTouchEnd={goToPrevPage}
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 text-gray-100 hover:text-white" />
                        </button>
                        <button
                            className={`${getButtonClassName(currentPage, 'next', totalPages)} touch-manipulation`}
                            onClick={goToNextPage}
                            onTouchEnd={goToNextPage}
                            aria-label="Next page"
                        >
                            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 text-gray-100 hover:text-white" />
                        </button>
                    </div>
                </div>

                {/* Fullscreen Button - Top Right */}
                <div className="fixed top-4 right-5 z-[25] pointer-events-none">
                    <button
                        className="p-2 bg-black/40 hover:bg-black/60 rounded-full pointer-events-auto touch-manipulation transition-colors backdrop-blur-sm"
                        onClick={toggleFullscreen}
                        onTouchEnd={toggleFullscreen}
                        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    >
                        {isFullscreen ? (
                            <Minimize className="w-5 h-5 sm:w-6 sm:h-6 text-gray-100 hover:text-white" />
                        ) : (
                            <Fullscreen className="w-5 h-5 sm:w-6 sm:h-6 text-gray-100 hover:text-white" />
                        )}
                    </button>
                </div>

                {/* Page Info */}
                <div className="fixed bottom-3 left-1/2 transform -translate-x-1/2 bg-gray-300/80 text-xs sm:text-sm text-gray-900 py-1 px-4 sm:py-1 sm:px-5 rounded-full shadow-sm z-[15] pointer-events-none select-none">
                    {getPageInfoText()}
                </div>

                {/* Loading Indicator - Only show when pages are loading */}
                {isLoading && (
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white py-4 px-5 rounded z-[500] flex items-center justify-center">
                        <div className="animate-pulse">Caricamento in corso...</div>
                    </div>
                )}
            </div>
        </div>
    );
}
