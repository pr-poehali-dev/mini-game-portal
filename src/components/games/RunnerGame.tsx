import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface GameProps {
  onGameEnd: (score: number, result: 'win' | 'lose') => void;
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
          ...prev.filter(obs => obs.x > -50),
          ...(Math.random() < 0.02 ? [{ x: 600, id: obstacleIdRef.current++ }] : [])
        ]);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameOver]);

  useEffect(() => {
    if (!gameOver) {
      gameLoopRef.current = setInterval(() => {
        setObstacles((prev) =>
          prev.map(obs => ({ ...obs, x: obs.x - gameSpeed }))
        );
        setScore(s => s + 1);
        
        if (score % 100 === 0 && score > 0) {
          setGameSpeed(s => s + 0.5);
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
    obstacles.forEach(obs => {
      if (obs.x > 40 && obs.x < 100 && playerY < 40) {
        setGameOver(true);
        onGameEnd(score, score >= 1000 ? 'win' : 'lose');
      }
    });
  }, [obstacles, playerY]);

  const handleJump = () => {
    if (!isJumping && !gameOver) {
      setIsJumping(true);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
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
          <p className="text-2xl font-heading font-bold text-game-cyan">{score}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-heading font-bold mb-2">⚡ Бегалка</h2>
          <p className="text-muted-foreground">Прыгай через препятствия! Набери 1000 очков</p>
        </div>

        <div
          className="relative h-64 bg-gradient-to-b from-cyan-50 to-blue-100 rounded-xl overflow-hidden cursor-pointer"
          onClick={handleJump}
        >
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-green-600 to-green-400" />
          
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-800" />

          <div
            className="absolute w-12 h-12 bg-game-pink rounded-lg flex items-center justify-center text-2xl transition-all shadow-lg"
            style={{
              left: '80px',
              bottom: `${48 + playerY}px`,
            }}
          >
            🏃
          </div>

          {obstacles.map((obs) => (
            <div
              key={obs.id}
              className="absolute w-8 h-12 bg-game-orange rounded-lg shadow-lg"
              style={{
                left: `${obs.x}px`,
                bottom: '48px',
              }}
            />
          ))}

          {gameOver && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <p className="text-4xl font-heading font-bold mb-2">Игра окончена!</p>
                <p className="text-xl">Счёт: {score}</p>
              </div>
            </div>
          )}

          <div className="absolute top-4 left-4 right-4 flex justify-between text-muted-foreground text-sm">
            <span>☁️</span>
            <span>☁️</span>
            <span>☁️</span>
          </div>
        </div>

        {!gameOver && (
          <div className="mt-4 text-center">
            <Button
              className="bg-game-cyan hover:bg-game-cyan/90 text-white font-heading text-xl px-8 py-6 rounded-full"
              onClick={handleJump}
            >
              <Icon name="MoveUp" size={24} className="mr-2" />
              Прыгнуть (Пробел)
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Нажми кнопку или пробел для прыжка
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RunnerGame;
