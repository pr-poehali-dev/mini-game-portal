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

const CakeStackerGame = ({ onGameEnd, onBack }: GameProps) => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Текущий тортик
  const [currentCakeX, setCurrentCakeX] = useState(50); // центр в %
  const [currentCakeY, setCurrentCakeY] = useState(50); // фиксированная высота сверху
  const [isSwinging, setIsSwinging] = useState(true); // качается
  const [isDropping, setIsDropping] = useState(false); // падает

  const [stackedCakes, setStackedCakes] = useState<StackedCake[]>([
    { position: 50, width: 120 },
  ]);
  const [currentWidth, setCurrentWidth] = useState(120);

  const swingInterval = useRef<NodeJS.Timeout | null>(null);
  const dropInterval = useRef<NodeJS.Timeout | null>(null);

  // === КАЧАНИЕ ВЛЕВО-ВПРАВО ===
  useEffect(() => {
    if (!gameOver && isSwinging && !isDropping) {
      let direction = 1;
      const speed = 0.8;

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

  // === СТЕКАНИЕ ===
  const stackCake = () => {
    const lastCake = stackedCakes[stackedCakes.length - 1];
    const pixelDiff = Math.abs(
      (currentCakeX / 100) * 600 - (lastCake.position / 100) * 600,
    );
    const overlap = Math.max(0, currentWidth - pixelDiff);

    if (overlap < 15) {
      setGameOver(true);
      return;
    }

    const newWidth = overlap;
    const newScore = score + Math.floor(overlap * 2);
    setScore(newScore);
    setStackedCakes([
      ...stackedCakes,
      { position: currentCakeX, width: newWidth },
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
    }, 500);
  };

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

        <div className="relative w-full h-[500px] bg-gradient-to-b from-purple-100 via-pink-50 to-yellow-50 rounded-2xl overflow-hidden border-4 border-purple-200">
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
