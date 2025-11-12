import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface GameProps {
  onGameEnd: (score: number, result: 'win' | 'lose') => void;
  onBack: () => void;
}

const CakeStackerGame = ({ onGameEnd, onBack }: GameProps) => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [cakePosition, setCakePosition] = useState(50);
  const [direction, setDirection] = useState(1);
  const [stackedCakes, setStackedCakes] = useState<number[]>([50]);
  const [currentWidth, setCurrentWidth] = useState(100);
  const gameInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!gameOver) {
      gameInterval.current = setInterval(() => {
        setCakePosition((prev) => {
          const newPos = prev + direction * 2;
          if (newPos <= 0 || newPos >= 100) {
            setDirection(d => -d);
          }
          return Math.max(0, Math.min(100, newPos));
        });
      }, 30);
    }

    return () => {
      if (gameInterval.current) clearInterval(gameInterval.current);
    };
  }, [direction, gameOver]);

  useEffect(() => {
    if (gameOver) {
      onGameEnd(score, score >= 500 ? 'win' : 'lose');
    }
  }, [gameOver]);

  const handleStack = () => {
    if (gameOver) return;

    const lastCake = stackedCakes[stackedCakes.length - 1];
    const overlap = Math.max(0, currentWidth - Math.abs(cakePosition - lastCake));

    if (overlap < 10) {
      setGameOver(true);
      return;
    }

    const newWidth = overlap;
    const newScore = score + Math.floor(overlap);
    setScore(newScore);
    setStackedCakes([...stackedCakes, cakePosition]);
    setCurrentWidth(newWidth);

    if (stackedCakes.length >= 10) {
      setGameOver(true);
    }
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
          {!gameOver && (
            <div
              className="absolute transition-all duration-100"
              style={{
                bottom: `${stackedCakes.length * 40}px`,
                left: `${cakePosition}%`,
                width: `${currentWidth}px`,
                height: '35px',
                background: COLORS[stackedCakes.length % COLORS.length],
                transform: 'translateX(-50%)',
                borderRadius: '8px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              }}
            />
          )}

          {stackedCakes.slice(0, -1).map((pos, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                bottom: `${index * 40}px`,
                left: `${pos}%`,
                width: `${currentWidth}px`,
                height: '35px',
                background: COLORS[index % COLORS.length],
                transform: 'translateX(-50%)',
                borderRadius: '8px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              }}
            />
          ))}

          <div className="absolute bottom-0 left-0 right-0 h-2 bg-game-pink" />
        </div>

        {!gameOver && (
          <Button
            className="w-full mt-4 bg-game-orange hover:bg-game-orange/90 text-white font-heading text-xl py-6 rounded-full"
            onClick={handleStack}
          >
            <Icon name="MousePointerClick" size={24} className="mr-2" />
            Стакнуть!
          </Button>
        )}

        <div className="mt-4 text-center text-muted-foreground">
          <p>Уровень: {stackedCakes.length}/10</p>
        </div>
      </Card>
    </div>
  );
};

export default CakeStackerGame;
