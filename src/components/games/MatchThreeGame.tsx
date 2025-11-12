import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

interface GameProps {
  onGameEnd: (score: number, result: "win" | "lose") => void;
  onBack: () => void;
}

type CellType = "🍓" | "🍊" | "🍋" | "🍇" | "🍉" | null;

const GRID_SIZE = 6;
const MATCH_TARGET = 1000; // Увеличено
const GAME_TIME = 60; // секунд

const FRUITS: CellType[] = ["🍓", "🍊", "🍋", "🍇", "🍉"];

const MatchThreeGame = ({ onGameEnd, onBack }: GameProps) => {
  const [grid, setGrid] = useState<CellType[][]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGameActive, setIsGameActive] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ 1. ГЕНЕРАЦИЯ ПОЛЯ БЕЗ КОМБИНАЦИЙ
  const hasMatches = (grid: CellType[][]): boolean => {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE - 2; j++) {
        if (
          grid[i][j] &&
          grid[i][j] === grid[i][j + 1] &&
          grid[i][j] === grid[i][j + 2]
        )
          return true;
      }
    }
    for (let i = 0; i < GRID_SIZE - 2; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (
          grid[i][j] &&
          grid[i][j] === grid[i + 1][j] &&
          grid[i][j] === grid[i + 2][j]
        )
          return true;
      }
    }
    return false;
  };

  const createValidGrid = (): CellType[][] => {
    let attempts = 0;
    let newGrid: CellType[][];
    do {
      newGrid = Array(GRID_SIZE)
        .fill(null)
        .map(() =>
          Array(GRID_SIZE)
            .fill(null)
            .map(() => FRUITS[Math.floor(Math.random() * FRUITS.length)]),
        );
      attempts++;
    } while (hasMatches(newGrid) && attempts < 100);
    return newGrid;
  };

  // Инициализация поля
  useEffect(() => {
    setGrid(createValidGrid());
  }, []);

  // Таймер
  useEffect(() => {
    if (!isGameActive) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          const result = score >= MATCH_TARGET ? "win" : "lose";
          onGameEnd(score, result);
          setIsGameActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isGameActive, score]);

  // ✅ 2. УДАЛЕНИЕ МАТЧЕЙ
  const findAndRemoveMatches = (currentGrid: CellType[][]): boolean => {
    let hasMatches = false;
    const toRemove: boolean[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(false));

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE - 2; j++) {
        if (
          currentGrid[i][j] &&
          currentGrid[i][j] === currentGrid[i][j + 1] &&
          currentGrid[i][j] === currentGrid[i][j + 2]
        ) {
          toRemove[i][j] = toRemove[i][j + 1] = toRemove[i][j + 2] = true;
          hasMatches = true;
        }
      }
    }

    for (let i = 0; i < GRID_SIZE - 2; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (
          currentGrid[i][j] &&
          currentGrid[i][j] === currentGrid[i + 1][j] &&
          currentGrid[i][j] === currentGrid[i + 2][j]
        ) {
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
            currentGrid[i][j] = null;
          }
        }
      }
      setScore((s) => s + matchCount * 10);
    }

    return hasMatches;
  };

  // ✅ 3. ПАДЕНИЕ
  const dropFruits = (currentGrid: CellType[][]): CellType[][] => {
    for (let j = 0; j < GRID_SIZE; j++) {
      let writeIndex = GRID_SIZE - 1;
      for (let i = GRID_SIZE - 1; i >= 0; i--) {
        if (currentGrid[i][j] !== null) {
          currentGrid[writeIndex][j] = currentGrid[i][j];
          if (writeIndex !== i) currentGrid[i][j] = null;
          writeIndex--;
        }
      }
    }
    return currentGrid;
  };

  // ✅ 4. ЗАПОЛНЕНИЕ СВЕРХУ
  const fillFromTop = (currentGrid: CellType[][]): CellType[][] => {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentGrid[i][j] === null) {
          currentGrid[i][j] = FRUITS[Math.floor(Math.random() * FRUITS.length)];
        }
      }
    }
    return currentGrid;
  };

  // ✅ 5. КАСКАД
  const processMatches = async (currentGrid: CellType[][]) => {
    setIsProcessing(true);
    while (findAndRemoveMatches(currentGrid)) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      dropFruits(currentGrid);
      await new Promise((resolve) => setTimeout(resolve, 200));
      fillFromTop(currentGrid);
      await new Promise((resolve) => setTimeout(resolve, 200));
      setGrid([...currentGrid.map((r) => [...r])]);
    }
    setIsProcessing(false);
  };

  const handleCellClick = async (row: number, col: number) => {
    if (!isGameActive || timeLeft === 0 || isProcessing) return;

    if (!selectedCell) {
      setSelectedCell([row, col]);
    } else {
      const [selectedRow, selectedCol] = selectedCell;

      if (row === selectedRow && col === selectedCol) {
        setSelectedCell(null);
        return;
      }

      const isAdjacent =
        (Math.abs(row - selectedRow) === 1 && col === selectedCol) ||
        (Math.abs(col - selectedCol) === 1 && row === selectedRow);

      if (isAdjacent) {
        const newGrid = grid.map((r) => [...r]);
        [newGrid[row][col], newGrid[selectedRow][selectedCol]] = [
          newGrid[selectedRow][selectedCol],
          newGrid[row][col],
        ];

        setGrid([...newGrid.map((r) => [...r])]);
        setSelectedCell(null);

        await processMatches(newGrid);
      } else {
        setSelectedCell([row, col]);
      }
    }
  };

  // Прогресс таймера
  const progress = (timeLeft / GAME_TIME) * 100;

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
            <p className="text-2xl font-heading font-bold text-game-pink">
              {score}
            </p>
          </Card>
          <Card className="px-4 py-2">
            <p className="text-sm text-muted-foreground">Время</p>
            <p className="text-2xl font-heading font-bold text-game-orange">
              {timeLeft}s
            </p>
          </Card>
        </div>
      </div>

      <Card className="p-6">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-heading font-bold mb-2">🍓 Три в ряд</h2>
          <p className="text-muted-foreground">
            Набери {MATCH_TARGET} очков за {GAME_TIME} сек!
          </p>

          {/* Прогресс-бар таймера */}
          <div className="mt-3 mx-auto max-w-xs">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  timeLeft > 20
                    ? "bg-green-500"
                    : timeLeft > 10
                      ? "bg-yellow-500"
                      : "bg-red-500 animate-pulse"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {timeLeft > 0 ? `Осталось: ${timeLeft} сек` : "Время вышло!"}
            </p>
          </div>

          <div className="mt-3 flex justify-center gap-2">
            <div
              className={`px-4 py-2 rounded-full font-heading font-bold ${
                score >= MATCH_TARGET
                  ? "bg-green-100 text-green-700"
                  : score >= MATCH_TARGET * 0.7
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-pink-100 text-pink-700"
              }`}
            >
              <Icon name="Target" size={16} className="inline mr-1" />
              {score}/{MATCH_TARGET}
            </div>
          </div>
        </div>

        <div
          className="grid gap-2 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
        >
          {grid.map((row, i) =>
            row.map((cell, j) => (
              <button
                key={`${i}-${j}`}
                onClick={() => handleCellClick(i, j)}
                disabled={isProcessing || !isGameActive || timeLeft === 0}
                className={`aspect-square text-4xl rounded-xl transition-all duration-200 hover:scale-110 shadow-lg border-2 ${
                  selectedCell?.[0] === i && selectedCell?.[1] === j
                    ? "bg-game-yellow border-game-yellow scale-110 shadow-2xl"
                    : cell
                      ? "bg-gradient-to-br from-white to-purple-50 hover:from-game-pink/20 hover:to-pink-50 border-purple-200"
                      : "bg-gray-100 border-gray-300 cursor-not-allowed"
                } ${isProcessing || !isGameActive ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {cell}
              </button>
            )),
          )}
        </div>

        {isProcessing && (
          <div className="text-center mt-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-game-pink"></div>
            <p className="text-sm text-muted-foreground mt-2">
              Каскад комбо! 🔥
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MatchThreeGame;
