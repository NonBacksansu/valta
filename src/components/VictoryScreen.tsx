import { Player } from '@/game/types';

interface VictoryScreenProps {
  winner: Player;
  winReason: string;
  turn: number;
  onRestart: () => void;
  onMenu: () => void;
}

const VictoryScreen = ({ winner, winReason, turn, onRestart, onMenu }: VictoryScreenProps) => {
  const isP1 = winner === 'player1';
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background">
      <div className="text-center animate-slide-up">
        <h1 className="text-5xl md:text-7xl font-display font-bold text-primary text-glow-gold mb-4">
          Victory!
        </h1>
        <p className={`text-3xl font-display font-semibold ${isP1 ? 'text-player-blue' : 'text-player-red'}`}>
          {isP1 ? 'Player 1 (Blue)' : 'Player 2 (Red)'} Wins
        </p>
        <p className="mt-2 text-lg text-muted-foreground">{winReason}</p>
        <p className="mt-1 text-muted-foreground">Turn {turn}</p>
      </div>

      <div className="flex gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <button onClick={onRestart} className="px-8 py-3 rounded-lg border border-primary/30 bg-secondary text-secondary-foreground font-display text-lg transition-all hover:bg-primary hover:text-primary-foreground hover:box-glow-gold">
          Play Again
        </button>
        <button onClick={onMenu} className="px-8 py-3 rounded-lg border border-border bg-muted text-muted-foreground font-display text-lg transition-all hover:bg-secondary hover:text-secondary-foreground">
          Main Menu
        </button>
      </div>
    </div>
  );
};

export default VictoryScreen;
