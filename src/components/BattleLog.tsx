import { CombatResult } from '@/game/types';

interface BattleLogProps {
  log: CombatResult[];
  turn: number;
}

const BattleLog = ({ log, turn }: BattleLogProps) => {
  return (
    <div className="bg-card rounded-lg border border-border p-4 h-full overflow-auto">
      <h3 className="font-display text-primary text-lg mb-3">Battle Log</h3>
      {log.length === 0 ? (
        <p className="text-sm text-muted-foreground">No combat this turn.</p>
      ) : (
        <div className="space-y-2">
          {log.map((entry, i) => (
            <div key={i} className="text-sm text-foreground/80 font-body border-b border-border/50 pb-2">
              <span className={entry.outcome === 'attackerWins' ? 'text-player-blue' : entry.outcome === 'defenderWins' ? 'text-player-red' : 'text-primary'}>
                ⚔
              </span>{' '}
              {entry.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BattleLog;
