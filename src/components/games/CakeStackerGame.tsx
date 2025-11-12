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

interface FallingPiece {
  id: number;
  left: number; // в px
  top: number; // в px (относительно видимой области)
  width: number;
  side: "left" | "right";
  rotation: number;
  velocityY: number;
  velocityX: number;
}

const CakeStackerGame = ({ onGameEnd, onBack }: GameProps) => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [cameraY, setCameraY] = useState(0); // смещение камеры вверх

  const [currentCakeX, setCurrentCakeX] = useState(50); // в %
  const [currentCakeY, setCurrentCakeY] = useState(80); // начальная высота падающего
  const [isSwinging, setIsSwinging] = useState(true);
  const [isDropping, setIsDropping] = useState(false);

  const [stackedCakes, setStackedCakes] = useState<StackedCake[]>([
    { position: 50, width: 140 },
  ]);
  const [currentWidth, setCurrentWidth] = useState(140);
  const [fallingPieces, setFallingPieces] = useState<FallingPiece[]>([]);

  const swingInterval = useRef<NodeJS.Timeout | null>(null);
  const dropInterval = useRef<NodeJS.Timeout | null>(null);
  const animationFrame = useRef<number | null>(null);
  const pieceIdCounter = useRef(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const CONTAINER_HEIGHT = 500;
  const CAKE_HEIGHT = 40;
  const GROUND_HEIGHT = 20;

  // === КАЧАНИЕ ТОРТИКА ===
  useEffect(() => {
    if (!gameOver && isSwinging && !isDropping) {
      let direction = 1;
      const speed = 0.6;

      swingInterval.current = setInterval(() => {
        setCurrentCakeX((prev) => {
          let newX = prev + speed * direction;
          if (newX >= 85 || newX <= 15) {
            direction *= -1;
            newX = Math.max(15, Math.min(85, newX));
          }
          return newX;
        });
      }, 20);
    }

    return () => {
      if (swingInterval.current) clearInterval(swingInterval.current);
    };
  }, [isSwinging, isDropping, gameOver]);

  // === ПАДЕНИЕ ПО КЛИКУ ===
  const handleDrop = () => {
    if (gameOver || isDropping || !isSwinging) return;

    setIsDropping(true);
    setIsSwinging(false);

    const targetY =
      CONTAINER_HEIGHT -
      GROUND_HEIGHT -
      (stackedCakes.length + 1) * CAKE_HEIGHT +
      cameraY;
    let startY = currentCakeY;

    const drop = () => {
      startY += 8;

      if (startY >= targetY) {
        setCurrentCakeY(targetY);
        cancelAnimationFrame(animationFrame.current!);
        stackCake();
        return;
      }

      setCurrentCakeY(startY);
      animationFrame.current = requestAnimationFrame(drop);
    };

    animationFrame.current = requestAnimationFrame(drop);
  };

  // === СТЕКАНИЕ + ОТВАЛИВАНИЕ + КАМЕРА ===
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

    // === ПРОИГРЫШ: если слишком мало перекрытия ===
    if (overlapWidth < 15) {
      setGameOver(true);
      return;
    }

    // === БАЛЛЫ ===
    const basePoints = Math.floor(overlapWidth * 2);
    const perfectBonus = Math.abs(overlapWidth - lastCake.width) < 2 ? 50 : 0;
    const newScore = score + basePoints + perfectBonus;
    setScore(newScore);

    // === ОТВАЛИВАЮЩИЕСЯ КУСКИ ===
    const newPieces: FallingPiece[] = [];
    const dropY =
      CONTAINER_HEIGHT -
      GROUND_HEIGHT -
      stackedCakes.length * CAKE_HEIGHT +
      cameraY;

    if (leftEdge < lastLeft) {
      const pieceWidth = lastLeft - leftEdge;
      if (pieceWidth > 5) {
        newPieces.push({
          id: pieceIdCounter.current++,
          left: leftEdge,
          top: dropY - 35,
          width: pieceWidth,
          side: "left",
          rotation: 0,
          velocityY: 0,
          velocityX: -2 - Math.random() * 2,
        });
      }
    }

    if (rightEdge > lastRight) {
      const pieceWidth = rightEdge - lastRight;
      if (pieceWidth > 5) {
        newPieces.push({
          id: pieceIdCounter.current++,
          left: lastRight,
          top: dropY - 35,
          width: pieceWidth,
          side: "right",
          rotation: 0,
          velocityY: 0,
          velocityX: 2 + Math.random() * 2,
        });
      }
    }

    if (newPieces.length > 0) {
      setFallingPieces((prev) => [...prev, ...newPieces]);
    }

    // === НОВЫЙ ТОРТИК В СТЕКЕ ===
    const newPosition =
      ((overlapLeft + overlapRight) / 2 / containerWidth) * 100;
    const newStacked = [
      ...stackedCakes,
      { position: newPosition, width: overlapWidth },
    ];
    setStackedCakes(newStacked);
    setCurrentWidth(overlapWidth);

    // === ПОДЪЁМ КАМЕРЫ ===
    const stackHeight = newStacked.length * CAKE_HEIGHT;
    const visibleHeight = CONTAINER_HEIGHT - GROUND_HEIGHT;
    if (stackHeight > visibleHeight) {
      setCameraY(stackHeight - visibleHeight);
    }

    // === ПОБЕДА / ПРОДОЛЖЕНИЕ ===
    if (newStacked.length >= 10) {
      setGameOver(true);
      return;
    }

    // === СЛЕДУЮЩИЙ ТОРТИК ===
    setTimeout(() => {
      setCurrentCakeX(Math.random() * 50 + 25);
      setCurrentCakeY(80 - cameraY); // относительно камеры
      setIsSwinging(true);
      setIsDropping(false);
    }, 700);
  };

  // === АНИМАЦИЯ ПАДАЮЩИХ КУСКОВ ===
  useEffect(() => {
    if (fallingPieces.length === 0) return;

    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = Math.min(time - lastTime, 50);
      lastTime = time;

      setFallingPieces((pieces) =>
        pieces
          .map((p) => ({
            ...p,
            top: p.top + p.velocityY * (delta / 16),
            left: p.left + p.velocityX * (delta / 16),
            rotation:
              p.rotation + (p.side === "left" ? -10 : 10) * (delta / 16),
            velocityY: p.velocityY + 0.5 * (delta / 16),
          }))
          .filter((p) => p.top < CONTAINER_HEIGHT + 100),
      );

      if (fallingPieces.length > 0) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [fallingPieces.length]);

  // === ОКОНЧАНИЕ ИГРЫ ===
  useEffect(() => {
    if (gameOver) {
      onGameEnd(score, score >= 500 ? "win" : "lose");
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
          className="relative w-full h-[500px] bg-gradient-to-b from-sky-100 via-pink-50 to-yellow-50 rounded-2xl overflow-hidden border-4 border-purple-200"
          style={{ perspective: "1000px" }}
        >
          <div
            className="absolute inset-0 transition-transform duration-300"
            style={{ transform: `translateY(-${cameraY}px)` }}
          >
            {/* ПАДАЮЩИЕ КУСКИ */}
            {fallingPieces.map((piece) => (
              <div
                key={piece.id}
                className="absolute flex items-center justify-center text-xl font-bold shadow-lg pointer-events-none"
                style={{
                  top: `${piece.top}px`,
                  left: `${piece.left}px`,
                  width: `${piece.width}px`,
                  height: "35px",
                  background: `linear-gradient(135deg, ${COLORS[stackedCakes.length % COLORS.length]}, ${COLORS[(stackedCakes.length + 1) % COLORS.length]})`,
                  transform: `rotate(${piece.rotation}deg) scale(${1 - piece.velocityY / 20})`,
                  borderRadius: "8px",
                  border: "2px solid rgba(255,255,255,0.7)",
                  opacity: Math.max(0, 1 - piece.velocityY / 15),
                  transition: "none",
                }}
              >
                {piece.width > 30 ? "Cake" : "Cupcake"}
              </div>
            ))}

            {/* ТЕКУЩИЙ ПАДАЮЩИЙ ТОРТИК */}
            {(isSwinging || isDropping) && !gameOver && (
              <div
                className="absolute flex items-center justify-center text-3xl font-bold shadow-2xl"
                style={{
                  top: `${currentCakeY}px`,
                  left: `${currentCakeX}%`,
                  width: `${currentWidth}px`,
                  height: "35px",
                  background: `linear-gradient(135deg, ${COLORS[stackedCakes.length % COLORS.length]}, ${COLORS[(stackedCakes.length + 1) % COLORS.length]})`,
                  transform: `translateX(-50%) rotate(${isSwinging ? (currentCakeX > 50 ? -4 : 4) : 0}deg)`,
                  borderRadius: "12px",
                  border: "3px solid rgba(255,255,255,0.8)",
                  zIndex: 50,
                }}
              >
                Cake
              </div>
            )}

            {/* СТЕК ТОРТИКОВ */}
            {stackedCakes.map((cake, index) => (
              <div
                key={index}
                className="absolute flex items-center justify-center text-2xl shadow-xl"
                style={{
                  bottom: `${GROUND_HEIGHT + index * CAKE_HEIGHT}px`,
                  left: `${cake.position}%`,
                  width: `${cake.width}px`,
                  height: "35px",
                  background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`,
                  transform: "translateX(-50%)",
                  borderRadius: "12px",
                  border: "3px solid rgba(255,255,255,0.8)",
                  zIndex: index,
                }}
              >
                {index === 0 ? "Birthday Cake" : "Cake"}
              </div>
            ))}

            {/* ЗЕМЛЯ */}
            <div
              className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-r from-game-pink via-game-orange to-game-cyan rounded-b-xl"
              style={{ height: `${GROUND_HEIGHT}px` }}
            />
          </div>

          {/* ЭКРАН ОКОНЧАНИЯ */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm rounded-2xl z-50">
              <div className="text-white text-center space-y-4 p-8 bg-black/50 rounded-2xl">
                <p className="text-6xl">Cake</p>
                <p className="text-4xl font-heading font-bold">
                  Игра окончена!
                </p>
                <p className="text-2xl">
                  Башня из {stackedCakes.length} тортиков
                </p>
                <p className="text-xl text-yellow-300">Очки: {score}</p>
                {score >= 500 && <p className="text-green-300">Победа!</p>}
              </div>
            </div>
          )}
        </div>

        {/* КНОПКА */}
        {!gameOver && (
          <Button
            className="w-full mt-4 bg-game-orange hover:bg-game-orange/90 text-white font-heading text-xl py-6 rounded-full shadow-lg"
            onClick={handleDrop}
            disabled={isDropping || !isSwinging}
          >
            <Icon name="MousePointerClick" size={24} className="mr-2" />
            {isDropping ? "Падает..." : "Сбросить тортик!"}
          </Button>
        )}

        <div className="mt-4 text-center">
          <p className="text-lg font-heading text-muted-foreground">
            Уровень: {stackedCakes.length}/10
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Жди, когда тортик будет точно над башней!
          </p>
        </div>
      </Card>
    </div>
  );
};

export default CakeStackerGame;
