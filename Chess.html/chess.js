document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const nInput = document.getElementById('n-input');
    const startButton = document.getElementById('startButton');
    const resetButton = document.getElementById('resetButton');
    const speedSlider = document.getElementById('speed-slider');
    const chessboardDiv = document.getElementById('chessboard');
    const statusMessage = document.getElementById('status-message');

    // --- State Variables ---
    let n = 8;
    let board = []; // 2D array for logic: 0 = empty, 1 = queen
    let visualizationDelay = 200; // Default delay in ms
    let isSolving = false;
    let stopSolving = false; // Flag to stop the algorithm

    // --- Utility Functions ---

    /**
     * A simple promise-based sleep function for async delays.
     * @param {number} ms - Milliseconds to sleep.
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Creates the DOM for the chessboard and initializes the logic board.
     */
    function createBoard() {
        chessboardDiv.innerHTML = ''; // Clear existing board
        n = parseInt(nInput.value) || 8;
        if (n > 16) {
            n = 16; // Cap at 16 for performance
            nInput.value = 16;
        }
        if (n < 4) {
            n = 4;
            nInput.value = 4;
        }
        
        // Set CSS custom property for grid size and queen size
        chessboardDiv.style.setProperty('--n', n);

        // Initialize the logic board
        board = Array(n).fill(0).map(() => Array(n).fill(0));

        // Create cell elements
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const cell = document.createElement('div');
                cell.id = `cell-${i}-${j}`;
                cell.classList.add('cell');
                cell.classList.add((i + j) % 2 === 0 ? 'light' : 'dark');
                chessboardDiv.appendChild(cell);
            }
        }
    }

    // --- Visualization Functions ---
    
    /**
     * Gets the cell element at a specific row and column.
     * @param {number} row
     * @param {number} col
     * @returns {HTMLElement|null}
     */
    function getCell(row, col) {
        return document.getElementById(`cell-${row}-${col}`);
    }

    /**
     * Shows the "placing" (green) glow on a cell.
     */
    function showPlacing(row, col) {
        const cell = getCell(row, col);
        if (cell) cell.classList.add('placing');
    }

    /**
     * Shows the "backtracking" (red) glow on a cell.
     */
    function showBacktracking(row, col) {
        const cell = getCell(row, col);
        if (cell) {
            cell.classList.remove('placing'); // Remove green if it was there
            cell.classList.add('backtracking');
        }
    }

    /**
     * Places a queen (adds 'queen' class) on the board.
     */
    function placeQueen(row, col) {
        const cell = getCell(row, col);
        if (cell) {
            cell.classList.remove('placing');
            cell.classList.add('queen');
        }
    }

    /**
     * Removes all visual styles (queen, glows) from a cell.
     */
    function removeVisuals(row, col) {
        const cell = getCell(row, col);
        if (cell) {
            cell.classList.remove('queen', 'placing', 'backtracking');
        }
    }

    // --- N-Queens Logic ---

    /**
     * Checks if it's safe to place a queen at board[row][col].
     * This function only needs to check upwards (rows 0 to row-1).
     * @param {number} row
     * @param {number} col
     * @returns {boolean}
     */
    function isSafe(row, col) {
        // Check this column in all previous rows
        for (let i = 0; i < row; i++) {
            if (board[i][col] === 1) return false;
        }

        // Check upper-left diagonal
        for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
            if (board[i][j] === 1) return false;
        }

        // Check upper-right diagonal
        for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
            if (board[i][j] === 1) return false;
        }

        // It's safe
        return true;
    }

    /**
     * The main recursive backtracking function (async for visualization).
     * @param {number} row - The current row we are trying to place a queen in.
     * @returns {Promise<boolean>} - True if a solution is found, false otherwise.
     */
    async function solveNQueens(row) {
        // Base case: If all rows are filled, we found a solution
        if (row === n) {
            return true;
        }

        // Try placing a queen in each column of the current row
        for (let col = 0; col < n; col++) {
            // Check if the stop flag has been set
            if (stopSolving) return false;

            // Visualize: Show "placing"
            showPlacing(row, col);
            await sleep(visualizationDelay);

            if (isSafe(row, col)) {
                // Place the queen
                board[row][col] = 1;
                placeQueen(row, col); // Update UI
                await sleep(visualizationDelay);

                // Recurse to the next row
                if (await solveNQueens(row + 1)) {
                    return true; // Solution found!
                }
                
                // If we are here, the recursive call failed (backtracking)
                if (stopSolving) return false; // Check stop flag again after recursion

                // Backtrack: Remove the queen
                board[row][col] = 0;
                showBacktracking(row, col); // Show red glow
                await sleep(visualizationDelay);
                removeVisuals(row, col); // Remove queen and glow
                
            } else {
                // Not safe: Show "backtracking" and move to the next column
                showBacktracking(row, col);
                await sleep(visualizationDelay);
                removeVisuals(row, col); // Remove the placing glow
            }
        }

        // If no column worked in this row, return false to backtrack
        return false;
    }

    // --- Event Handlers ---

    async function handleStart() {
        if (isSolving) return;

        isSolving = true;
        stopSolving = false;
        startButton.disabled = true;
        resetButton.disabled = true;
        nInput.disabled = true;
        statusMessage.textContent = `Solving for N = ${n}...`;

        createBoard(); // Re-create board to clear any previous state

        const startTime = performance.now();
        const solutionFound = await solveNQueens(0);
        const endTime = performance.now();
        
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        if (solutionFound) {
            statusMessage.textContent = `Solution found in ${duration}s!`;
        } else if (!stopSolving) {
            statusMessage.textContent = `No solution exists for N = ${n}. (${duration}s)`;
        } else {
            statusMessage.textContent = 'Visualization stopped.';
        }

        isSolving = false;
        startButton.disabled = false;
        resetButton.disabled = false;
        nInput.disabled = false;
    }
    
    function handleReset() {
        if (isSolving) {
            stopSolving = true; // Signal the solving loop to stop
        }
        isSolving = false;
        stopSolving = false;
        
        startButton.disabled = false;
        resetButton.disabled = false;
        nInput.disabled = false;
        
        statusMessage.textContent = "Press 'Start' to visualize.";
        createBoard(); // Create a fresh board
    }

    function handleSpeedChange(e) {
        // Invert the slider value: max value (500) = min delay (50ms)
        // min value (50) = max delay (500ms)
        visualizationDelay = 550 - parseInt(e.target.value, 10);
    }

    // --- Initial Setup ---
    startButton.addEventListener('click', handleStart);
    resetButton.addEventListener('click', handleReset);
    nInput.addEventListener('change', handleReset); // Reset if N changes
    speedSlider.addEventListener('input', handleSpeedChange);
    
    // Set initial speed and create the initial board
    handleSpeedChange({ target: speedSlider });
    createBoard();
});