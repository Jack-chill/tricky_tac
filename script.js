class SoundManager {
    constructor() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playTone(frequency, type, duration, vol = 0.1) {
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

        gainNode.gain.setValueAtTime(vol, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + duration);
    }

    playMoveSound(player) {
        // Different slightly playful tones for X and O
        if (player === 'X') {
            this.playTone(600, 'sine', 0.1, 0.1);
            setTimeout(() => this.playTone(800, 'sine', 0.1, 0.1), 50);
        } else {
            this.playTone(800, 'sine', 0.1, 0.1);
            setTimeout(() => this.playTone(600, 'sine', 0.1, 0.1), 50);
        }
    }

    playWinSound() {
        // A happy little arpeggio
        const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5 (A Major)
        notes.forEach((note, index) => {
            setTimeout(() => {
                this.playTone(note, 'triangle', 0.2, 0.15);
            }, index * 100);
        });
    }

    playTieSound() {
        // A dull, descending sequence
        this.playTone(300, 'sawtooth', 0.2, 0.1);
        setTimeout(() => this.playTone(250, 'sawtooth', 0.3, 0.1), 150);
    }

    playRestartSound() {
        // A quick sweeping sound
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, this.audioCtx.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);

        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.2);
    }
}

class TicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.isGameActive = true;
        this.scores = { X: 0, O: 0 };
        this.soundManager = new SoundManager();

        this.winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        this.cells = document.querySelectorAll('.cell');
        this.statusMessage = document.getElementById('status-message');
        this.restartBtn = document.getElementById('restart-btn');
        this.scoreXVal = document.getElementById('score-x-val');
        this.scoreOVal = document.getElementById('score-o-val');

        this.init();
    }

    init() {
        this.cells.forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.updateStatusMessage();

        // Setup audio context on first user interaction to bypass autoplay restrictions
        document.body.addEventListener('click', () => {
            if (this.soundManager.audioCtx.state === 'suspended') {
                this.soundManager.audioCtx.resume();
            }
        }, { once: true });
    }

    handleCellClick(e) {
        const cell = e.target;
        const index = parseInt(cell.getAttribute('data-index'));

        if (this.board[index] !== '' || !this.isGameActive) {
            return;
        }

        this.board[index] = this.currentPlayer;
        cell.innerText = this.currentPlayer;
        cell.classList.add(this.currentPlayer.toLowerCase());
        cell.classList.add('taken');

        this.soundManager.playMoveSound(this.currentPlayer);

        this.checkWin();
    }

    checkWin() {
        let roundWon = false;
        let winningCells = [];

        for (let i = 0; i < this.winConditions.length; i++) {
            const [a, b, c] = this.winConditions[i];
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                roundWon = true;
                winningCells = [a, b, c];
                break;
            }
        }

        if (roundWon) {
            this.handleWin(winningCells);
            return;
        }

        const roundDraw = !this.board.includes('');
        if (roundDraw) {
            this.handleDraw();
            return;
        }

        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updateStatusMessage();
    }

    handleWin(winningCells) {
        this.isGameActive = false;
        this.statusMessage.innerHTML = `Player <span class="glow-${this.currentPlayer === 'X' ? 'cyan' : 'pink'}">${this.currentPlayer}</span> Wins!`;
        this.scores[this.currentPlayer]++;
        this.updateScoreboard();
        this.soundManager.playWinSound();

        winningCells.forEach(index => {
            this.cells[index].classList.add('winning-cell');
        });
    }

    handleDraw() {
        this.isGameActive = false;
        this.statusMessage.innerText = "It's a Draw!";
        this.soundManager.playTieSound();
    }

    updateScoreboard() {
        this.scoreXVal.innerText = this.scores.X;
        this.scoreOVal.innerText = this.scores.O;

        // Add a small pop animation to the updated score
        const scoreElement = this.currentPlayer === 'X' ? this.scoreXVal : this.scoreOVal;
        scoreElement.style.transform = 'scale(1.5)';
        setTimeout(() => {
            scoreElement.style.transform = 'scale(1)';
            scoreElement.style.transition = 'transform 0.3s ease';
        }, 50);
    }

    updateStatusMessage() {
        const colorClass = this.currentPlayer === 'X' ? 'glow-cyan' : 'glow-pink';
        this.statusMessage.innerHTML = `Player <span class="${colorClass}">${this.currentPlayer}</span>'s Turn`;
    }

    restartGame() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.isGameActive = true;
        this.soundManager.playRestartSound();

        this.cells.forEach(cell => {
            cell.innerText = '';
            cell.classList.remove('x', 'o', 'taken', 'winning-cell');
        });

        this.updateStatusMessage();
    }
}

// Start the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});
