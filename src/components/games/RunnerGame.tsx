import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

interface GameProps {
  onGameEnd: (score: number, result: "win" | "lose") => void;
  onBack: () => void;
}

interface Obstacle {
  x: number;
  id: number;
}

const RunnerGame = ({ onGameEnd, onBack }: GameProps) => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [playerY, setPlayerY] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [gameSpeed, setGameSpeed] = useState(4); // Немного медленнее
  const [runAnimation, setRunAnimation] = useState(0); // Для анимации ног
  const obstacleIdRef = useRef(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const runAnimRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ 1. АНИМАЦИЯ БЕГА (ноги)
  useEffect(() => {
    if (!gameOver && !isJumping) {
      runAnimRef.current = setInterval(() => {
        setRunAnimation((prev) => (prev + 0.3) % (Math.PI * 2));
      }, 100);
    }
    return () => {
      if (runAnimRef.current) clearInterval(runAnimRef.current);
    };
  }, [gameOver, isJumping]);

  // Спавн препятствий (реже + контроль расстояния)
  useEffect(() => {
    const interval = setInterval(
      () => {
        if (!gameOver && obstacles.length === 0) {
          // Только если нет препятствий
          setObstacles((prev) => [
            ...prev.filter((obs) => obs.x > -60),
            { x: 650, id: obstacleIdRef.current++ }, // Реже спавн
          ]);
        }
      },
      1800 - gameSpeed * 100,
    ); // Динамическая частота

    return () => clearInterval(interval);
  }, [gameOver, gameSpeed, obstacles.length]);

  // Игровой цикл
  useEffect(() => {
    if (!gameOver) {
      gameLoopRef.current = setInterval(() => {
        setObstacles((prev) =>
          prev.map((obs) => ({ ...obs, x: obs.x - gameSpeed })),
        );
        setScore((s) => s + 1);

        if (score % 150 === 0 && score > 0) {
          // Реже ускорение
          setGameSpeed((s) => Math.min(s + 0.3, 8)); // Макс. скорость
        }
      }, 30);
    }

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameOver, gameSpeed, score]);

  // Прыжок
  useEffect(() => {
    if (isJumping) {
      let jumpProgress = 0;
      const jumpInterval = setInterval(() => {
        jumpProgress += 0.12;
        if (jumpProgress <= Math.PI) {
          setPlayerY(Math.sin(jumpProgress) * 120); // Выше прыжок
        } else {
          setPlayerY(0);
          setIsJumping(false);
          clearInterval(jumpInterval);
        }
      }, 18);
      return () => clearInterval(jumpInterval);
    }
  }, [isJumping]);

  // Коллизия (точнее)
  useEffect(() => {
    obstacles.forEach((obs) => {
      if (obs.x > 60 && obs.x < 110 && playerY < 30) {
        // Точнее зона
        setGameOver(true);
        onGameEnd(score, score >= 1000 ? "win" : "lose");
      }
    });
  }, [obstacles, playerY, score, onGameEnd]);

  const handleJump = () => {
    if (!isJumping && !gameOver) {
      setIsJumping(true);
    }
  };

  // Клавиатура
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <div className="space-y-6 animate-bounce-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="rounded-full">
          <Icon name="ArrowLeft" size={20} className="mr-2" />
          Назад
        </Button>
        <Card className="px-4 py-2">
          <p className="text-sm text-muted-foreground">Очки</p>
          <p className="text-2xl font-heading font-bold text-game-cyan">
            {score}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-heading font-bold mb-2">⚡ Бегалка</h2>
          <p className="text-muted-foreground">
            Прыгай через препятствия! Набери 1000 очков
          </p>
        </div>

        <div
          className="relative w-full h-72 bg-gradient-to-b from-sky-200 via-sky-100 to-green-200 rounded-2xl overflow-hidden cursor-pointer border-4 border-cyan-300 shadow-xl"
          onClick={handleJump}
          onTouchStart={handleJump}
        >
          {/* Облака */}
          <div
            className="absolute top-8 left-8 text-5xl animate-float"
            style={{ animationDelay: "0s" }}
          >
            ☁️
          </div>
          <div
            className="absolute top-16 right-24 text-4xl animate-float"
            style={{ animationDelay: "1s" }}
          >
            ☁️
          </div>
          <div
            className="absolute top-10 left-1/2 text-5xl animate-float"
            style={{ animationDelay: "2s" }}
          >
            ☁️
          </div>
          <div
            className="absolute top-20 left-1/3 text-3xl animate-float"
            style={{ animationDelay: "1.5s" }}
          >
            ☁️
          </div>

          {/* Земля */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-green-700 via-green-600 to-green-400 rounded-b-2xl">
            <div className="absolute top-0 left-0 right-0 h-3 bg-green-900/40 shadow-inner" />
            <div className="flex gap-12 absolute top-2 left-0 w-full overflow-hidden">
              {Array.from({ length: 30 }).map((_, i) => (
                <span
                  key={i}
                  className="text-green-900 text-base animate-move-left"
                  style={{ animationDuration: `${8 + gameSpeed * 0.5}s` }}
                >
                  🌱
                </span>
              ))}
            </div>
          </div>

          {/* ✅ 2. ЧЕЛОВЕЧЕК ОТЗЕРКАЛЕН + АНИМАЦИЯ НОГ */}
          <div
            className="absolute w-20 h-20 flex items-center justify-center text-5xl transition-all duration-150 z-20 shadow-2xl"
            style={{
              left: "80px", // Слева (бежит вправо)
              bottom: `${85 + playerY}px`,
              transform: `
                scaleX(-1) 
                ${isJumping ? "rotate(-20deg) scale(1.15)" : "rotate(5deg) scale(1.05)"}
              `,
            }}
          >
            <div className="relative">
              <div className="text-4xl">🏃‍♂️</div>

              {/* Анимация ног */}
              <div
                className="absolute -bottom-4 left-1/2 w-12 h-3 bg-yellow-400/80 rounded-full blur-sm shadow-lg"
                style={{
                  transform: `translateX(-50%) translateY(${Math.sin(runAnimation) * 8}px) scaleX(${1 + Math.cos(runAnimation) * 0.2})`,
                  opacity: isJumping ? 0 : 1,
                  display: isJumping ? "none" : "block",
                }}
              />
            </div>
          </div>

          {/* ✅ 3. МЕНЬШИЕ ПРЕПЯТСТВИЯ */}
          {obstacles.map((obs) => (
            <div
              key={obs.id}
              className="absolute flex flex-col items-center z-10"
              style={{
                left: `${obs.x}px`,
                bottom: "82px",
              }}
            >
              {/* Меньше размер */}
              <div className="w-10 h-14 bg-gradient-to-b from-red-400 via-red-500 to-red-700 rounded-t-xl border-2 border-red-900 shadow-xl relative animate-shake">
                <div className="absolute inset-1.5 bg-red-200/30 rounded-lg" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl">
                  ⚠️
                </div>
              </div>
              <div className="w-12 h-2.5 bg-red-900 rounded-b-lg shadow-lg mt-0.5" />
            </div>
          ))}

          {/* Game Over */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-md rounded-2xl z-30">
              <div className="text-white text-center space-y-6 p-10 bg-gradient-to-br from-gray-900/90 to-black/90 rounded-2xl border-2 border-cyan-500/50 shadow-2xl">
                <p className="text-6xl animate-bounce">💥</p>
                <p className="text-4xl font-heading font-bold">
                  Игра окончена!
                </p>
                <p className="text-3xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-bold">
                  {score}
                </p>
                <p className="text-xl text-cyan-300">
                  ⚡ Скорость: {gameSpeed.toFixed(1)}x
                </p>
              </div>
            </div>
          )}

          {/* Счетчик скорости */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-cyan-400 shadow-xl z-20">
            <p className="text-sm font-heading font-bold text-cyan-600">
              ⚡ {gameSpeed.toFixed(1)}x
            </p>
          </div>
        </div>

        {!gameOver && (
          <div className="mt-4 text-center space-y-2">
            <Button
              className="bg-game-cyan hover:bg-game-cyan/90 text-white font-heading text-xl px-10 py-6 rounded-full shadow-xl w-full max-w-xs mx-auto"
              onClick={handleJump}
            >
              <Icon name="MoveUp" size={24} className="mr-2" />
              Прыгнуть
            </Button>
            <p className="text-sm text-muted-foreground">
              Кликни экран, кнопку или{" "}
              <kbd className="bg-muted px-2 py-1 rounded font-mono text-xs">
                Пробел
              </kbd>
            </p>
          </div>
        )}
      </Card>

      <style jsx>{`
        @keyframes move-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100px);
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-2px);
          }
          75% {
            transform: translateX(2px);
          }
        }
        .animate-move-left {
          animation: move-left linear infinite;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default RunnerGame;
