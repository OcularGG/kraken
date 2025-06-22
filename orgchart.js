// KRAKEN Organizational Chart JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize org chart functionality
    initializeOrgChart();
});

function initializeOrgChart() {
    // Initialize pyramid view with animation
    animatePyramid();
}

function animatePyramid() {
    const levels = document.querySelectorAll('#pyramid .pyramid-level');
    levels.forEach((level, index) => {
        const officers = level.querySelectorAll('.pyramid-officer');
        officers.forEach((officer, officerIndex) => {
            officer.style.opacity = '0';
            officer.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                officer.style.transition = 'all 0.3s ease';
                officer.style.opacity = '1';
                officer.style.transform = 'translateY(0)';
            }, (index * 300) + (officerIndex * 100));
        });
    });
}

// Officer hover effects
document.addEventListener('mouseover', function(e) {
    if (e.target.closest('.pyramid-officer')) {
        const element = e.target.closest('.pyramid-officer');
        element.style.transform = element.style.transform.replace('scale(1)', 'scale(1.05)') || 'scale(1.05)';
        element.style.zIndex = '10';
    }
});

document.addEventListener('mouseout', function(e) {
    if (e.target.closest('.pyramid-officer')) {
        const element = e.target.closest('.pyramid-officer');
        element.style.transform = element.style.transform.replace('scale(1.05)', 'scale(1)') || '';
        element.style.zIndex = '';
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

// Toggle info panel function for pyramid officers
function toggleInfo(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        if (panel.style.display === 'none' || panel.style.display === '') {
            // Hide all other panels first
            const allPanels = document.querySelectorAll('.info-panel');
            allPanels.forEach(p => p.style.display = 'none');
            
            // Show the selected panel
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    }
}
