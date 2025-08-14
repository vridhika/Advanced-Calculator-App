document.addEventListener('DOMContentLoaded', () => {
    const mainDisplay = document.getElementById('main-display');
    const historyDisplay = document.getElementById('history-display');
    const themeBtn = document.getElementById('theme-btn');
    const modeBtn = document.getElementById('mode-btn');
    const historyBtn = document.getElementById('history-btn');
    const basicKeypad = document.querySelector('.basic-keypad');
    const scientificKeypad = document.querySelector('.scientific-keypad');
    const keypad = document.querySelector('.keypad');
    const historyPanel = document.querySelector('.history-panel');
    const historyList = document.getElementById('history-list');

    let currentExpression = '';
    let isNewOperation = true;
    let isScientificMode = false;
    let memory = 0;
    let history = JSON.parse(localStorage.getItem('calculatorHistory')) || [];

    // Initialize display and history
    function init() {
        mainDisplay.value = '0';
        updateHistoryPanel();
    }
    
    // Helper function for glowing effect
    function addGlowEffect(element) {
        element.classList.add('glowing');
        setTimeout(() => {
            element.classList.remove('glowing');
        }, 500);
    }

    // Function to update the display
    function updateMainDisplay(value) {
        if (value.length > 15) {
            mainDisplay.value = Number(value).toExponential(8);
        } else {
            mainDisplay.value = value;
        }
    }

    // Function to handle number and decimal input
    function handleInput(value) {
        if (isNewOperation) {
            currentExpression = value;
            isNewOperation = false;
        } else {
            currentExpression += value;
        }
        historyDisplay.value = currentExpression;
        updateMainDisplay(currentExpression);
    }

    // Function to perform calculations using eval for flexibility
    function calculate() {
        if (currentExpression === '') return;

        let result;
        try {
            // Replace scientific function names for eval
            const expression = currentExpression
                .replace(/π/g, 'Math.PI')
                .replace(/e/g, 'Math.E')
                .replace(/x²/g, '^2')
                .replace(/x³/g, '^3')
                .replace(/√/g, 'Math.sqrt');

            // Using new Function() for a slightly safer eval
            result = new Function('return ' + expression)();

            if (isNaN(result) || !isFinite(result)) {
                throw new Error('Invalid calculation');
            }
            
            // Handle factorial separately
            if (expression.includes('!')) {
                const num = parseInt(expression.slice(0, -1));
                if (num < 0 || !Number.isInteger(num)) {
                    throw new Error('Factorial of non-integer or negative number');
                }
                let fact = 1;
                for (let i = 2; i <= num; i++) {
                    fact *= i;
                }
                result = fact;
            }

            // Save to history
            saveToHistory(`${currentExpression} =`, result);
            updateMainDisplay(result.toString());
            isNewOperation = true;
        } catch (e) {
            updateMainDisplay('Error');
            historyDisplay.value = '';
            isNewOperation = true;
        }
    }
    
    // Scientific functions
    function handleScientific(func) {
        const num = parseFloat(currentExpression);
        if (isNaN(num)) return;
        
        let result;
        switch (func) {
            case 'sin': result = Math.sin(num * Math.PI / 180); break;
            case 'cos': result = Math.cos(num * Math.PI / 180); break;
            case 'tan': result = Math.tan(num * Math.PI / 180); break;
            case 'log': result = Math.log10(num); break;
            case 'ln': result = Math.log(num); break;
            case 'x^2': result = num * num; break;
            case 'x^3': result = num * num * num; break;
            case 'sqrt': result = Math.sqrt(num); break;
            case '!': 
                if (num < 0 || !Number.isInteger(num)) {
                    result = 'Error: Invalid input';
                } else {
                    let fact = 1;
                    for (let i = 2; i <= num; i++) {
                        fact *= i;
                    }
                    result = fact;
                }
                break;
            case 'PI': result = Math.PI; break;
            case 'E': result = Math.E; break;
            default: return;
        }

        currentExpression = result.toString();
        updateMainDisplay(currentExpression);
        isNewOperation = true;
    }

    // Memory functions
    function handleMemory(func) {
        const num = parseFloat(mainDisplay.value);
        if (isNaN(num)) return;

        switch (func) {
            case 'M+': memory += num; break;
            case 'M-': memory -= num; break;
            case 'MR': updateMainDisplay(memory.toString()); isNewOperation = true; break;
            case 'MC': memory = 0; break;
        }
    }

    // Clear function
    function clear() {
        currentExpression = '';
        isNewOperation = true;
        historyDisplay.value = 'No calculations done';
        updateMainDisplay('0');
    }

    // Backspace function
    function backspace() {
        currentExpression = currentExpression.slice(0, -1);
        if (currentExpression === '') {
            clear();
        } else {
            updateMainDisplay(currentExpression);
            historyDisplay.value = currentExpression;
        }
    }

    // History functions
    function saveToHistory(expression, result) {
        const newHistoryItem = { expression, result };
        history.unshift(newHistoryItem);
        localStorage.setItem('calculatorHistory', JSON.stringify(history));
        updateHistoryPanel();
    }

    function updateHistoryPanel() {
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = '<li class="empty-history">No calculations done yet.</li>';
            return;
        }
        history.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.expression}</span><br><strong>${item.result}</strong>`;
            li.addEventListener('click', () => {
                currentExpression = item.result.toString();
                historyDisplay.value = '';
                updateMainDisplay(currentExpression);
                isNewOperation = true;
            });
            historyList.appendChild(li);
        });
    }

    // Event listeners for buttons
    keypad.addEventListener('click', (e) => {
        const target = e.target;
        if (!target.classList.contains('btn')) return;

        const value = target.dataset.value;
        addGlowEffect(target);

        if (target.classList.contains('btn-number') || target.classList.contains('btn-decimal') || target.classList.contains('btn-operator')) {
            handleInput(value);
        } else if (target.classList.contains('btn-equals')) {
            calculate();
        } else if (target.classList.contains('btn-clear')) {
            clear();
        } else if (target.classList.contains('btn-backspace')) {
            backspace();
        } else if (target.classList.contains('btn-sci')) {
            handleScientific(value);
        } else if (target.classList.contains('btn-memory')) {
            handleMemory(value);
        }
    });

    // Theme toggle
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
        themeBtn.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
    });

    // Mode toggle (Basic/Scientific)
    modeBtn.addEventListener('click', () => {
        isScientificMode = !isScientificMode;
        if (isScientificMode) {
            scientificKeypad.classList.remove('hidden');
            modeBtn.textContent = 'Basic';
            keypad.style.gridTemplateColumns = '1fr 1fr';
        } else {
            scientificKeypad.classList.add('hidden');
            modeBtn.textContent = 'Sci';
            keypad.style.gridTemplateColumns = '1fr';
        }
    });

    // History panel toggle
    historyBtn.addEventListener('click', () => {
        historyPanel.classList.toggle('hidden');
    });
    
    // Keyboard input support
    document.addEventListener('keydown', (e) => {
        const key = e.key;
        const button = document.querySelector(`[data-value="${key}"]`);
        if (button) {
            button.click();
        }
    });
    
    // Load saved theme from local storage
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        themeBtn.textContent = '☀️';
    }

    init();
});