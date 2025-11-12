import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

interface GameProps {
  onGameEnd: (score: number, result: "win" | "lose") => void;
  onBack: () => void;
}

type CellType = "🍓" | "🍊" | "🍋" | "🍇" | "🍉" | null;

const GRID_SIZE = 6;
const MATCH_TARGET = 500;
const MOVES_LIMIT = 20;
const FRUITS: CellType[] = ["🍓", "🍊", "🍋", "🍇", "🍉"];

const MatchThreeGame = ({ onGameEnd, onBack }: GameProps) => {
  const [grid, setGrid] = useState<CellType[][]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(MOVES_LIMIT);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ 1. ГЕНЕРАЦИЯ ПОЛЯ БЕЗ КОМБИНАЦИЙ
  const hasMatches = (grid: CellType[][]): boolean => {
    // Горизонтальные
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE - 2; j++) {
        if (
          grid[i][j] &&
          grid[i][j] === grid[i][j + 1] &&
          grid[i][j] === grid[i][j + 2]
        ) {
          return true;
        }
      }
    }
    // Вертикальные
    for (let i = 0; i < GRID_SIZE - 2; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (
          grid[i][j] &&
          grid[i][j] === grid[i + 1][j] &&
          grid[i][j] === grid[i + 2][j]
        ) {
          return true;
        }
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
    } while (hasMatches(newGrid) && attempts < 100); // Максимум 100 попыток

    return newGrid;
  };

  useEffect(() => {
    setGrid(createValidGrid());
  }, []);

  useEffect(() => {
    if (moves === 0) {
      const result = score >= MATCH_TARGET ? "win" : "lose";
      onGameEnd(score, result);
    }
  }, [moves]);

  // ✅ 2. НАХОЖДЕНИЕ И УДАЛЕНИЕ КОМБИНАЦИЙ
  const findAndRemoveMatches = (currentGrid: CellType[][]): boolean => {
    let hasMatches = false;
    const toRemove: boolean[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(false));

    // Горизонтальные
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

    // Вертикальные
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
      // Удаляем
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

  // ✅ 3. ПАДЕНИЕ ФИГУРОК ВНИЗ
  const dropFruits = (currentGrid: CellType[][]): CellType[][] => {
    for (let j = 0; j < GRID_SIZE; j++) {
      let writeIndex = GRID_SIZE - 1;

      for (let i = GRID_SIZE - 1; i >= 0; i--) {
        if (currentGrid[i][j] !== null) {
          currentGrid[writeIndex][j] = currentGrid[i][j];
          if (writeIndex !== i) {
            currentGrid[i][j] = null;
          }
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

  // ✅ 5. ЦЕПНАЯ РЕАКЦИЯ (каскад матчей)
  const processMatches = async (currentGrid: CellType[][]) => {
    setIsProcessing(true);

    while (findAndRemoveMatches(currentGrid)) {
      await new Promise((resolve) => setTimeout(resolve, 200)); // Пауза для анимации

      dropFruits(currentGrid);
      await new Promise((resolve) => setTimeout(resolve, 200));

      fillFromTop(currentGrid);
      await new Promise((resolve) => setTimeout(resolve, 200));

      setGrid([...currentGrid.map((r) => [...r])]); // Обновляем UI
    }

    setIsProcessing(false);
  };

  const handleCellClick = async (row: number, col: number) => {
    if (moves === 0 || isProcessing) return;

    if (!selectedCell) {
      setSelectedCell([row, col]);
    } else {
      const [selectedRow, selectedCol] = selectedCell;

      // Отмена выбора (клик на ту же клетку)
      if (row === selectedRow && col === selectedCol) {
        setSelectedCell(null);
        return;
      }

      const isAdjacent =
        (Math.abs(row - selectedRow) === 1 && col === selectedCol) ||
        (Math.abs(col - selectedCol) === 1 && row === selectedRow);

      if (isAdjacent) {
        const newGrid = grid.map((r) => [...r]);

        // Меняем местами
        [newGrid[row][col], newGrid[selectedRow][selectedCol]] = [
          newGrid[selectedRow][selectedCol],
          newGrid[row][col],
        ];

        setGrid([...newGrid.map((r) => [...r])]); // Показываем swap
        setMoves((m) => m - 1);
        setSelectedCell(null);

        // Обрабатываем каскад
        await processMatches(newGrid);
      } else {
        setSelectedCell([row, col]);
      }
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
            <p className="text-2xl font-heading font-bold text-game-pink">
              {score}
            </p>
          </Card>
          <Card className="px-4 py-2">
            <p className="text-sm text-muted-foreground">Ходов</p>
            <p className="text-2xl font-heading font-bold text-game-orange">
              {moves}
            </p>
          </Card>
        </div>
      </div>

      <Card className="p-6">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-heading font-bold mb-2">🍓 Три в ряд</h2>
          <p className="text-muted-foreground">Собери {MATCH_TARGET} очков!</p>
          <div className="mt-3 flex justify-center gap-2">
            <div
              className={`px-4 py-2 rounded-full font-heading font-bold ${
                moves > 10
                  ? "bg-green-100 text-green-700"
                  : moves > 5
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700 animate-pulse-slow"
              }`}
            >
              <Icon name="Zap" size={16} className="inline mr-1" />
              {moves} {moves === 1 ? "ход" : moves < 5 ? "хода" : "ходов"}{" "}
              осталось
            </div>
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
                disabled={isProcessing}
                className={`aspect-square text-4xl rounded-xl transition-all duration-200 hover:scale-110 shadow-lg border-2 ${
                  selectedCell?.[0] === i && selectedCell?.[1] === j
                    ? "bg-game-yellow border-game-yellow scale-110 shadow-2xl"
                    : cell
                      ? "bg-gradient-to-br from-white to-purple-50 hover:from-game-pink/20 hover:to-pink-50 border-purple-200"
                      : "bg-gray-100 border-gray-300 cursor-not-allowed"
                } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
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
