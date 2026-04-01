import { GameMode } from '@/game/types';

interface MainMenuProps {
  onStartGame: (mode: GameMode) => void;
  onHowToPlay: () => void;
}

const MainMenu = ({ onStartGame, onHowToPlay }: MainMenuProps) => {
  const buttons = [
    { label: 'Play vs AI', action: () => onStartGame('ai') },
    { label: 'Play vs Player (1v1 Local)', action: () => onStartGame('local') },
    { label: 'How to Play', action: onHowToPlay },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-background">
      <h1 className="text-5xl md:text-7xl font-display font-bold text-primary tracking-wider">
        Valta
      </h1>

      <div className="flex flex-col gap-3 w-64">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            className="px-6 py-3 rounded border border-primary/20 bg-secondary text-secondary-foreground font-body text-base tracking-wide transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MainMenu;
