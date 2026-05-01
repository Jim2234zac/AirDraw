// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('JavaScript Project Loaded Successfully!');
    
    // Get DOM elements
    const button = document.getElementById('myButton');
    const resultDiv = document.getElementById('result');
    
    // Button click event listener
    button.addEventListener('click', function() {
        handleButtonClick();
    });
    
    // Initialize the application
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('Application initialized');
    updateResult('ยินดีต้อนรับ! คลิกปุ่มเพื่อเริ่มต้น');
}

/**
 * Handle button click events
 */
function handleButtonClick() {
    const currentTime = new Date().toLocaleTimeString('th-TH');
    const message = `คุณคลิกปุ่มเมื่อ ${currentTime}`;
    
    updateResult(message);
    
    // Add some animation
    animateButton();
}

/**
 * Update the result div with new content
 * @param {string} message - The message to display
 */
function updateResult(message) {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = message;
    resultDiv.style.color = '#667eea';
    
    // Fade in effect
    resultDiv.style.opacity = '0';
    setTimeout(() => {
        resultDiv.style.transition = 'opacity 0.3s ease';
        resultDiv.style.opacity = '1';
    }, 10);
}

/**
 * Animate the button when clicked
 */
function animateButton() {
    const button = document.getElementById('myButton');
    button.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 100);
}

/**
 * Example utility functions that you can use in your project
 */
const Utils = {
    /**
     * Generate a random color
     * @returns {string} Random hex color
     */
    randomColor() {
        return '#' + Math.floor(Math.random()*16777215).toString(16);
    },
    
    /**
     * Format date in Thai format
     * @param {Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDateThai(date) {
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    /**
     * Debounce function to limit function calls
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
};

// Example of using the utils
console.log('Random color:', Utils.randomColor());
console.log('Today in Thai:', Utils.formatDateThai(new Date()));
