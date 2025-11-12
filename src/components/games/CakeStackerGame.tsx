import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

interface GameProps {
  onGameEnd: (score: number, result: "win" | "lose") => void;
  onBack: () => void;
}

interface StackedCake {
  position: number; // в % от ширины контейнера
  width: number; // в px
}

const CakeStackerGame = ({ onGameEnd, onBack }: GameProps) => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [cameraY, setCameraY] = useState(0);

  const [currentCakeX, setCurrentCakeX] = useState(50);
  const [currentCakeY, setCurrentCakeY] = useState(80); // анимируемая позиция Y
  const [isSwinging, setIsSwinging] = useState(true);
  const [isDropping, setIsDropping] = useState(false);

  const [stackedCakes, setStackedCakes] = useState<StackedCake[]>([
    { position: 50, width: 140 },
  ]);
  const [currentWidth, setCurrentWidth] = useState(140);

  const swingInterval = useRef<NodeJS.Timeout | null>(null);
  const dropAnimationFrame = useRef<number | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const CONTAINER_HEIGHT = 500;
  const CAKE_HEIGHT = 40;
  const GROUND_HEIGHT = 20;
  const SWING_Y = 80;
  const DROP_SPEED = 18; // УСКОРЯЕМ ПАДЕНИЕ
  const WIN_THRESHOLD = 15;
  const CAMERA_START = 5;

  // === КАЧАНИЕ ===
  useEffect(() => {
    if (!gameOver && isSwinging && !isDropping) {
      let direction = 1;
      const speed = 0.9;
      const minX = 30;
      const maxX = 70;

      swingInterval.current = setInterval(() => {
        setCurrentCakeX((prev) => {
          let newX = prev + speed * direction;
          if (newX >= maxX || newX <= minX) {
            direction *= -1;
            newX = Math.max(minX, Math.min(maxX, newX));
          }
          return newX;
        });
      }, 20);
    }

    return () => {
      if (swingInterval.current) clearInterval(swingInterval.current);
    };
  }, [isSwinging, isDropping, gameOver]);

  // === ПАДЕНИЕ С БЫСТРОЙ АНИМАЦИЕЙ ===
  const handleDrop = () => {
    if (gameOver || isDropping || !isSwinging) return;

    setIsDropping(true);
    setIsSwinging(false);

    const targetY = GROUND_HEIGHT + stackedCakes.length * CAKE_HEIGHT + cameraY;
    let currentY = SWING_Y;

    const drop = () => {
      currentY += DROP_SPEED;
      setCurrentCakeY(currentY);

      if (currentY >= targetY) {
        setCurrentCakeY(targetY);
        cancelAnimationFrame(dropAnimationFrame.current!);
        stackCake();
        return;
      }

      dropAnimationFrame.current = requestAnimationFrame(drop);
    };

    dropAnimationFrame.current = requestAnimationFrame(drop);
  };

  // === СТЕКАНИЕ ===
  const stackCake = () => {
    const containerWidth = gameAreaRef.current?.offsetWidth || 600;
    const lastCake = stackedCakes[stackedCakes.length - 1];
    const currentCenterPx = (currentCakeX / 100) * containerWidth;
    const lastCenterPx = (lastCake.position / 100) * containerWidth;

    const leftEdge = currentCenterPx - currentWidth / 2;
    const rightEdge = currentCenterPx + currentWidth / 2;
    const lastLeft = lastCenterPx - lastCake.width / 2;
    const lastRight = lastCenterPx + lastCake.width / 2;

    const overlapLeft = Math.max(leftEdge, lastLeft);
    const overlapRight = Math.min(rightEdge, lastRight);
    const overlapWidth = Math.max(0, overlapRight - overlapLeft);

    if (overlapWidth < 15) {
      setGameOver(true);
      return;
    }

    const newScore = score + 1;
    setScore(newScore);

    const newPosition =
      ((overlapLeft + overlapRight) / 2 / containerWidth) * 100;
    const newStacked = [
      ...stackedCakes,
      { position: newPosition, width: overlapWidth },
    ];
    setStackedCakes(newStacked);
    setCurrentWidth(overlapWidth);

    let newCameraY = cameraY;
    if (newStacked.length >= CAMERA_START) {
      newCameraY = cameraY + CAKE_HEIGHT;
    }
    setCameraY(newCameraY);

    // === ВОЗВРАЩАЕМ ТОРТИК НА СТАРТ ===
    setTimeout(() => {
      setCurrentCakeY(SWING_Y);
      setCurrentCakeX(Math.random() * 30 + 35);
      setIsSwinging(true);
      setIsDropping(false);
    }, 400); // чуть быстрее
  };

  // === ОКОНЧАНИЕ ===
  useEffect(() => {
    if (gameOver) {
      const result = score >= WIN_THRESHOLD ? "win" : "lose";
      onGameEnd(score, result);
    }
  }, [gameOver, score, onGameEnd]);

  const COLORS = [
    "#FF6B9D",
    "#FFA629",
    "#4ECDC4",
    "#FFE66D",
    "#C44569",
    "#6C5CE7",
  ];

  return (
    <div className="space-y-6 animate-bounce-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="rounded-full">
          <Icon name="ArrowLeft" size={20} className="mr-2" />
          Назад
        </Button>
        <Card className="px-4 py-2">
          <p className="text-sm text-muted-foreground">Очки</p>
          <p className="text-2xl font-heading font-bold text-game-orange">
            {score}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-heading font-bold mb-2">
            Стакер тортиков
          </h2>
          <p className="text-muted-foreground">
            Стакай коржи точно друг на друга!
          </p>
        </div>
        <div
          ref={gameAreaRef}
          className="relative w-full h-[500px] bg-gradient-to-b from-sky-100 via-pink-50 to-yellow-50 rounded-2xl overflow-hidden border-4 border-purple-200 shadow-2xl"
          style={{ perspective: "1000px" }}
        >
          {/* КАМЕРА — БАШНЯ УХОДИТ ВНИЗ */}
          <div
            className="absolute inset-0"
            style={{ transform: `translateY(${cameraY}px)` }}
          >
            {stackedCakes.map((cake, index) => (
              <div
                key={index}
                className="absolute flex items-center justify-center text-3xl shadow-2xl"
                style={{
                  bottom: `${GROUND_HEIGHT + index * CAKE_HEIGHT}px`,
                  left: `${cake.position}%`,
                  width: `${cake.width}px`,
                  height: "40px",
                  background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`,
                  transform: "translateX(-50%)",
                  borderRadius: "16px",
                  border: "4px solid rgba(255,255,255,0.9)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                  zIndex: stackedCakes.length - index,
                }}
              >
                {index === 0 ? "Торт" : "Тортик"}
              </div>
            ))}

            <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-400 rounded-b-xl shadow-lg" />
          </div>

          {/* ПАДАЮЩИЙ ТОРТИК — С РЕАЛЬНОЙ АНИМАЦИЕЙ */}
          {(isSwinging || isDropping) && !gameOver && (
            <div
              className="absolute flex items-center justify-center text-4xl font-bold shadow-2xl z-50"
              style={{
                top: `${currentCakeY}px`,
                left: `${currentCakeX}%`,
                width: `${currentWidth}px`,
                height: "40px",
                background: `linear-gradient(135deg, ${COLORS[stackedCakes.length % COLORS.length]}, ${COLORS[(stackedCakes.length + 1) % COLORS.length]})`,
                transform: `
                  translateX(-50%) 
                  rotate(${isSwinging ? (currentCakeX > 50 ? -3 : 3) : 0}deg)
                  scale(${isDropping ? 1.08 : 1})
                `,
                borderRadius: "16px",
                border: "4px solid rgba(255,255,255,0.9)",
                boxShadow: isDropping
                  ? "0 20px 50px rgba(0,0,0,0.4), 0 0 30px rgba(255,255,255,0.6)"
                  : "0 8px 32px rgba(0,0,0,0.2)",
                transition: "none", // АНИМАЦИЯ ЧЕРЕЗ requestAnimationFrame
              }}
            >
              Тортик
            </div>
          )}

          {/* ЭКРАН ОКОНЧАНИЯ */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-md rounded-2xl z-50">
              <div className="text-white text-center space-y-6 p-12 bg-gradient-to-b from-purple-900/90 to-pink-900/90 rounded-3xl border-4 border-white/20">
                <p className="text-7xl animate-bounce">Торт</p>
                <p className="text-4xl font-heading font-bold tracking-wide">
                  Игра окончена!
                </p>
                <div className="space-y-2">
                  <p className="text-3xl">
                    Башня из {stackedCakes.length} тортиков
                  </p>
                  <p className="text-2xl text-yellow-300 font-bold">
                    Очки: {score}
                  </p>
                </div>
                {score >= WIN_THRESHOLD && (
                  <p className="text-3xl text-green-300 font-bold animate-pulse">
                    ПОБЕДА!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        {/* КНОПКА */}
        _rc{" "}
        {!gameOver && (
          <Button
            className="w-full mt-6 bg-gradient-to-r from-game-orange to-pink-500 hover:from-game-orange/90 hover:to-pink-500/90 text-white font-heading text-xl py-8 rounded-2xl shadow-2xl border-2 border-white/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleDrop}
            disabled={isDropping || !isSwinging}
          >
            <Icon name="MousePointerClick" size={24} className="mr-3" />
            {isDropping ? "Тортик Падает..." : "Тортик Сбросить тортик!"}
          </Button>
        )}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xl font-heading text-muted-foreground">
            Уровень: {stackedCakes.length}
          </p>
          <p className="text-lg font-heading">
            {stackedCakes.length >= WIN_THRESHOLD
              ? "Рекорд! Продолжай!"
              : `Цель: ${WIN_THRESHOLD}+ тортиков`}
          </p>
          <p className="text-sm text-muted-foreground">
            Жди идеального момента!
          </p>
        </div>
      </Card>
    </div>
  );
};

export default CakeStackerGame;
