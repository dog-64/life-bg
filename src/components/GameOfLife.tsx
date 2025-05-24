import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RefreshCw, Settings } from 'lucide-react';

const CELL_SIZE = 12;
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
  const [showSettings, setShowSettings] = useState(false);
  
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
    
    // Generate exactly 5 clusters of 100-200 cells each
    const numClusters = 5;
    
    for (let i = 0; i < numClusters; i++) {
      const clusterSize = Math.floor(Math.random() * 101) + 100; // 100-200 cells
      const centerX = Math.floor(Math.random() * cols);
      const centerY = Math.floor(Math.random() * rows);
      
      for (let j = 0; j < clusterSize; j++) {
        // Create cells in a larger area around the center to accommodate 100-200 cells
        const offsetX = Math.floor(Math.random() * 21) - 10; // -10 to 10
        const offsetY = Math.floor(Math.random() * 21) - 10; // -10 to 10
        
        const x = (centerX + offsetX + cols) % cols; // Wrap around grid
        const y = (centerY + offsetY + rows) % rows; // Wrap around grid
        
        if (grid[y] && grid[y][x]) {
          grid[y][x].alive = true;
          grid[y][x].alpha = 1.0; // Полная непрозрачность для живых клеток
        }
      }
    }
    
    // Ensure immediate render after initialization
    renderGrid();
  }, []);

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
    
    renderGrid();
    return hasChanges;
  }, [gridSize, renderGrid]);

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
          ctx.fillRect(
            x * (CELL_SIZE + CELL_GAP),
            y * (CELL_SIZE + CELL_GAP),
            CELL_SIZE,
            CELL_SIZE
          );
        }
      }
    }
    
    ctx.restore();
  }, [gridSize]);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!lastUpdateTimeRef.current) {
      lastUpdateTimeRef.current = timestamp;
    }
    
    const elapsed = timestamp - lastUpdateTimeRef.current;
    
    if (elapsed > 1000 / speed) {
      updateGrid();
      lastUpdateTimeRef.current = timestamp;
    }
    
    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [isRunning, speed, updateGrid]);

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
  }, [initializeGrid]);

  const toggleRunning = () => {
    setIsRunning(!isRunning);
  };

  const resetGrid = () => {
    setIsRunning(false);
    cancelAnimationFrame(animationFrameRef.current);
    initializeGrid();
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpeed(Number(e.target.value));
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 z-0"
      />
      
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-10 bg-black/70 backdrop-blur-sm p-3 rounded-lg text-white">
        <div className="flex gap-2">
          <button 
            onClick={toggleRunning} 
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
            aria-label={isRunning ? "Pause" : "Play"}
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button 
            onClick={resetGrid}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
            aria-label="Reset"
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm">Generation: {generation}</span>
          
          {showSettings && (
            <div className="flex items-center gap-2">
              <label htmlFor="speed" className="text-sm whitespace-nowrap">
                Speed: {speed}
              </label>
              <input
                id="speed"
                type="range"
                min="1"
                max="60"
                value={speed}
                onChange={handleSpeedChange}
                className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}