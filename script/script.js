class Identicon {
    constructor(input, canvasId, gridSize = 5) {
        this.input = input;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = gridSize;
        this.cellSize = this.canvas.width / gridSize;
        this.canvasCenterX = this.canvas.width / 2;
        this.canvasCenterY = this.canvas.height / 2;
        this.triangleLimit = [
            [0, 2], [1, 2], [2, 0], [2, 1],
            [2, 3], [2, 4], [3, 2], [4, 2]
        ];
        this.spinSpeed = Math.PI / 180; 
        this.rotationAngles = new Array(this.gridSize).fill(null).map(() => new Array(this.gridSize).fill(0)); 

    }

    async generateHash() {
        const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(this.input));
        return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    getObjectFromHash(hash, index) {
        const value = parseInt(hash.substring(index, index + 2), 16);
        return value < 150 ? 1 : 0;
    }

    getColorFromHash(hash, index) {
        return `#${hash.slice(index, index + 6)}`;
    }

    drawSquare(x, y, size, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }

    drawEffectTriangle(x, y, size, color, rotation) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size / 2 * Math.cos(rotation), y - size / 2 * Math.sin(rotation));
        this.ctx.lineTo(x + size / 2 * Math.cos(rotation + Math.PI * 2 / 3), y + size / 2 * Math.sin(rotation + Math.PI * 2 / 3));
        this.ctx.lineTo(x + size / 2 * Math.cos(rotation - Math.PI * 2 / 3), y + size / 2 * Math.sin(rotation - Math.PI * 2 / 3));
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawTriangle(x, y, size, color, rotation) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x + size / 2 * Math.cos(rotation + Math.PI), y + size / 2 * Math.sin(rotation + Math.PI));
        this.ctx.lineTo(x + size / 2 * Math.cos(rotation + Math.PI * 5 / 3), y + size / 2 * Math.sin(rotation + Math.PI * 5 / 3));
        this.ctx.lineTo(x + size / 2 * Math.cos(rotation - Math.PI * 5 / 3), y + size / 2 * Math.sin(rotation - Math.PI * 5 / 3));
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawCenterShape(x, y, color, objectKey) {
        switch (objectKey) {
            case 0: // Square
                this.drawSquare(x, y, this.cellSize, color);
                break;
            case 1: // Circle
                this.drawCircle(x, y, this.cellSize / 2, color);
                break;
            case 2: // Diamond
                this.drawDiamond(x, y, this.cellSize, color);
                break;
            case 3: // Octagon
                this.drawOctagon(x, y, this.cellSize, color);
                break;
        }
    }

    drawCircle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawDiamond(x, y, size, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size / 2);
        this.ctx.lineTo(x + size / 2, y);
        this.ctx.lineTo(x, y + size / 2);
        this.ctx.lineTo(x - size / 2, y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawOctagon(x, y, size, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        const octagonRadius = size / 2 * Math.sqrt(2) / (1 + Math.sqrt(2)); // Radius of a circle inscribed in an octagon
        for (let i = 0; i < 8; i++) {
            const angle = Math.PI / 4 * i;
            const octagonX = x + octagonRadius * Math.cos(angle);
            const octagonY = y + octagonRadius * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(octagonX, octagonY);
            } else {
                this.ctx.lineTo(octagonX, octagonY);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    async generateIdenticon() {
        const hash = await this.generateHash();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const centerColor = this.getColorFromHash(hash, 0);
        const triangleColor = this.getColorFromHash(hash, 6);
        const effectTriangleColor = this.getColorFromHash(hash, 12);

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const x = col * this.cellSize + this.cellSize / 2;
                const y = row * this.cellSize + this.cellSize / 2;
                const objectKey = this.getObjectFromHash(hash, (row * this.gridSize + col) * 2);
                const colorKey = this.getObjectFromHash(hash, (row * this.gridSize + col) * 2 + 2);
                const color = this.getColorFromHash(hash, colorKey * 6);
                const rotation = Math.atan2(this.canvasCenterY - y, this.canvasCenterX - x);

                if (row === Math.floor(this.gridSize / 2) && col === Math.floor(this.gridSize / 2)) {
                    this.drawCenterShape(x, y, centerColor, objectKey); 
                } else {
                    switch (objectKey) {
                        case 0:
                            break;
                        case 1:
                            if (this.triangleLimit.some(([r, c]) => r === row && c === col)) {
                                this.drawTriangle(x, y, this.cellSize, triangleColor, rotation);
                            } else {
                                this.drawEffectTriangle(x, y, this.cellSize, effectTriangleColor, rotation);
                            }
                            break;
                    }
                }
            }
        }
    }
}

const inputField = document.getElementById('textInput');
const identicon = document.getElementById('identicon');

inputField.addEventListener('input', function () {
    const identicon = new Identicon(this.value, 'identicon');
    identicon.generateIdenticon();
});

const initialIdenticon = new Identicon(inputField.value, 'identicon');
initialIdenticon.generateIdenticon();