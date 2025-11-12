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
  const [gameSpeed, setGameSpeed] = useState(5);
  const [runFrame, setRunFrame] = useState(0); // 0, 1, 2, 3

  const obstacleIdRef = useRef(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // === АНИМАЦИЯ БЕГА (через спрайт) ===
  useEffect(() => {
    if (gameOver || isJumping) {
      setRunFrame(0); // фиксируем первый кадр при прыжке/проигрыше
      return;
    }

    const interval = setInterval(() => {
      setRunFrame((prev) => (prev + 1) % 4);
    }, 120); // ~8 fps — подбери под ритм

    return () => clearInterval(interval);
  }, [gameOver, isJumping]);

  // === Генерация препятствий ===
  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameOver) {
        setObstacles((prev) => [
          ...prev.filter((obs) => obs.x > -50),
          ...(Math.random() < 0.02
            ? [{ x: 600, id: obstacleIdRef.current++ }]
            : []),
        ]);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [gameOver]);

  // === Основной игровой цикл ===
  useEffect(() => {
    if (!gameOver) {
      gameLoopRef.current = setInterval(() => {
        setObstacles((prev) =>
          prev.map((obs) => ({ ...obs, x: obs.x - gameSpeed })),
        );
        setScore((s) => s + 1);

        if (score % 100 === 0 && score > 0) {
          setGameSpeed((s) => s + 0.5);
        }
      }, 30);
    }

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameOver, gameSpeed, score]);

  // === Прыжок ===
  useEffect(() => {
    if (isJumping) {
      let jumpProgress = 0;
      const jumpInterval = setInterval(() => {
        jumpProgress += 0.1;
        if (jumpProgress <= Math.PI) {
          setPlayerY(Math.sin(jumpProgress) * 100);
        } else {
          setPlayerY(0);
          setIsJumping(false);
          clearInterval(jumpInterval);
        }
      }, 20);
      return () => clearInterval(jumpInterval);
    }
  }, [isJumping]);

  // === Коллизия ===
  useEffect(() => {
    obstacles.forEach((obs) => {
      if (obs.x > 40 && obs.x < 100 && playerY < 40) {
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

  // === Управление пробелом ===
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isJumping, gameOver]);

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
          <h2 className="text-3xl font-heading font-bold mb-2">Бегалка</h2>
          <p className="text-muted-foreground">
            Прыгай через препятствия! Набери 1000 очков
          </p>
        </div>

        <div
          className="relative w-full h-72 bg-gradient-to-b from-sky-200 via-sky-100 to-green-200 rounded-2xl overflow-hidden cursor-pointer border-4 border-cyan-300 shadow-xl"
          onClick={handleJump}
        >
          {/* Облака */}
          <div
            className="absolute top-8 left-8 text-5xl animate-float"
            style={{ animationDelay: "0s" }}
          >
            Cloud
          </div>
          <div
            className="absolute top-16 right-24 text-4xl animate-float"
            style={{ animationDelay: "1s" }}
          >
            Cloud
          </div>
          <div
            className="absolute top-10 left-1/2 text-5xl animate-float"
            style={{ animationDelay: "2s" }}
          >
            Cloud
          </div>
          <div
            className="absolute top-20 left-1/3 text-3xl animate-float"
            style={{ animationDelay: "1.5s" }}
          >
            Cloud
          </div>

          {/* Земля */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-green-700 via-green-600 to-green-400 rounded-b-2xl">
            <div className="absolute top-0 left-0 right-0 h-3 bg-green-900/40 shadow-inner" />
            <div className="flex gap-12 absolute top-2 left-0 w-full overflow-hidden">
              {Array.from({ length: 30 }).map((_, i) => (
                <span key={i} className="text-green-900 text-base">
                  Seedling
                </span>
              ))}
            </div>
          </div>

          {/* === БЕГУЩИЙ ПЕРСОНАЖ (Base64 СПРАЙТ) === */}
          <div
            className="absolute w-16 h-16 flex items-center justify-center transition-transform duration-100 z-20"
            style={{
              left: "90px",
              bottom: `${80 + playerY}px`,
              transform: isJumping
                ? "rotate(-15deg) scale(1.1)"
                : "rotate(0deg) scale(1)",
            }}
          >
            <div className="relative">
              {/* Встроенный Base64 спрайт (4 кадра бега) */}
              <div
                className="w-16 h-16"
                style={{
                  backgroundImage: `url('data:image/png;base64,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)`,
                  backgroundSize: "400% 100%", // 4 кадра по горизонтали
                  backgroundPosition: `${runFrame * 25}% 0`, // 0%, 25%, 50%, 75%
                  imageRendering: "pixelated", // опционально, для пиксель-арта
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                }}
              />

              {/* Тень под ногами */}
              <div
                className="absolute -bottom-3 left-1/2 w-10 h-2 bg-black/20 rounded-full blur-sm"
                style={{
                  transform: `translateX(-50%) scale(${1 - playerY / 150})`,
                  opacity: 1 - playerY / 150,
                }}
              />
            </div>
          </div>

          {/* Препятствия */}
          {obstacles.map((obs) => (
            <div
              key={obs.id}
              className="absolute flex flex-col items-center z-10"
              style={{
                left: `${obs.x}px`,
                bottom: "80px",
              }}
            >
              <div className="w-12 h-16 bg-gradient-to-b from-red-400 via-red-600 to-red-800 rounded-t-xl border-3 border-red-900 shadow-2xl relative">
                <div className="absolute inset-2 bg-red-300/40 rounded-lg" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl">
                  Warning
                </div>
              </div>
              <div className="w-14 h-3 bg-red-900 rounded-b-lg shadow-lg" />
            </div>
          ))}

          {/* Game Over */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm rounded-2xl z-30">
              <div className="text-white text-center space-y-4 p-8 bg-black/40 rounded-xl">
                <p className="text-5xl">Explosion</p>
                <p className="text-5xl font-heading font-bold">
                  Игра окончена!
                </p>
                <p className="text-2xl">Счёт: {score}</p>
              </div>
            </div>
          )}

          {/* Скорость */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border-3 border-cyan-400 shadow-lg z-20">
            <p className="text-sm font-heading font-bold text-cyan-600">
              Lightning Скорость: {gameSpeed.toFixed(1)}x
            </p>
          </div>
        </div>

        {/* Кнопка прыжка */}
        {!gameOver && (
          <div className="mt-4 text-center">
            <Button
              className="bg-game-cyan hover:bg-game-cyan/90 text-white font-heading text-xl px-8 py-6 rounded-full shadow-lg"
              onClick={handleJump}
            >
              <Icon name="MoveUp" size={24} className="mr-2" />
              Прыгнуть (Пробел)
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Нажми кнопку, экран или пробел для прыжка
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RunnerGame;
