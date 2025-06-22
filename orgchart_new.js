// KRAKEN Organizational Chart JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize org chart functionality
    initializeOrgChart();
    
    // Setup hover events for info buttons
    setupInfoButtonHovers();
});

function initializeOrgChart() {
    // Initialize rank cards with animation
    animateRankCards();
}

function animateRankCards() {
    const rankCards = document.querySelectorAll('.rank-card');
    rankCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function setupInfoButtonHovers() {
    const infoButtons = document.querySelectorAll('.info-btn');
    
    infoButtons.forEach(button => {
        const rankCard = button.closest('.rank-card');
        const panel = rankCard.querySelector('.info-panel');
        
        if (panel) {
            // Add hover events
            button.addEventListener('mouseenter', function() {
                // Hide all other panels first
                const allPanels = document.querySelectorAll('.info-panel');
                allPanels.forEach(p => p.style.display = 'none');
                
                // Show this panel
                panel.style.display = 'block';
            });
            
            // Keep panel visible when hovering over the panel itself
            panel.addEventListener('mouseenter', function() {
                panel.style.display = 'block';
            });
            
            // Hide panel when leaving both button and panel
            const hidePanel = function(e) {
                // Check if mouse is still over button or panel
                setTimeout(() => {
                    if (!button.matches(':hover') && !panel.matches(':hover')) {
                        panel.style.display = 'none';
                    }
                }, 100);
            };
            
            button.addEventListener('mouseleave', hidePanel);
            panel.addEventListener('mouseleave', hidePanel);
        }
    });
}

// Rank card hover effects
document.addEventListener('mouseover', function(e) {
    if (e.target.closest('.rank-card')) {
        const element = e.target.closest('.rank-card');
        if (!element.style.transform.includes('translateY(-2px)')) {
            element.style.transform = 'translateY(-2px)';
            element.style.boxShadow = '6px 6px 0px #bfa140';
            element.style.zIndex = '10';
        }
    }
});

document.addEventListener('mouseout', function(e) {
    if (e.target.closest('.rank-card')) {
        const element = e.target.closest('.rank-card');
        if (!element.matches(':hover')) {
            element.style.transform = '';
            element.style.boxShadow = '';
            element.style.zIndex = '';
        }
    }
});

// Responsive handling for mobile
function handleResponsive() {
    const container = document.querySelector('.orgchart-container');
    if (window.innerWidth < 768) {
        container.classList.add('mobile-view');
    } else {
        container.classList.remove('mobile-view');
    }
}

window.addEventListener('resize', handleResponsive);
handleResponsive(); // Initial check
