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

  const obstacleIdRef = useRef(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const lastObstacleTimeRef = useRef(0);
  const obstacleInterval = 2000; // Новое препятствие каждые 2 секунды

  // === Генерация препятствий по таймеру (по одному) ===
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastObstacleTimeRef.current > obstacleInterval) {
        lastObstacleTimeRef.current = now;
        setObstacles((prev) => [
          ...prev.filter((obs) => obs.x > -100),
          { x: 700, id: obstacleIdRef.current++ },
        ]);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameOver]);

  // === Основной игровой цикл ===
  useEffect(() => {
    if (gameOver) return;

    gameLoopRef.current = setInterval(() => {
      // Двигаем препятствия
      setObstacles((prev) =>
        prev.map((obs) => ({ ...obs, x: obs.x - gameSpeed })),
      );

      // Увеличиваем счёт
      setScore((s) => s + 1);

      // Увеличиваем скорость каждые 300 очков
      if (score > 0 && score % 300 === 0) {
        setGameSpeed((s) => Math.min(s + 0.5, 12)); // Макс. скорость 12
      }
    }, 30);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameOver, gameSpeed, score]);

  // === Прыжок ===
  useEffect(() => {
    if (!isJumping) return;

    let progress = 0;
    const jumpDuration = 600; // мс
    const interval = setInterval(() => {
      progress += 20;
      const t = progress / jumpDuration;
      if (t >= 1) {
        setPlayerY(0);
        setIsJumping(false);
        clearInterval(interval);
      } else {
        setPlayerY(Math.sin(t * Math.PI) * 120); // Высота прыжка 120px
      }
    }, 20);

    return () => clearInterval(interval);
  }, [isJumping]);

  // === Проверка столкновений ===
  useEffect(() => {
    if (isJumping || gameOver) return;

    const playerLeft = 90;
    const playerRight = playerLeft + 50;
    const playerBottom = 80 + playerY;
    const playerTop = playerBottom + 60;

    for (const obs of obstacles) {
      const obsLeft = obs.x;
      const obsRight = obs.x + 40;
      const obsBottom = 80;
      const obsTop = obsBottom + 50;

      if (
        playerRight > obsLeft &&
        playerLeft < obsRight &&
        playerTop > obsBottom &&
        playerBottom < obsTop
      ) {
        setGameOver(true);
        onGameEnd(score, score >= 1000 ? "win" : "lose");
        break;
      }
    }
  }, [obstacles, playerY, isJumping, gameOver, score, onGameEnd]);

  // === Управление ===
  const handleJump = () => {
    if (!isJumping && !gameOver) {
      setIsJumping(true);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
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
          ></div>
          <div
            className="absolute top-16 right-24 text-4xl animate-float"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-10 left-1/2 text-5xl animate-float"
            style={{ animationDelay: "2s" }}
          ></div>

          {/* Земля */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-green-700 via-green-600 to-green-400 rounded-b-2xl">
            <div className="absolute top-0 left-0 right-0 h-3 bg-green-900/40 shadow-inner" />
          </div>

          {/* === БЕГУН === */}
          <div
            className="absolute w-14 h-16 flex flex-col items-center justify-center text-4xl transition-all duration-75 z-20"
            style={{
              left: "90px",
              bottom: `${80 + playerY}px`,
              transform: isJumping
                ? "rotate(-12deg) scale(1.1)"
                : "rotate(0deg) scale(1)",
            }}
          >
            {/* Тень */}
            <div
              className="absolute -bottom-3 left-1/2 w-12 h-2 bg-black/30 rounded-full blur-sm transition-all"
              style={{
                transform: `translateX(-50%) scale(${1 - playerY / 200})`,
                opacity: 1 - playerY / 200,
              }}
            />

            {/* Сам бегун */}
            <div className="relative">
              {/* Тело */}
              <div className="w-10 h-10 bg-yellow-400 rounded-full border-2 border-yellow-600 shadow-md"></div>
              {/* Голова */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-orange-300 rounded-full border-2 border-orange-500"></div>
              {/* Глаза */}
              <div className="absolute top-1 left-2 w-1 h-1 bg-black rounded-full"></div>
              <div className="absolute top-1 right-2 w-1 h-1 bg-black rounded-full"></div>
              {/* Рот */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-1 bg-red-500 rounded-full"></div>

              {/* Руки */}
              <div
                className="absolute top-6 -left-1 w-3 h-5 bg-yellow-400 rounded-full border border-yellow-600 origin-bottom-left"
                style={{
                  transform: isJumping ? "rotate(45deg)" : "rotate(-20deg)",
                  transition: "transform 0.1s",
                }}
              ></div>
              <div
                className="absolute top-6 -right-1 w-3 h-5 bg-yellow-400 rounded-full border border-yellow-600 origin-bottom-right"
                style={{
                  transform: isJumping ? "rotate(-45deg)" : "rotate(20deg)",
                  transition: "transform 0.1s",
                }}
              ></div>

              {/* Ноги */}
              <div className="absolute bottom-0 left-1 w-3 h-5 bg-blue-600 rounded-b-md border border-blue-800"></div>
              <div className="absolute bottom-0 right-1 w-3 h-5 bg-blue-600 rounded-b-md border border-blue-800"></div>
            </div>
          </div>

          {/* === Препятствия (меньше, аккуратнее) === */}
          {obstacles.map((obs) => (
            <div
              key={obs.id}
              className="absolute z-10"
              style={{
                left: `${obs.x}px`,
                bottom: "80px",
              }}
            >
              <div className="w-10 h-12 bg-gradient-to-b from-red-500 to-red-700 rounded-t-md border-2 border-red-800 shadow-lg relative overflow-hidden">
                <div className="absolute inset-1 bg-red-400/50 rounded-sm"></div>
                <div className="absolute top-1 left-1 w-2 h-2 bg-white/40 rounded-full"></div>
                <div className="absolute top-1 right-1 w-2 h-2 bg-white/40 rounded-full"></div>
              </div>
              <div className="w-12 h-2 bg-red-900 rounded-b-md -mt-1 shadow"></div>
            </div>
          ))}

          {/* === Экран окончания === */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm rounded-2xl z-30">
              <div className="text-white text-center space-y-4 p-8 bg-black/50 rounded-xl">
                <p className="text-5xl"></p>
                <p className="text-5xl font-heading font-bold">
                  Игра окончена!
                </p>
                <p className="text-2xl">Счёт: {score}</p>
                <p className="text-xl text-yellow-300">
                  {score >= 1000 ? "Победа!" : "Попробуй ещё!"}
                </p>
              </div>
            </div>
          )}

          {/* Скорость */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border-3 border-cyan-400 shadow-lg z-20">
            <p className="text-sm font-heading font-bold text-cyan-600">
              Скорость: {gameSpeed.toFixed(1)}x
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
