// KRAKEN Organizational Chart JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize org chart functionality
    initializeOrgChart();
});

function initializeOrgChart() {
    // Get all style buttons and display sections
    const styleButtons = document.querySelectorAll('.style-btn');
    const displaySections = document.querySelectorAll('.org-display');
    
    // Add click event listeners to style buttons
    styleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const style = this.getAttribute('data-style');
            switchDisplayStyle(style);
            
            // Update active button
            styleButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Initialize with hierarchical view
    switchDisplayStyle('hierarchical');
}

function switchDisplayStyle(style) {
    // Hide all display sections
    const displaySections = document.querySelectorAll('.org-display');
    displaySections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected display section
    const selectedSection = document.getElementById(style);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }
    
    // Add any style-specific animations or effects
    switch(style) {
        case 'hierarchical':
            animateHierarchy();
            break;
        case 'grid':
            animateGrid();
            break;
        case 'cards':
            animateCards();
            break;
        case 'pyramid':
            animatePyramid();
            break;
        case 'naval':
            animateNavalFormation();
            break;
    }
}

function animateHierarchy() {
    const officers = document.querySelectorAll('#hierarchical .officer, #hierarchical .rank-placeholder');
    officers.forEach((officer, index) => {
        officer.style.opacity = '0';
        officer.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            officer.style.transition = 'all 0.3s ease';
            officer.style.opacity = '1';
            officer.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function animateGrid() {
    const cards = document.querySelectorAll('#grid .grid-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
        }, index * 150);
    });
}

function animateCards() {
    const cards = document.querySelectorAll('#cards .command-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateX(0)';
        }, index * 200);
    });
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

function animateNavalFormation() {
    const ships = document.querySelectorAll('#naval .escort-ship, #naval .fleet-ship, #naval .command-ship');
    ships.forEach((ship, index) => {
        ship.style.opacity = '0';
        ship.style.transform = 'rotate(-5deg) scale(0.8)';
        
        setTimeout(() => {
            ship.style.transition = 'all 0.4s ease';
            ship.style.opacity = '1';
            ship.style.transform = 'rotate(0deg) scale(1)';
        }, index * 120);
    });
}

// Officer hover effects
document.addEventListener('mouseover', function(e) {
    if (e.target.closest('.officer, .grid-card, .command-card, .pyramid-officer, .escort-ship, .fleet-ship, .command-ship')) {
        const element = e.target.closest('.officer, .grid-card, .command-card, .pyramid-officer, .escort-ship, .fleet-ship, .command-ship');
        element.style.transform = element.style.transform.replace('scale(1)', 'scale(1.05)') || 'scale(1.05)';
        element.style.zIndex = '10';
    }
});

document.addEventListener('mouseout', function(e) {
    if (e.target.closest('.officer, .grid-card, .command-card, .pyramid-officer, .escort-ship, .fleet-ship, .command-ship')) {
        const element = e.target.closest('.officer, .grid-card, .command-card, .pyramid-officer, .escort-ship, .fleet-ship, .command-ship');
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
