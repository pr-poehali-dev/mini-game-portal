import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import MatchThreeGame from '@/components/games/MatchThreeGame';
import CakeStackerGame from '@/components/games/CakeStackerGame';
import RunnerGame from '@/components/games/RunnerGame';

type GameType = 'match3' | 'stacker' | 'runner' | null;

const Index = () => {
  const [currentSection, setCurrentSection] = useState<'home' | 'games' | 'tournament' | 'contact' | 'about'>('home');
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [gameResult, setGameResult] = useState<'win' | 'lose'>('win');

  const handleGameEnd = (finalScore: number, result: 'win' | 'lose') => {
    setScore(finalScore);
    setGameResult(result);
    setShowResult(true);
    setActiveGame(null);
  };

  const games = [
    { id: 'match3' as const, name: 'Три в ряд', icon: 'Gem', color: 'bg-game-pink', description: 'Собирай ряды из одинаковых фишек' },
    { id: 'stacker' as const, name: 'Тортик', icon: 'Cake', color: 'bg-game-orange', description: 'Стакай коржи друг на друга' },
    { id: 'runner' as const, name: 'Бегалка', icon: 'Zap', color: 'bg-game-cyan', description: 'Прыгай через препятствия' },
  ];

  const achievements = [
    { year: '2023', title: 'Лучший энергоотряд региона', icon: 'Trophy' },
    { year: '2023', title: 'Участие в стройке ЛЭП', icon: 'Zap' },
    { year: '2024', title: '15+ проведенных игровых турниров', icon: 'Gamepad2' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-yellow-50">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-purple-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-game-pink via-game-orange to-game-cyan bg-clip-text text-transparent">
              🎮 Электросила Games
            </h1>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'home', label: 'Главная', icon: 'Home' },
                { id: 'games', label: 'Игры', icon: 'Gamepad2' },
                { id: 'tournament', label: 'Турнир', icon: 'Trophy' },
                { id: 'contact', label: 'Контакты', icon: 'Mail' },
                { id: 'about', label: 'О нас', icon: 'Users' },
              ].map((item) => (
                <Button
                  key={item.id}
                  variant={currentSection === item.id ? 'default' : 'outline'}
                  className={`rounded-full ${currentSection === item.id ? 'bg-game-pink hover:bg-game-pink/90' : ''}`}
                  onClick={() => setCurrentSection(item.id as any)}
                >
                  <Icon name={item.icon as any} size={18} className="mr-2" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        {currentSection === 'home' && (
          <div className="space-y-12 animate-bounce-in">
            <section className="text-center space-y-6">
              <h2 className="text-6xl font-heading font-bold animate-float">
                <span className="inline-block">🎮</span> Играй и побеждай!
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Попробуй свои силы в трёх мини-играх и получи приглашение на грандиозный турнир от студенческого энергетического отряда "Электросила"
              </p>
              <Button 
                size="lg" 
                className="bg-game-orange hover:bg-game-orange/90 text-white font-heading text-xl px-8 py-6 rounded-full animate-pulse-slow shadow-lg"
                onClick={() => setCurrentSection('games')}
              >
                <Icon name="Play" size={24} className="mr-2" />
                Начать играть
              </Button>
            </section>

            <section className="grid md:grid-cols-3 gap-6">
              {games.map((game) => (
                <Card key={game.id} className="p-6 hover:scale-105 transition-transform cursor-pointer border-2 hover:border-game-pink">
                  <div className={`${game.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon name={game.icon as any} size={32} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-2">{game.name}</h3>
                  <p className="text-muted-foreground">{game.description}</p>
                </Card>
              ))}
            </section>
          </div>
        )}

        {currentSection === 'games' && !activeGame && (
          <div className="space-y-8 animate-bounce-in">
            <h2 className="text-4xl font-heading font-bold text-center">Выбери игру 🎯</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {games.map((game) => (
                <Card key={game.id} className="p-8 text-center hover:scale-105 transition-transform cursor-pointer border-2 hover:border-game-pink">
                  <div className={`${game.color} w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl`}>
                    <Icon name={game.icon as any} size={48} className="text-white" />
                  </div>
                  <h3 className="text-3xl font-heading font-bold mb-3">{game.name}</h3>
                  <p className="text-muted-foreground mb-6">{game.description}</p>
                  <Button 
                    className="bg-game-cyan hover:bg-game-cyan/90 text-white font-heading rounded-full w-full"
                    onClick={() => setActiveGame(game.id)}
                  >
                    <Icon name="Play" size={20} className="mr-2" />
                    Играть
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeGame === 'match3' && <MatchThreeGame onGameEnd={handleGameEnd} onBack={() => setActiveGame(null)} />}
        {activeGame === 'stacker' && <CakeStackerGame onGameEnd={handleGameEnd} onBack={() => setActiveGame(null)} />}
        {activeGame === 'runner' && <RunnerGame onGameEnd={handleGameEnd} onBack={() => setActiveGame(null)} />}

        {currentSection === 'tournament' && (
          <div className="space-y-8 animate-bounce-in max-w-4xl mx-auto">
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-heading font-bold">🏆 Игровой турнир</h2>
              <p className="text-xl text-muted-foreground">Вечер, посвящённый компьютерным и настольным играм</p>
            </div>

            <Card className="p-8 bg-gradient-to-br from-game-pink/10 to-game-orange/10 border-2 border-game-pink">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-game-orange w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon name="Calendar" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-bold mb-2">Когда и где?</h3>
                    <p className="text-muted-foreground">Дата и место проведения будут объявлены дополнительно. Следи за новостями!</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-game-cyan w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon name="Gamepad2" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-bold mb-2">Что будет?</h3>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Соревнования на игровых приставках</li>
                      <li>• Турниры по настольным играм</li>
                      <li>• Призы и подарки победителям</li>
                      <li>• Отличная атмосфера и новые знакомства</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-game-yellow w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon name="Users" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-bold mb-2">Кто может участвовать?</h3>
                    <p className="text-muted-foreground">Турнир открыт для всех! Не важен уровень подготовки — главное желание играть и веселиться.</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="text-center">
              <Button 
                size="lg" 
                className="bg-game-pink hover:bg-game-pink/90 text-white font-heading text-xl px-8 py-6 rounded-full shadow-lg"
                onClick={() => setCurrentSection('contact')}
              >
                <Icon name="Mail" size={24} className="mr-2" />
                Связаться с нами
              </Button>
            </div>
          </div>
        )}

        {currentSection === 'contact' && (
          <div className="space-y-8 animate-bounce-in max-w-2xl mx-auto">
            <h2 className="text-4xl font-heading font-bold text-center">Контакты 📧</h2>
            <Card className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-game-cyan w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="Mail" size={24} className="text-white" />
                </div>
                <div>
                  <p className="font-heading font-bold">Email</p>
                  <p className="text-muted-foreground">elektrosila@example.com</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-game-orange w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="Phone" size={24} className="text-white" />
                </div>
                <div>
                  <p className="font-heading font-bold">Телефон</p>
                  <p className="text-muted-foreground">+7 (XXX) XXX-XX-XX</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-game-pink w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="MapPin" size={24} className="text-white" />
                </div>
                <div>
                  <p className="font-heading font-bold">Адрес</p>
                  <p className="text-muted-foreground">г. Город, ул. Университетская, д. 1</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {currentSection === 'about' && (
          <div className="space-y-8 animate-bounce-in max-w-4xl mx-auto">
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-heading font-bold">⚡ О нас</h2>
              <p className="text-xl text-muted-foreground">Студенческий энергетический отряд "Электросила"</p>
            </div>

            <Card className="p-8">
              <p className="text-lg text-muted-foreground mb-8">
                Мы — команда активных студентов, которые не только работают на энергетических объектах, 
                но и организуют крутые мероприятия для студентов. Наша цель — объединять людей через игры, 
                спорт и позитивную атмосферу.
              </p>

              <h3 className="text-2xl font-heading font-bold mb-6">Наши достижения</h3>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                    <div className="bg-game-pink w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon name={achievement.icon as any} size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-game-pink">{achievement.year}</p>
                      <p className="text-muted-foreground">{achievement.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </main>

      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-3xl font-heading text-center">
              {gameResult === 'win' ? '🎉 Победа!' : '😔 Игра окончена'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="text-center">
              <p className="text-5xl font-heading font-bold text-game-pink mb-2">{score}</p>
              <p className="text-muted-foreground">баллов набрано</p>
            </div>
            
            <Card className="p-6 bg-gradient-to-br from-game-orange/10 to-game-pink/10 border-2 border-game-orange">
              <div className="flex items-start gap-4">
                <div className="bg-game-cyan w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="Trophy" size={24} className="text-white" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-lg mb-2">Приглашаем на турнир!</h4>
                  <p className="text-sm text-muted-foreground">
                    Вечер компьютерных игр на приставке и настольных игр от студенческого энергетического отряда "Электросила"
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-2">
              <Button 
                className="w-full bg-game-pink hover:bg-game-pink/90 text-white font-heading rounded-full"
                onClick={() => {
                  setShowResult(false);
                  setCurrentSection('games');
                }}
              >
                <Icon name="Gamepad2" size={20} className="mr-2" />
                Играть ещё
              </Button>
              <Button 
                variant="outline" 
                className="w-full font-heading rounded-full"
                onClick={() => {
                  setShowResult(false);
                  setCurrentSection('tournament');
                }}
              >
                <Icon name="Trophy" size={20} className="mr-2" />
                Узнать о турнире
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <footer className="mt-20 py-8 bg-white/50 backdrop-blur-sm border-t border-purple-200">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="font-heading">
            ⚡ СЭО "Электросила" • 2024 • Игровой турнир
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
