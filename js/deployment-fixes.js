// Deployment fixes for Vercel and other hosting platforms
(function() {
    'use strict';
    
    // Fix for image loading errors - fallback to alternate paths
    function addImageErrorHandling() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.onerror = function() {
                // Try alternate path with URL encoding for spaces
                if (this.src.includes('royal navy ranks/')) {
                    this.src = this.src.replace('royal navy ranks/', 'royal%20navy%20ranks/');
                } else if (this.src.includes('royal%20navy%20ranks/') && !this.src.includes('insignia/')) {
                    // Try insignia folder as fallback
                    this.src = this.src.replace('royal%20navy%20ranks/', 'insignia/');
                } else {
                    // Last resort - hide broken image
                    this.style.display = 'none';
                    console.warn('Failed to load image:', this.src);
                }
            };
        });
    }
    
    // Fix for localStorage in private browsing/hosting environments
    function checkLocalStorage() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch (e) {
            console.warn('localStorage not available, using memory storage');
            // Create a memory-based storage fallback
            window.memoryStorage = {};
            const originalLocalStorage = window.localStorage;
            window.localStorage = {
                setItem: function(key, value) {
                    window.memoryStorage[key] = value;
                },
                getItem: function(key) {
                    return window.memoryStorage[key] || null;
                },
                removeItem: function(key) {
                    delete window.memoryStorage[key];
                }
            };
            return false;
        }
    }
    
    // Fix for CORS issues with external APIs
    function addFetchErrorHandling() {
        // Override fetch to add error handling
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            return originalFetch.apply(this, args)
                .catch(error => {
                    console.warn('Fetch error:', error.message);
                    // Return a mock response for port data if NA API fails
                    if (args[0] && args[0].includes('na-map.github.io')) {
                        return {
                            ok: false,
                            json: () => Promise.resolve([
                                { name: 'Bridgetown', nation: 'Great Britain', region: 'Caribbean' },
                                { name: 'Kingston', nation: 'Great Britain', region: 'Caribbean' },
                                { name: 'Port-au-Prince', nation: 'France', region: 'Caribbean' },
                                { name: 'Havana', nation: 'Spain', region: 'Caribbean' },
                                { name: 'Cartagena de Indias', nation: 'Spain', region: 'Caribbean' },
                                { name: 'Willemstad', nation: 'Netherlands', region: 'Caribbean' },
                                { name: 'Charleston', nation: 'United States', region: 'Caribbean' },
                                { name: 'New Orleans', nation: 'United States', region: 'Caribbean' }
                            ])
                        };
                    }
                    throw error;
                });
        };
    }
    
    // Fix for relative path issues
    function fixRelativePaths() {
        // Ensure all internal links work with or without trailing slashes
        const links = document.querySelectorAll('a[href$=".html"]');
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href && !href.startsWith('http') && !href.startsWith('//')) {
                    // Ensure the path is relative to root
                    if (!href.startsWith('./') && !href.startsWith('/')) {
                        this.href = './' + href;
                    }
                }
            });
        });
    }
    
    // Apply all fixes when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            addImageErrorHandling();
            checkLocalStorage();
            addFetchErrorHandling();
            fixRelativePaths();
        });
    } else {
        addImageErrorHandling();
        checkLocalStorage();
        addFetchErrorHandling();
        fixRelativePaths();
    }
    
    // Console message for debugging
    console.log('KRAKEN Deployment Fixes Loaded');
    
})();
