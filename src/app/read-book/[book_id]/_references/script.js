document.addEventListener('DOMContentLoaded', () => {
    // Configuration object with fixed settings
    const CONFIG = {
        // View settings
        viewMode: 'double', // 'single' or 'double'
        zoomLevel: 100, // percentage
        pageGap: 20, // distance between pages in double view mode (px)
        sidebarCollapsed: true, // whether sidebar starts collapsed (true) or expanded (false)

        // Image settings
        totalPages: 198,
        imagePrefix: 'page-',
        imageExt: '.png',
        preloadBuffer: 3 // Number of pages to preload ahead and behind
    };

    // State variables
    let currentPage = 1;
    let viewMode = CONFIG.viewMode;
    let zoomLevel = CONFIG.zoomLevel;
    let imagesLoaded = {}; // Cache of loaded images

    // Drag state variables
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let currentTranslateX = 0;
    let currentTranslateY = 0;
    let initialTranslateX = 0;
    let initialTranslateY = 0;

    // Cache for frequently accessed DOM elements
    const elements = {
        pagesContainer: document.getElementById('pages-container'),
        prevBtn: document.getElementById('prev-btn'),
        nextBtn: document.getElementById('next-btn'),
        singlePageBtn: document.getElementById('single-page-btn'),
        doublePageBtn: document.getElementById('double-page-btn'),
        zoomOutBtn: document.getElementById('zoom-out-btn'),
        zoomResetBtn: document.getElementById('zoom-reset-btn'),
        zoomInBtn: document.getElementById('zoom-in-btn'),
        pageInfo: document.getElementById('page-info'),
        loadingIndicator: document.getElementById('loading-indicator'),
        sidebar: document.getElementById('sidebar'),
        sidebarOverlay: document.getElementById('sidebar-overlay'),
        viewerContainer: document.getElementById('viewer-container'),
        toggleSidebarBtn: document.getElementById('toggle-sidebar')
    };

    // =======================================================
    // IMAGE HANDLING
    // =======================================================

    // Format page number with leading zeros (e.g., 001, 023, 198)
    function formatPageNumber(num) {
        return num.toString().padStart(3, '0');
    }

    // Get image path for a specific page
    function getImagePath(pageNum) {
        return `pages/${CONFIG.imagePrefix}${formatPageNumber(pageNum)}${CONFIG.imageExt}`;
    }

    // Create an image element for a specific page
    function createImageElement(pageNum) {
        const img = document.createElement('img');
        img.dataset.page = pageNum;
        img.alt = `Page ${pageNum}`;
        img.setAttribute('draggable', 'false'); // Prevent default dragging behavior

        // Use a placeholder initially
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1.4"%3E%3C/svg%3E';

        return img;
    }

    // Load image for a specific page with caching
    function loadImage(pageNum) {
        return new Promise((resolve, reject) => {
            if (imagesLoaded[pageNum]) {
                resolve(imagesLoaded[pageNum]);
                return;
            }

            const img = new Image();

            img.onload = () => {
                imagesLoaded[pageNum] = img.src;
                resolve(img.src);
            };

            img.onerror = () => {
                console.error(`Failed to load image for page ${pageNum}`);
                reject(new Error(`Failed to load image for page ${pageNum}`));
            };

            img.src = getImagePath(pageNum);
        });
    }

    // Get visible pages based on current view mode and page number
    function getVisiblePages() {
        const visiblePages = [];

        if (viewMode === 'single') {
            visiblePages.push(currentPage);
        } else {
            // In double page mode, show two pages side by side
            // If current page is odd, show current page and next page
            // If current page is even, show previous page and current page
            if (currentPage % 2 === 1) {
                visiblePages.push(currentPage);
                if (currentPage + 1 <= CONFIG.totalPages) {
                    visiblePages.push(currentPage + 1);
                }
            } else {
                visiblePages.push(currentPage - 1);
                visiblePages.push(currentPage);
            }
        }

        return visiblePages;
    }

    // Get pages to preload
    function getPagesToPreload() {
        const visiblePages = getVisiblePages();
        const pagesToPreload = [];

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
            if (pageToPreload <= CONFIG.totalPages && !visiblePages.includes(pageToPreload)) {
                pagesToPreload.push(pageToPreload);
            }
        }

        return pagesToPreload;
    }

    // Lazy loading with better error handling and requestAnimationFrame
    function lazyLoadImages() {
        const visiblePages = getVisiblePages();
        const pagesToPreload = getPagesToPreload();

        // Show loading indicator
        elements.loadingIndicator.style.display = 'block';

        // Use Promise.all to load all visible pages in parallel
        Promise.all(visiblePages.map(pageNum => loadImage(pageNum)))
            .then(() => {
                // Use requestAnimationFrame for smoother UI updates
                requestAnimationFrame(() => {
                    updateDisplay();
                    elements.loadingIndicator.style.display = 'none';

                    // Preload additional pages in the background
                    preloadImages(pagesToPreload);
                });
            })
            .catch(error => {
                console.error('Error loading visible images:', error);
                elements.loadingIndicator.style.display = 'none';

                // Still try to show whatever we could load
                requestAnimationFrame(updateDisplay);
            });
    }

    // Preload images in the background
    function preloadImages(pageNumbers) {
        if (!pageNumbers.length) return;

        // Load one image at a time to avoid overwhelming the browser
        const pageNum = pageNumbers.shift();

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
    }

    // =======================================================
    // DISPLAY & RENDERING
    // =======================================================

    // Update the display based on current state
    function updateDisplay() {
        // Clear pages container
        elements.pagesContainer.innerHTML = '';

        // Apply current position to allow dragging
        applyTransformToContainer();

        // Add page elements based on view mode
        const visiblePages = getVisiblePages();

        if (viewMode === 'single') {
            elements.pagesContainer.classList.remove('double-view');

            const pageDiv = document.createElement('div');
            pageDiv.className = 'page';

            const img = createImageElement(visiblePages[0]);
            if (imagesLoaded[visiblePages[0]]) {
                img.src = imagesLoaded[visiblePages[0]];
            }

            pageDiv.appendChild(img);
            elements.pagesContainer.appendChild(pageDiv);

            elements.pageInfo.textContent = `Page ${visiblePages[0]} of ${CONFIG.totalPages}`;
        } else {
            // Double page view
            elements.pagesContainer.classList.add('double-view');

            visiblePages.forEach(pageNum => {
                const pageDiv = document.createElement('div');
                pageDiv.className = 'page';

                const img = createImageElement(pageNum);
                if (imagesLoaded[pageNum]) {
                    img.src = imagesLoaded[pageNum];
                }

                pageDiv.appendChild(img);
                elements.pagesContainer.appendChild(pageDiv);
            });

            elements.pageInfo.textContent = `Pages ${visiblePages.join('-')} of ${CONFIG.totalPages}`;
        }

        // Update button states
        updateButtonStates();
    }

    // Apply transforms to container - separate to improve performance
    function applyTransformToContainer() {
        // Use CSS transform with translate3d for hardware acceleration
        elements.pagesContainer.style.transform = `translate3d(${currentTranslateX}px, ${currentTranslateY}px, 0) scale(${zoomLevel / 100})`;
    }

    // Update the active state of buttons
    function updateButtonStates() {
        // View mode buttons
        elements.singlePageBtn.classList.toggle('active', viewMode === 'single');
        elements.doublePageBtn.classList.toggle('active', viewMode === 'double');

        // Navigation buttons
        elements.prevBtn.style.opacity = currentPage > 1 ? '1' : '0.5';
        elements.prevBtn.style.pointerEvents = currentPage > 1 ? 'auto' : 'none';

        elements.nextBtn.style.opacity = currentPage < CONFIG.totalPages ? '1' : '0.5';
        elements.nextBtn.style.pointerEvents = currentPage < CONFIG.totalPages ? 'auto' : 'none';
    }

    // =======================================================
    // NAVIGATION & INTERACTION
    // =======================================================

    // Go to previous page with smoother transition
    function goToPrevPage() {
        if (currentPage > 1) {
            // Reset translation when changing page
            resetTranslation();

            if (viewMode === 'single') {
                currentPage--;
            } else {
                // In double page mode, go back by 2 pages
                currentPage = Math.max(1, currentPage - 2);
            }

            lazyLoadImages();
        }
    }

    // Go to next page with smoother transition
    function goToNextPage() {
        if (currentPage < CONFIG.totalPages) {
            // Reset translation when changing page
            resetTranslation();

            if (viewMode === 'single') {
                currentPage++;
            } else {
                // In double page mode, advance by 2 pages
                currentPage = Math.min(CONFIG.totalPages, currentPage + 2);
            }

            lazyLoadImages();
        }
    }

    // Set view mode (single or double)
    function setViewMode(mode) {
        if (viewMode === mode) return;

        viewMode = mode;
        resetTranslation();

        // Adjust current page for double view (ensure we start on odd page)
        if (mode === 'double' && currentPage % 2 === 0) {
            currentPage = Math.max(1, currentPage - 1);
        }

        lazyLoadImages();
    }

    // Reset translation to center
    function resetTranslation() {
        currentTranslateX = 0;
        currentTranslateY = 0;
        initialTranslateX = 0;
        initialTranslateY = 0;
    }

    // Adjust zoom level
    function adjustZoom(amount, centerX, centerY) {
        const oldZoom = zoomLevel;
        zoomLevel = Math.max(10, Math.min(300, zoomLevel + amount));

        if (oldZoom === zoomLevel) return; // No change

        // If zooming with a specific center point (e.g., mouse position)
        if (centerX !== undefined && centerY !== undefined) {
            // Calculate how the position should change to keep the point under the cursor
            const viewerRect = elements.viewerContainer.getBoundingClientRect();
            const viewerCenterX = viewerRect.width / 2;
            const viewerCenterY = viewerRect.height / 2;

            // Offset from center
            const dx = centerX - viewerCenterX;
            const dy = centerY - viewerCenterY;

            // Adjust position based on zoom change
            const zoomRatio = zoomLevel / oldZoom;
            currentTranslateX = (currentTranslateX + dx) * zoomRatio - dx;
            currentTranslateY = (currentTranslateY + dy) * zoomRatio - dy;
        }

        // Update cursor based on zoom level
        updateCursorStyle();

        applyTransformToContainer();
    }

    // Update cursor style based on zoom level
    function updateCursorStyle() {
        elements.pagesContainer.style.cursor = 'grab';
    }

    // Reset zoom to 100%
    function resetZoom() {
        zoomLevel = 100;
        resetTranslation();
        updateCursorStyle();
        applyTransformToContainer();
    }

    // Update toggle button icon based on sidebar state
    function updateToggleButtonIcon() {
        const isCollapsed = elements.sidebar.classList.contains('collapsed');
        const icon = elements.toggleSidebarBtn.querySelector('svg');

        // Rotate the icon based on sidebar state
        if (isCollapsed) {
            icon.style.transform = 'rotate(180deg)';
        } else {
            icon.style.transform = 'rotate(0deg)';
        }
    }

    // Toggle sidebar collapse state
    function toggleSidebar() {
        elements.sidebar.classList.toggle('collapsed');

        // Update the toggle button icon
        updateToggleButtonIcon();

        // Toggle overlay when sidebar is expanded on mobile
        if (window.innerWidth <= 768) {
            if (!elements.sidebar.classList.contains('collapsed')) {
                elements.sidebarOverlay.classList.add('active');
            } else {
                elements.sidebarOverlay.classList.remove('active');
            }
        }
    }

    // =======================================================
    // DRAG HANDLING
    // =======================================================

    function startDrag(e) {
        // Prevent default behavior
        e.preventDefault();

        // Get initial position
        if (e.type === 'mousedown') {
            dragStartX = e.clientX;
            dragStartY = e.clientY;
        } else if (e.type === 'touchstart') {
            dragStartX = e.touches[0].clientX;
            dragStartY = e.touches[0].clientY;
        }

        initialTranslateX = currentTranslateX;
        initialTranslateY = currentTranslateY;
        isDragging = true;

        // Add the grabbing cursor
        elements.pagesContainer.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
    }

    function doDrag(e) {
        if (!isDragging) return;

        // Prevent default behavior
        e.preventDefault();

        let clientX, clientY;

        if (e.type === 'mousemove') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        // Calculate new position
        const deltaX = clientX - dragStartX;
        const deltaY = clientY - dragStartY;

        currentTranslateX = initialTranslateX + deltaX;
        currentTranslateY = initialTranslateY + deltaY;

        // Use requestAnimationFrame for smooth animation
        requestAnimationFrame(() => applyTransformToContainer());
    }

    function endDrag() {
        if (!isDragging) return;

        isDragging = false;

        // Restore the grab cursor
        elements.pagesContainer.style.cursor = 'grab';
        document.body.style.userSelect = '';
    }

    // Handle mouse wheel for zooming
    function handleWheel(e) {
        // Check if CTRL key is pressed (for zoom)
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 10 : -10; // 10% zoom step
            adjustZoom(delta, e.clientX, e.clientY);
        }
    }

    // =======================================================
    // INITIALIZATION & EVENT LISTENERS
    // =======================================================

    // Initialize the viewer
    function initializeViewer() {
        // Set initial button states
        updateButtonStates();

        // Update cursor style
        updateCursorStyle();

        // Apply sidebar collapsed state from configuration
        if (CONFIG.sidebarCollapsed) {
            elements.sidebar.classList.add('collapsed');
        } else {
            elements.sidebar.classList.remove('collapsed');
        }

        // Update toggle button icon
        updateToggleButtonIcon();

        // Load initial pages
        lazyLoadImages();
    }

    // Navigation event listeners
    elements.prevBtn.addEventListener('click', goToPrevPage);
    elements.nextBtn.addEventListener('click', goToNextPage);

    // View mode event listeners
    elements.singlePageBtn.addEventListener('click', () => setViewMode('single'));
    elements.doublePageBtn.addEventListener('click', () => setViewMode('double'));

    // Zoom event listeners
    elements.zoomInBtn.addEventListener('click', () => adjustZoom(10));
    elements.zoomOutBtn.addEventListener('click', () => adjustZoom(-10));
    elements.zoomResetBtn.addEventListener('click', resetZoom);

    // Sidebar toggle event listeners
    elements.toggleSidebarBtn.addEventListener('click', toggleSidebar);
    elements.sidebarOverlay.addEventListener('click', toggleSidebar);

    // Drag handling event listeners
    elements.viewerContainer.addEventListener('mousedown', startDrag);
    elements.viewerContainer.addEventListener('touchstart', startDrag, { passive: false });

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('touchmove', doDrag, { passive: false });

    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    // Mouse wheel event listener for zooming
    elements.viewerContainer.addEventListener('wheel', handleWheel, { passive: false });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
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
    });

    // Window resize handling
    let resizeTimeout;
    window.addEventListener('resize', () => {
        // Debounce resize events
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Adjust layout if necessary on window resize
            updateDisplay();
        }, 100);
    });

    // Start the viewer
    initializeViewer();
});