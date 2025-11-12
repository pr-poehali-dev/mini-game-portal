import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

interface GameProps {
  onGameEnd: (score: number, result: "win" | "lose") => void;
  onBack: () => void;
}

interface StackedCake {
  position: number;
  width: number;
}

interface FallingPiece {
  id: number;
  left: number; // в px
  width: number;
  side: "left" | "right";
  rotation: number;
  velocityY: number;
  velocityX: number;
}

const CakeStackerGame = ({ onGameEnd, onBack }: GameProps) => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const [currentCakeX, setCurrentCakeX] = useState(50);
  const [currentCakeY, setCurrentCakeY] = useState(50);
  const [isSwinging, setIsSwinging] = useState(true);
  const [isDropping, setIsDropping] = useState(false);

  const [stackedCakes, setStackedCakes] = useState<StackedCake[]>([
    { position: 50, width: 120 },
  ]);
  const [currentWidth, setCurrentWidth] = useState(120);
  const [fallingPieces, setFallingPieces] = useState<FallingPiece[]>([]);

  const swingInterval = useRef<NodeJS.Timeout | null>(null);
  const dropInterval = useRef<NodeJS.Timeout | null>(null);
  const pieceIdCounter = useRef(0);

  const gameAreaRef = useRef<HTMLDivElement>(null);

  // === КАЧАНИЕ ВЛЕВО-ВПРАВО (МЕДЛЕННЕЕ) ===
  useEffect(() => {
    if (!gameOver && isSwinging && !isDropping) {
      let direction = 1;
      const speed = 0.5; // ← МЕДЛЕННЕЕ

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

    dropInterval.current = setInterval(() => {
      setCurrentCakeY((prev) => {
        const newY = prev + 5;
        const targetY = 500 - stackedCakes.length * 40 - 35;

        if (newY >= targetY) {
          clearInterval(dropInterval.current!);
          stackCake();
          return targetY;
        }
        return newY;
      });
    }, 16);
  };

  // === СТЕКАНИЕ + ОТВАЛИВАНИЕ КУСКОВ ===
  const stackCake = () => {
    const containerWidth = 600;
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

    const newWidth = overlapWidth;
    const newScore = score + Math.floor(overlapWidth * 2);
    setScore(newScore);

    const newPieces: FallingPiece[] = [];

    // Левая часть
    if (leftEdge < lastLeft) {
      const pieceWidth = lastLeft - leftEdge;
      if (pieceWidth > 5) {
        newPieces.push({
          id: pieceIdCounter.current++,
          left: leftEdge,
          width: pieceWidth,
          side: "left",
          rotation: 0,
          velocityY: 2 + Math.random() * 3,
          velocityX: -1.5 - Math.random() * 2,
        });
      }
    }

    // Правая часть
    if (rightEdge > lastRight) {
      const pieceWidth = rightEdge - lastRight;
      if (pieceWidth > 5) {
        newPieces.push({
          id: pieceIdCounter.current++,
          left: lastRight,
          width: pieceWidth,
          side: "right",
          rotation: 0,
          velocityY: 2 + Math.random() * 3,
          velocityX: 1.5 + Math.random() * 2,
        });
      }
    }

    if (newPieces.length > 0) {
      setFallingPieces((prev) => [...prev, ...newPieces]);
    }

    const newPosition =
      ((overlapLeft + overlapRight) / 2 / containerWidth) * 100;

    setStackedCakes([
      ...stackedCakes,
      { position: newPosition, width: newWidth },
    ]);
    setCurrentWidth(newWidth);

    if (stackedCakes.length >= 10) {
      setGameOver(true);
      return;
    }

    // Следующий тортик
    setTimeout(() => {
      setCurrentCakeX(Math.random() * 60 + 20);
      setCurrentCakeY(50);
      setIsSwinging(true);
      setIsDropping(false);
    }, 600);
  };

  // === АНИМАЦИЯ ПАДАЮЩИХ КУСКОВ ===
  useEffect(() => {
    if (fallingPieces.length === 0) return;

    const interval = setInterval(() => {
      setFallingPieces((pieces) =>
        pieces
          .map((p) => ({
            ...p,
            left: p.left + p.velocityX,
            rotation: p.rotation + (p.side === "left" ? -8 : 8),
            velocityY: p.velocityY + 0.4,
          }))
          .filter((p) => {
            const y = 500 - stackedCakes.length * 40 + 50;
            return p.velocityY * 16 + 100 < y;
          }),
      );
    }, 16);

    return () => clearInterval(interval);
  }, [fallingPieces.length, stackedCakes.length]);

  // === Окончание игры ===
  useEffect(() => {
    if (gameOver) {
      onGameEnd(score, score >= 500 ? "win" : "lose");
    }
  }, [gameOver, score, onGameEnd]);

  const COLORS = ["#FF6B9D", "#FFA629", "#4ECDC4", "#FFE66D", "#C44569"];

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
          className="relative w-full h-[500px] bg-gradient-to-b from-purple-100 via-pink-50 to-yellow-50 rounded-2xl overflow-hidden border-4 border-purple-200"
        >
          {/* Падающие куски */}
          {fallingPieces.map((piece) => (
            <div
              key={piece.id}
              className="absolute flex items-center justify-center text-xl font-bold shadow-lg"
              style={{
                top: `${500 - stackedCakes.length * 40 + 50}px`,
                left: `${piece.left}px`,
                width: `${piece.width}px`,
                height: "35px",
                background: `linear-gradient(135deg, ${COLORS[stackedCakes.length % COLORS.length]}, ${COLORS[(stackedCakes.length + 1) % COLORS.length]})`,
                transform: `translateY(${piece.velocityY * 16}px) rotate(${piece.rotation}deg)`,
                borderRadius: "8px",
                border: "2px solid rgba(255,255,255,0.7)",
                opacity: 1 - piece.velocityY / 15,
                transition: "none",
              }}
            >
              {piece.width > 30 ? "🍰" : "🧁"}
            </div>
          ))}

          {/* Текущий качающийся/падающий тортик */}
          {(isSwinging || isDropping) && !gameOver && (
            <div
              className="absolute flex items-center justify-center text-3xl font-bold shadow-2xl transition-all duration-75"
              style={{
                top: `${currentCakeY}px`,
                left: `${currentCakeX}%`,
                width: `${currentWidth}px`,
                height: "35px",
                background: `linear-gradient(135deg, ${COLORS[stackedCakes.length % COLORS.length]}, ${COLORS[(stackedCakes.length + 1) % COLORS.length]})`,
                transform: `translateX(-50%) rotate(${isSwinging ? (currentCakeX > 50 ? -3 : 3) : 0}deg)`,
                borderRadius: "12px",
                border: "3px solid rgba(255,255,255,0.8)",
              }}
            >
              🍰
            </div>
          )}

          {/* Стопка тортиков */}
          {stackedCakes.map((cake, index) => (
            <div
              key={index}
              className="absolute flex items-center justify-center text-2xl shadow-xl"
              style={{
                bottom: `${index * 40}px`,
                left: `${cake.position}%`,
                width: `${cake.width}px`,
                height: "35px",
                background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`,
                transform: "translateX(-50%)",
                borderRadius: "12px",
                border: "3px solid rgba(255,255,255,0.8)",
              }}
            >
              {index === 0 ? "🎂" : "🍰"}
            </div>
          ))}

          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-game-pink via-game-orange to-game-cyan rounded-b-xl" />

          {/* Экран окончания */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm rounded-2xl">
              <div className="text-white text-center space-y-4 p-8 bg-black/40 rounded-xl">
                <p className="text-5xl">🎂</p>
                <p className="text-4xl font-heading font-bold">
                  Игра окончена!
                </p>
                <p className="text-2xl">
                  Башня из {stackedCakes.length} тортиков
                </p>
                <p className="text-xl text-yellow-300">Очки: {score}</p>
              </div>
            </div>
          )}
        </div>

        {/* Кнопка сброса */}
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
