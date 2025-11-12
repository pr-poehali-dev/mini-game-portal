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
      </div>{" "}
      <Card className="p-6">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-heading font-bold mb-2"> Бегалка</h2>
          <p className="text-muted-foreground">
            Прыгай через препятствия! Набери 1000 очков
          </p>
        </div>

        <div
          className="relative w-full h-72 bg-gradient-to-b from-sky-200 via-sky-100 to-green-200 rounded-2xl overflow-hidden cursor-pointer border-4 border-cyan-300 shadow-xl"
          onClick={handleJump}
        >
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
          <div
            className="absolute top-20 left-1/3 text-3xl animate-float"
            style={{ animationDelay: "1.5s" }}
          ></div>

          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-green-700 via-green-600 to-green-400 rounded-b-2xl">
            <div className="absolute top-0 left-0 right-0 h-3 bg-green-900/40 shadow-inner" />
            <div className="flex gap-12 absolute top-2 left-0 w-full overflow-hidden">
              {Array.from({ length: 30 }).map((_, i) => (
                <span key={i} className="text-green-900 text-base"></span>
              ))}
            </div>
          </div>

          <div
            className="absolute w-16 h-16 flex items-center justify-center text-5xl transition-transform duration-100 z-20"
            style={{
              left: "90px",
              bottom: `${80 + playerY}px`,
              transform: isJumping
                ? "rotate(-15deg) scale(1.1)"
                : "rotate(0deg) scale(1)",
            }}
          >
            <div className="relative">
              <div
                className="absolute -bottom-3 left-1/2 w-10 h-2 bg-black/20 rounded-full blur-sm"
                style={{
                  transform: `translateX(-50%) scale(${1 - playerY / 150})`,
                  opacity: 1 - playerY / 150,
                }}
              />
            </div>
          </div>

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
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl"></div>
              </div>
              <div className="w-14 h-3 bg-red-900 rounded-b-lg shadow-lg" />
            </div>
          ))}

          {gameOver && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm rounded-2xl z-30">
              <div className="text-white text-center space-y-4 p-8 bg-black/40 rounded-xl">
                <p className="text-5xl"></p>
                <p className="text-5xl font-heading font-bold">
                  Игра окончена!
                </p>
                <p className="text-2xl">Счёт: {score}</p>
              </div>
            </div>
          )}

          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border-3 border-cyan-400 shadow-lg z-20">
            <p className="text-sm font-heading font-bold text-cyan-600">
              {" "}
              Скорость: {gameSpeed.toFixed(1)}x
            </p>
          </div>
        </div>

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
