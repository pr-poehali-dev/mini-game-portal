import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

interface GameProps {
  onGameEnd: (score: number, result: "win" | "lose") => void;
  onBack: () => void;
}

interface Pipe {
  id: number;
  x: number;
  gapY: number; // центр зазора
  passed: boolean;
}

// Константы
const GRAVITY = 0.6;
const FLAP_STRENGTH = -11;
const PIPE_WIDTH = 80;
const PIPE_GAP = 150;
const PIPE_SPEED = 4;
const BIRD_SIZE = 48;
const GROUND_HEIGHT = 96;
const SKY_HEIGHT = 500;

const FlappyBirdGame = ({ onGameEnd, onBack }: GameProps) => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [birdY, setBirdY] = useState(250);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [isFlapping, setIsFlapping] = useState(false);

  const pipeIdRef = useRef(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // === Генерация труб ===
  useEffect(() => {
    if (gameOver) return;

    const spawnInterval = setInterval(() => {
      setPipes((prev) => [
        ...prev.filter((p) => p.x > -PIPE_WIDTH - 50),
        {
          id: pipeIdRef.current++,
          x: 650,
          gapY: 180 + Math.random() * 140, // от 180 до 320
          passed: false,
        },
      ]);
    }, 2200);

    return () => clearInterval(spawnInterval);
  }, [gameOver]);

  // === Основной игровой цикл ===
  useEffect(() => {
    if (gameOver) return;

    gameLoopRef.current = setInterval(() => {
      // --- Птица ---
      setBirdVelocity((v) => v + GRAVITY);
      setBirdY((y) => {
        const newY = y + birdVelocity;

        // Столкновение с полом или потолком
        if (newY <= 0 || newY >= SKY_HEIGHT - GROUND_HEIGHT - BIRD_SIZE) {
          setGameOver(true);
          onGameEnd(score, score >= 10 ? "win" : "lose");
          return y;
        }
        return newY;
      });

      // --- Трубы ---
      setPipes((prev) =>
        prev.map((pipe) => {
          const newX = pipe.x - PIPE_SPEED;

          // Прохождение трубы
          if (!pipe.passed && pipe.x > 140 && newX <= 140) {
            setScore((s) => s + 1);
            return { ...pipe, x: newX, passed: true };
          }

          return { ...pipe, x: newX };
        }),
      );

      // --- Проверка столкновений с трубами ---
      const birdLeft = 100;
      const birdRight = birdLeft + BIRD_SIZE;
      const birdTop = birdY;
      const birdBottom = birdY + BIRD_SIZE;

      pipes.forEach((pipe) => {
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + PIPE_WIDTH;

        if (birdRight > pipeLeft && birdLeft < pipeRight) {
          const gapTop = pipe.gapY - PIPE_GAP / 2;
          const gapBottom = pipe.gapY + PIPE_GAP / 2;

          if (birdTop < gapTop || birdBottom > gapBottom) {
            setGameOver(true);
            onGameEnd(score, score >= 10 ? "win" : "lose");
          }
        }
      });
    }, 1000 / 60); // 60 FPS

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameOver, birdVelocity, birdY, pipes, score, onGameEnd]);

  // === Взмах крыльями ===
  const flap = () => {
    if (!gameOver) {
      setBirdVelocity(FLAP_STRENGTH);
      setIsFlapping(true);
      setTimeout(() => setIsFlapping(false), 150);
    }
  };

  // === Управление (пробел, клик, тач) ===
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        flap();
      }
    };

    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      flap();
    };

    window.addEventListener("keydown", handleKey);
    const area = gameAreaRef.current;
    area?.addEventListener("touchstart", handleTouch, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKey);
      area?.removeEventListener("touchstart", handleTouch);
    };
  }, [gameOver]);

  return (
    <div className="space-y-6 animate-bounce-in max-w-3xl mx-auto">
      {/* Заголовок и счёт */}
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
          <h2 className="text-3xl font-heading font-bold mb-2">Flappy Bird</h2>
          <p className="text-muted-foreground">
            Лети через трубы! Набери 10 очков
          </p>
        </div>

        {/* Игровое поле */}
        <div
          ref={gameAreaRef}
          className="relative w-full h-96 bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100 rounded-2xl overflow-hidden cursor-pointer border-4 border-cyan-300 shadow-xl select-none"
          onClick={flap}
          onTouchStart={flap}
        >
          {/* Облака */}
          <div className="absolute top-8 left-12 text-5xl animate-float">
            ☁️
          </div>
          <div
            className="absolute top-16 right-32 text-4xl animate-float"
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
            className="absolute top-24 left-1/4 text-3xl animate-float"
            style={{ animationDelay: "1.5s" }}
          >
            ☁️
          </div>

          {/* Земля */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-green-700 via-green-600 to-green-400">
            <div className="absolute top-0 left-0 right-0 h-4 bg-green-900/40 shadow-inner" />
            <div className="flex gap-8 absolute top-3 left-0 w-full overflow-hidden">
              {Array.from({ length: 50 }).map((_, i) => (
                <span key={i} className="text-green-900 text-lg">
                  🌱
                </span>
              ))}
            </div>
          </div>

          {/* Птица */}
          <div
            className="absolute flex items-center justify-center text-4xl transition-transform duration-75 z-20"
            style={{
              left: "100px",
              top: `${birdY}px`,
              width: `${BIRD_SIZE}px`,
              height: `${BIRD_SIZE}px`,
              transform: `rotate(${Math.min(birdVelocity * 3, 90)}deg) scale(${isFlapping ? 1.1 : 1})`,
            }}
          >
            {isFlapping ? "🪶" : "🐦"}
          </div>

          {/* Трубы */}
          {pipes.map((pipe) => (
            <div key={pipe.id}>
              {/* Верхняя труба */}
              <div
                className="absolute bg-gradient-to-b from-green-600 to-green-800 border-4 border-green-900 rounded-b-xl shadow-2xl"
                style={{
                  left: `${pipe.x}px`,
                  top: 0,
                  width: `${PIPE_WIDTH}px`,
                  height: `${pipe.gapY - PIPE_GAP / 2}px`,
                }}
              >
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-green-900 rounded-b-lg shadow-md" />
              </div>

              {/* Нижняя труба */}
              <div
                className="absolute bg-gradient-to-t from-green-600 to-green-800 border-4 border-green-900 rounded-t-xl shadow-2xl"
                style={{
                  left: `${pipe.x}px`,
                  bottom: `${GROUND_HEIGHT}px`,
                  width: `${PIPE_WIDTH}px`,
                  height: `${SKY_HEIGHT - GROUND_HEIGHT - (pipe.gapY + PIPE_GAP / 2)}px`,
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-8 bg-green-900 rounded-t-lg shadow-md" />
              </div>
            </div>
          ))}

          {/* Экран окончания */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm rounded-2xl z-30">
              <div className="text-white text-center space-y-4 p-8 bg-black/50 rounded-2xl border-4 border-white/20">
                <p className="text-6xl animate-pulse">💥</p>
                <p className="text-5xl font-heading font-bold">
                  Игра окончена!
                </p>
                <p className="text-3xl">Счёт: {score}</p>
                <p className="text-xl font-medium">
                  {score >= 10 ? "Победа! Ты мастер!" : "Попробуй ещё раз!"}
                </p>
              </div>
            </div>
          )}

          {/* Индикатор скорости */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border-3 border-cyan-400 shadow-lg z-20">
            <p className="text-sm font-heading font-bold text-cyan-600">
              Скорость: {PIPE_SPEED}x
            </p>
          </div>
        </div>

        {/* Кнопка прыжка */}
        {!gameOver && (
          <div className="mt-4 text-center">
            <Button
              className="bg-game-cyan hover:bg-game-cyan/90 text-white font-heading text-xl px-8 py-6 rounded-full shadow-lg transform transition active:scale-95"
              onClick={flap}
            >
              <Icon name="MoveUp" size={24} className="mr-2" />
              Взмах (Пробел)
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Кликни, нажми пробел или коснись экрана
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FlappyBirdGame;
