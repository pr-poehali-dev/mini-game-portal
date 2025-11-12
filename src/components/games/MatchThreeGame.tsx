import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface GameProps {
  onGameEnd: (score: number, result: 'win' | 'lose') => void;
  onBack: () => void;
}

type CellType = '🍓' | '🍊' | '🍋' | '🍇' | '🍉' | null;

const GRID_SIZE = 6;
const MATCH_TARGET = 500;
const MOVES_LIMIT = 20;
const FRUITS: CellType[] = ['🍓', '🍊', '🍋', '🍇', '🍉'];

const MatchThreeGame = ({ onGameEnd, onBack }: GameProps) => {
  const [grid, setGrid] = useState<CellType[][]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(MOVES_LIMIT);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);

  const createGrid = (): CellType[][] => {
    return Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill(null).map(() => 
        FRUITS[Math.floor(Math.random() * FRUITS.length)]
      )
    );
  };

  useEffect(() => {
    setGrid(createGrid());
  }, []);

  useEffect(() => {
    if (moves === 0) {
      const result = score >= MATCH_TARGET ? 'win' : 'lose';
      onGameEnd(score, result);
    }
  }, [moves]);

  const checkMatches = (newGrid: CellType[][]): boolean => {
    let hasMatches = false;
    const toRemove: boolean[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE - 2; j++) {
        if (newGrid[i][j] && newGrid[i][j] === newGrid[i][j + 1] && newGrid[i][j] === newGrid[i][j + 2]) {
          toRemove[i][j] = toRemove[i][j + 1] = toRemove[i][j + 2] = true;
          hasMatches = true;
        }
      }
    }

    for (let i = 0; i < GRID_SIZE - 2; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (newGrid[i][j] && newGrid[i][j] === newGrid[i + 1][j] && newGrid[i][j] === newGrid[i + 2][j]) {
          toRemove[i][j] = toRemove[i + 1][j] = toRemove[i + 2][j] = true;
          hasMatches = true;
        }
      }
    }

    if (hasMatches) {
      let matchCount = 0;
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          if (toRemove[i][j]) {
            matchCount++;
            newGrid[i][j] = null;
          }
        }
      }
      setScore(s => s + matchCount * 10);

      for (let j = 0; j < GRID_SIZE; j++) {
        for (let i = GRID_SIZE - 1; i >= 0; i--) {
          if (newGrid[i][j] === null) {
            for (let k = i - 1; k >= 0; k--) {
              if (newGrid[k][j] !== null) {
                newGrid[i][j] = newGrid[k][j];
                newGrid[k][j] = null;
                break;
              }
            }
          }
        }
      }

      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          if (newGrid[i][j] === null) {
            newGrid[i][j] = FRUITS[Math.floor(Math.random() * FRUITS.length)];
          }
        }
      }
    }

    return hasMatches;
  };

  const handleCellClick = (row: number, col: number) => {
    if (moves === 0) return;
    
    if (!selectedCell) {
      setSelectedCell([row, col]);
    } else {
      const [selectedRow, selectedCol] = selectedCell;
      const isAdjacent = 
        (Math.abs(row - selectedRow) === 1 && col === selectedCol) ||
        (Math.abs(col - selectedCol) === 1 && row === selectedRow);

      if (isAdjacent) {
        const newGrid = grid.map(r => [...r]);
        [newGrid[row][col], newGrid[selectedRow][selectedCol]] = 
        [newGrid[selectedRow][selectedCol], newGrid[row][col]];

        const tempGrid = [...newGrid.map(r => [...r])];
        const hasMatches = checkMatches(tempGrid);

        if (hasMatches) {
          setGrid(tempGrid);
          setMoves(m => m - 1);
        }
      }
      setSelectedCell(null);
    }
  };

  return (
    <div className="space-y-6 animate-bounce-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="rounded-full">
          <Icon name="ArrowLeft" size={20} className="mr-2" />
          Назад
        </Button>
        <div className="flex gap-4">
          <Card className="px-4 py-2">
            <p className="text-sm text-muted-foreground">Очки</p>
            <p className="text-2xl font-heading font-bold text-game-pink">{score}</p>
          </Card>
          <Card className="px-4 py-2">
            <p className="text-sm text-muted-foreground">Ходов</p>
            <p className="text-2xl font-heading font-bold text-game-orange">{moves}</p>
          </Card>
        </div>
      </div>

      <Card className="p-6">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-heading font-bold mb-2">🍓 Три в ряд</h2>
          <p className="text-muted-foreground">Собери {MATCH_TARGET} очков!</p>
          <div className="mt-3 flex justify-center gap-2">
            <div className={`px-4 py-2 rounded-full font-heading font-bold ${
              moves > 10 ? 'bg-green-100 text-green-700' : 
              moves > 5 ? 'bg-yellow-100 text-yellow-700' : 
              'bg-red-100 text-red-700 animate-pulse-slow'
            }`}>
              <Icon name="Zap" size={16} className="inline mr-1" />
              {moves} {moves === 1 ? 'ход' : moves < 5 ? 'хода' : 'ходов'} осталось
            </div>
            <div className={`px-4 py-2 rounded-full font-heading font-bold ${
              score >= MATCH_TARGET ? 'bg-green-100 text-green-700' :
              score >= MATCH_TARGET * 0.7 ? 'bg-yellow-100 text-yellow-700' :
              'bg-pink-100 text-pink-700'
            }`}>
              <Icon name="Target" size={16} className="inline mr-1" />
              {score}/{MATCH_TARGET}
            </div>
          </div>
        </div>

        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
          {grid.map((row, i) =>
            row.map((cell, j) => (
              <button
                key={`${i}-${j}`}
                onClick={() => handleCellClick(i, j)}
                className={`aspect-square text-4xl rounded-xl transition-all hover:scale-110 ${
                  selectedCell?.[0] === i && selectedCell?.[1] === j
                    ? 'bg-game-yellow shadow-lg scale-110'
                    : 'bg-white hover:bg-game-pink/10'
                }`}
              >
                {cell}
              </button>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default MatchThreeGame;