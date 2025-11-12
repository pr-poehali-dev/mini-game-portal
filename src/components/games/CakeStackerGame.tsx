import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface GameProps {
  onGameEnd: (score: number, result: 'win' | 'lose') => void;
  onBack: () => void;
}

interface StackedCake {
  position: number;
  width: number;
}

const CakeStackerGame = ({ onGameEnd, onBack }: GameProps) => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [fallingCakeX, setFallingCakeX] = useState(50);
  const [fallingCakeY, setFallingCakeY] = useState(0);
  const [isFalling, setIsFalling] = useState(true);
  const [stackedCakes, setStackedCakes] = useState<StackedCake[]>([{ position: 50, width: 120 }]);
  const [currentWidth, setCurrentWidth] = useState(120);
  const gameInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!gameOver && isFalling) {
      gameInterval.current = setInterval(() => {
        setFallingCakeY((prev) => {
          const newY = prev + 3;
          const targetY = 500 - (stackedCakes.length * 40) - 35;
          
          if (newY >= targetY) {
            setIsFalling(false);
            autoStack();
            return targetY;
          }
          return newY;
        });
      }, 20);
    }

    return () => {
      if (gameInterval.current) clearInterval(gameInterval.current);
    };
  }, [isFalling, gameOver, stackedCakes.length]);

  useEffect(() => {
    if (gameOver) {
      onGameEnd(score, score >= 500 ? 'win' : 'lose');
    }
  }, [gameOver]);

  const autoStack = () => {
    if (gameOver) return;

    const lastCake = stackedCakes[stackedCakes.length - 1];
    const pixelDiff = Math.abs((fallingCakeX / 100 * 600) - (lastCake.position / 100 * 600));
    const overlap = Math.max(0, currentWidth - pixelDiff);

    if (overlap < 15) {
      setGameOver(true);
      onGameEnd(score, score >= 500 ? 'win' : 'lose');
      return;
    }

    const newWidth = overlap;
    const newScore = score + Math.floor(overlap * 2);
    setScore(newScore);
    setStackedCakes([...stackedCakes, { position: fallingCakeX, width: newWidth }]);
    setCurrentWidth(newWidth);

    if (stackedCakes.length >= 10) {
      setGameOver(true);
      onGameEnd(newScore, newScore >= 500 ? 'win' : 'lose');
      return;
    }

    setTimeout(() => {
      setFallingCakeX(Math.random() * 80 + 10);
      setFallingCakeY(0);
      setIsFalling(true);
    }, 300);
  };

  const handleStack = () => {
    if (gameOver || !isFalling) return;
    setIsFalling(false);
    autoStack();
  };

  const COLORS = ['#FF6B9D', '#FFA629', '#4ECDC4', '#FFE66D', '#C44569'];

  return (
    <div className="space-y-6 animate-bounce-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="rounded-full">
          <Icon name="ArrowLeft" size={20} className="mr-2" />
          Назад
        </Button>
        <Card className="px-4 py-2">
          <p className="text-sm text-muted-foreground">Очки</p>
          <p className="text-2xl font-heading font-bold text-game-orange">{score}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-heading font-bold mb-2">🍰 Стакер тортиков</h2>
          <p className="text-muted-foreground">Стакай коржи точно друг на друга!</p>
        </div>

        <div className="relative h-[500px] bg-gradient-to-b from-purple-50 to-pink-50 rounded-xl overflow-hidden">
          {isFalling && !gameOver && (
            <div
              className="absolute flex items-center justify-center text-3xl font-bold"
              style={{
                top: `${fallingCakeY}px`,
                left: `${fallingCakeX}%`,
                width: `${currentWidth}px`,
                height: '35px',
                background: `linear-gradient(135deg, ${COLORS[stackedCakes.length % COLORS.length]}, ${COLORS[(stackedCakes.length + 1) % COLORS.length]})`,
                transform: 'translateX(-50%)',
                borderRadius: '12px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                border: '3px solid rgba(255,255,255,0.5)',
              }}
            >
              🍰
            </div>
          )}

          {stackedCakes.map((cake, index) => (
            <div
              key={index}
              className="absolute flex items-center justify-center text-2xl"
              style={{
                bottom: `${index * 40}px`,
                left: `${cake.position}%`,
                width: `${cake.width}px`,
                height: '35px',
                background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`,
                transform: 'translateX(-50%)',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                border: '3px solid rgba(255,255,255,0.5)',
              }}
            >
              {index === 0 ? '🎂' : '🍰'}
            </div>
          ))}

          <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-game-pink via-game-orange to-game-cyan" />
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <div className="text-white text-center space-y-4">
                <p className="text-5xl">🎂</p>
                <p className="text-4xl font-heading font-bold">Игра окончена!</p>
                <p className="text-2xl">Башня из {stackedCakes.length} тортиков</p>
              </div>
            </div>
          )}
        </div>

        {!gameOver && (
          <Button
            className="w-full mt-4 bg-game-orange hover:bg-game-orange/90 text-white font-heading text-xl py-6 rounded-full shadow-lg"
            onClick={handleStack}
            disabled={!isFalling}
          >
            <Icon name="MousePointerClick" size={24} className="mr-2" />
            {isFalling ? 'Стакнуть сейчас!' : 'Падает следующий...'}
          </Button>
        )}

        <div className="mt-4 text-center">
          <p className="text-lg font-heading text-muted-foreground">Уровень: {stackedCakes.length}/10</p>
          <p className="text-sm text-muted-foreground mt-1">Нажимай когда тортик точно над башней!</p>
        </div>
      </Card>
    </div>
  );
};

export default CakeStackerGame;