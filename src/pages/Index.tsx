import { useState } from 'react';
import { GameMode, GameScreen } from '@/game/types';
import MainMenu from '@/components/MainMenu';
import HowToPlay from '@/components/HowToPlay';
import GameBoard from '@/components/GameBoard';

const Index = () => {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('ai');

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    setScreen('game');
  };

  switch (screen) {
    case 'menu':
      return <MainMenu onStartGame={startGame} onHowToPlay={() => setScreen('howToPlay')} />;
    case 'howToPlay':
      return <HowToPlay onBack={() => setScreen('menu')} />;
    case 'game':
      return <GameBoard key={`${gameMode}-${Date.now()}`} mode={gameMode} onMenu={() => setScreen('menu')} />;
    default:
      return <MainMenu onStartGame={startGame} onHowToPlay={() => setScreen('howToPlay')} />;
  }
};

export default Index;
