import { useState, useEffect, useRef, useCallback } from 'react';

const CELL_SIZE = 8;
const CELL_GAP = 1;
const GRID_COLOR = '#333';
const LIVE_COLOR = '#22c55e'; // Green-500
const DEAD_COLOR = '#1a1a1a'; // Slightly lighter than black for better visibility

type Cell = {
  alive: boolean;
  nextState: boolean;
  alpha: number; // Для плавных переходов
};

export default function GameOfLife() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [speed, setSpeed] = useState(10);
  const [gridSize, setGridSize] = useState({ rows: 0, cols: 0 });
  
  const gridRef = useRef<Cell[][]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(0);

  // Initialize grid when component mounts or when window is resized
  const initializeGrid = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Set canvas size with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = windowWidth * dpr;
    canvas.height = windowHeight * dpr;
    
    // Set display size
    canvas.style.width = `${windowWidth}px`;
    canvas.style.height = `${windowHeight}px`;
    
    const cols = Math.floor(windowWidth / (CELL_SIZE + CELL_GAP));
    const rows = Math.floor(windowHeight / (CELL_SIZE + CELL_GAP));
    
    setGridSize({ rows, cols });
    
    const grid: Cell[][] = [];
    for (let y = 0; y < rows; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < cols; x++) {
        row.push({ alive: false, nextState: false, alpha: 0.0 });
      }
      grid.push(row);
    }
    
    gridRef.current = grid;
    setGeneration(0);
    
    // Generate exactly 5 clusters in spiral pattern from center
    const numClusters = 5;
    const centerX = Math.floor(cols / 2);
    const centerY = Math.floor(rows / 2);
    
    for (let i = 0; i < numClusters; i++) {
      const clusterSize = Math.floor(Math.random() * 101) + 100; // 100-200 cells
      
      // Spiral placement of clusters from center
      const angle = (i * 2 * Math.PI) / numClusters; // Evenly distributed around circle
      const radius = (i + 1) * Math.min(cols, rows) * 0.15; // Increasing radius
      
      const clusterCenterX = Math.floor(centerX + Math.cos(angle) * radius);
      const clusterCenterY = Math.floor(centerY + Math.sin(angle) * radius);
      
      for (let j = 0; j < clusterSize; j++) {
        // More sparse distribution - random scattering in large area
        // Using normal distribution for more organic look
        let offsetX, offsetY;
        do {
          offsetX = Math.floor((Math.random() + Math.random() + Math.random() - 1.5) * 30); // -45 to 45, concentrated to center
          offsetY = Math.floor((Math.random() + Math.random() + Math.random() - 1.5) * 30);
        } while (Math.sqrt(offsetX * offsetX + offsetY * offsetY) > 40); // Limit by radius
        
        const x = (clusterCenterX + offsetX + cols) % cols; // Wrap around grid
        const y = (clusterCenterY + offsetY + rows) % rows; // Wrap around grid
        
        // Check bounds and add some randomness for sparsity
        if (grid[y] && grid[y][x] && x >= 0 && x < cols && y >= 0 && y < rows && Math.random() > 0.1) {
          grid[y][x].alive = true;
          grid[y][x].alpha = 1.0; // Полная непрозрачность для живых клеток
        }
      }
    }
    
    // Ensure immediate render after initialization
    renderGrid();
  }, [renderGrid]);

  // Count live neighbors for a cell
  const countNeighbors = (grid: Cell[][], x: number, y: number) => {
    const { rows, cols } = gridSize;
    let count = 0;
    
    for (let yOffset = -1; yOffset <= 1; yOffset++) {
      for (let xOffset = -1; xOffset <= 1; xOffset++) {
        if (xOffset === 0 && yOffset === 0) continue;
        
        const newX = (x + xOffset + cols) % cols;
        const newY = (y + yOffset + rows) % rows;
        
        if (grid[newY][newX].alive) {
          count++;
        }
      }
    }
    
    return count;
  };

  // Render the grid to the canvas
  const renderGrid = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { rows, cols } = gridSize;
    const grid = gridRef.current;
    const dpr = window.devicePixelRatio || 1;
    
    // Clear the canvas with the correct scaling
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = DEAD_COLOR;
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    
    // Draw cells with alpha for smooth transitions
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = grid[y][x];
        
        if (cell.alpha > 0) {
          // Используем rgba для плавных переходов
          ctx.fillStyle = `rgba(34, 197, 94, ${cell.alpha})`;
          
          // Draw circular dots instead of squares
          const centerX = x * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
          const centerY = y * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
          const radius = CELL_SIZE / 2;
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
    
    // Draw centered text with black outline and white fill
    const centerX = (canvas.width / dpr) / 2;
    const centerY = (canvas.height / dpr) / 2;
    
    console.log('Rendering text at:', centerX, centerY); // Debug
    
    // Максимальная видимость для тестирования
    ctx.globalAlpha = 0.;
    
    // Черная обводка для контраста с клетками
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 10;
    ctx.font = 'bold 80px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('R300.39-Pc.Ru', centerX, centerY);
    
    // Красный текст для максимальной видимости (тестирование)
    ctx.fillStyle = 'white';
    ctx.fillText('R300.39-Pc.Ru', centerX, centerY);
    
    ctx.restore();
  }, [gridSize]);

  // Update the grid based on Conway's Game of Life rules
  const updateGrid = useCallback(() => {
    const { rows, cols } = gridSize;
    const grid = gridRef.current;
    
    if (rows === 0 || cols === 0 || !grid.length) return false;
    
    // Calculate next state for each cell
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = grid[y][x];
        const neighbors = countNeighbors(grid, x, y);
        
        if (cell.alive) {
          cell.nextState = neighbors === 2 || neighbors === 3;
        } else {
          cell.nextState = neighbors === 3;
        }
      }
    }
    
    // Update current state with next state and alpha for smooth transitions
    let hasChanges = false;
    const fadeSpeed = 0.15; // Скорость затухания/появления
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = grid[y][x];
        if (cell.alive !== cell.nextState) {
          hasChanges = true;
          cell.alive = cell.nextState;
        }
        
        // Обновляем альфа-канал для плавных переходов
        if (cell.alive) {
          cell.alpha = Math.min(1.0, cell.alpha + fadeSpeed);
        } else {
          cell.alpha = Math.max(0.0, cell.alpha - fadeSpeed);
        }
      }
    }
    
    if (hasChanges) {
      setGeneration(prev => prev + 1);
    }
    
    return hasChanges;
  }, [gridSize]);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!lastUpdateTimeRef.current) {
      lastUpdateTimeRef.current = timestamp;
    }
    
    const elapsed = timestamp - lastUpdateTimeRef.current;
    
    if (elapsed > 1000 / speed) {
      updateGrid();
      renderGrid();
      lastUpdateTimeRef.current = timestamp;
    }
    
    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [isRunning, speed, updateGrid, renderGrid]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      cancelAnimationFrame(animationFrameRef.current);
      initializeGrid();
      if (isRunning) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [initializeGrid, isRunning, animate]);

  // Start/stop animation when isRunning changes
  useEffect(() => {
    if (isRunning) {
      lastUpdateTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRunning, animate]);

  // Initialize grid on component mount and start the game automatically
  useEffect(() => {
    initializeGrid();
    setIsRunning(true); // Auto-start the game
    // Принудительный рендер для отображения текста
    setTimeout(() => {
      renderGrid();
    }, 100);
  }, [initializeGrid, renderGrid]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // F5 or Ctrl+R for reset
      if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        event.preventDefault();
        resetGrid();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [resetGrid]);

  const resetGrid = () => {
    setIsRunning(false);
    cancelAnimationFrame(animationFrameRef.current);
    initializeGrid();
    // Перезапускаем игру после сброса
    setTimeout(() => {
      setIsRunning(true);
    }, 100);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 z-0"
      />
    </div>
  );
}