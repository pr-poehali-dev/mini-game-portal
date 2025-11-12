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
  const [gameSpeed, setGameSpeed] = useState(4);
  const obstacleIdRef = useRef(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ АНИМАЦИЯ НОГ (простая, без багов)
  const [legAnim, setLegAnim] = useState(0);

  useEffect(() => {
    if (!gameOver && !isJumping) {
      const legInterval = setInterval(() => {
        setLegAnim((prev) => 1 - prev);
      }, 150);
      return () => clearInterval(legInterval);
    }
  }, [gameOver, isJumping]);

  // ✅ СПАВН ПРЕПЯТСТВИЙ (реже + без наложений)
  useEffect(() => {
    const spawnInterval = setInterval(
      () => {
        if (!gameOver && obstacles.length === 0) {
          setObstacles([{ x: 650, id: obstacleIdRef.current++ }]);
        }
      },
      2000 - gameSpeed * 50,
    ); // 2 сек базово

    return () => clearInterval(spawnInterval);
  }, [gameOver, gameSpeed, obstacles.length]);

  // Игровой цикл
  useEffect(() => {
    if (!gameOver) {
      gameLoopRef.current = setInterval(() => {
        setObstacles((prev) =>
          prev
            .map((obs) => ({ ...obs, x: obs.x - gameSpeed }))
            .filter((obs) => obs.x > -60),
        );
        setScore((s) => s + 1);

        if (score % 200 === 0 && score > 0) {
          setGameSpeed((s) => Math.min(s + 0.2, 7));
        }
      }, 30);
    }

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameOver, gameSpeed, score]);

  // ✅ ПРЫЖОК (как было, но выше)
  useEffect(() => {
    if (isJumping) {
      let jumpProgress = 0;
      const jumpInterval = setInterval(() => {
        jumpProgress += 0.1;
        if (jumpProgress <= Math.PI) {
          setPlayerY(Math.sin(jumpProgress) * 140); // Выше!
        } else {
          setPlayerY(0);
          setIsJumping(false);
          clearInterval(jumpInterval);
        }
      }, 20);
      return () => clearInterval(jumpInterval);
    }
  }, [isJumping]);

  // ✅ КОЛЛИЗИЯ (точно настроена!)
  useEffect(() => {
    if (gameOver) return;

    for (const obs of obstacles) {
      // Препятствие: 70-120px, игрок на земле: playerY < 20
      if (obs.x > 70 && obs.x < 120 && playerY < 25) {
        setGameOver(true);
        onGameEnd(score, score >= 1000 ? "win" : "lose");
        break;
      }
    }
  }, [obstacles, playerY, score, onGameEnd, gameOver]);

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
        >
          {/* Облака */}
          <div className="absolute top-8 left-8 text-5xl animate-float">☁️</div>
          <div
            className="absolute top-16 right-24 text-4xl animate-float"
            style={{ animationDelay: "1s" }}
          >
            ☁️
          </div>

          {/* Земля */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-green-700 via-green-600 to-green-400 rounded-b-2xl">
            <div className="absolute top-0 left-0 right-0 h-3 bg-green-900/40 shadow-inner" />
            <div className="flex gap-10 absolute top-2 left-0 w-full overflow-hidden">
              {Array.from({ length: 30 }).map((_, i) => (
                <span key={i} className="text-green-900 text-lg">
                  🌱
                </span>
              ))}
            </div>
          </div>

          {/* ✅ ЧЕЛОВЕЧЕК (отзеркален + анимация ног) */}
          <div
            className="absolute w-20 h-20 flex items-center justify-center text-6xl transition-all duration-200 z-20 shadow-2xl"
            style={{
              left: "75px",
              bottom: `${85 + playerY}px`,
              transform: `scaleX(-1) ${isJumping ? "scale(1.1)" : "scale(1)"}`,
            }}
          >
            <div className="relative">
              🏃
              {/* ✅ ПРОСТАЯ АНИМАЦИЯ НОГ */}
              <div
                className="absolute -bottom-2 left-2 w-3 h-6 bg-skin-400 rounded-l-full"
                style={{
                  transform: `rotate(${legAnim ? "25deg" : "-25deg"}) translateY(2px)`,
                  transition: "transform 0.15s ease-out",
                }}
              />
              <div
                className="absolute -bottom-2 right-2 w-3 h-6 bg-skin-400 rounded-r-full"
                style={{
                  transform: `rotate(${legAnim ? "-25deg" : "25deg"}) translateY(2px)`,
                  transition: "transform 0.15s ease-out",
                }}
              />
              {/* Тень */}
              <div
                className="absolute -bottom-1 left-1/2 w-12 h-2 bg-black/30 rounded-full blur-sm"
                style={{
                  transform: "translateX(-50%)",
                  opacity: Math.max(0.3, 1 - playerY / 150),
                }}
              />
            </div>
          </div>

          {/* ✅ МЕНЬШИЕ ПРЕПЯТСТВИЯ */}
          {obstacles.map((obs) => (
            <div
              key={obs.id}
              className="absolute z-10"
              style={{
                left: `${obs.x}px`,
                bottom: "80px",
              }}
            >
              <div className="w-10 h-12 bg-gradient-to-b from-red-400 to-red-600 rounded-t-xl border-2 border-red-900 shadow-xl relative">
                <div className="absolute inset-1 bg-red-200/50 rounded-lg" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl">
                  ⚠️
                </div>
              </div>
              <div className="w-12 h-2 bg-red-900 rounded-b-lg mx-1 shadow-lg" />
            </div>
          ))}

          {/* Game Over */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-md rounded-2xl z-30">
              <div className="text-white text-center space-y-4 p-8 bg-black/50 rounded-xl border-2 border-cyan-500/50">
                <p className="text-5xl">💥</p>
                <p className="text-4xl font-heading font-bold">
                  Игра окончена!
                </p>
                <p className="text-2xl text-cyan-300">{score} очков</p>
              </div>
            </div>
          )}

          <div className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full border border-cyan-400 text-xs font-bold text-cyan-600">
            {gameSpeed.toFixed(1)}x
          </div>
        </div>

        {!gameOver && (
          <div className="mt-4 text-center">
            <Button
              className="w-full bg-game-cyan hover:bg-game-cyan/90 text-white font-heading text-xl py-6 rounded-full shadow-lg"
              onClick={handleJump}
            >
              <Icon name="MoveUp" size={24} className="mr-2" />
              Прыгнуть (или кликни экран / пробел)
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RunnerGame;
