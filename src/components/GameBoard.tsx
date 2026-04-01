import { useCallback, useEffect, useState } from 'react';
import {
  GameState, Order, Position, Player, COLUMNS, CROWN_CITY_POSITIONS,
  posEqual, posKey, posLabel, GameMode, Unit,
} from '@/game/types';
import {
  createInitialState, getValidMoves, getValidAttacks,
  getFortInfluenceTiles, getEffectiveStrength, resolveOrders,
} from '@/game/engine';
import { generateAIOrders } from '@/game/ai';
import BattleLog from './BattleLog';
import VictoryScreen from './VictoryScreen';

interface GameBoardProps {
  mode: GameMode;
  onMenu: () => void;
}

const UNIT_ICONS: Record<string, string> = {
  commander: '♛',
  soldier: '●',
  knight: '▲',
  fort: '■',
};

const GameBoard = ({ mode, onMenu }: GameBoardProps) => {
  const [state, setState] = useState<GameState>(() => createInitialState(mode));
  const [currentOrders, setCurrentOrders] = useState<Order[]>([]);
  const [handoffMessage, setHandoffMessage] = useState<string | null>(null);

  const currentPlayer: Player = state.phase === 'player1Orders' ? 'player1' : 'player2';
  const myUnits = state.units.filter(u => u.owner === currentPlayer);

  const selectedUnit = state.selectedUnitId
    ? state.units.find(u => u.id === state.selectedUnitId) ?? null
    : null;

  // Compute fort influence tiles for display
  const fortInfluenceTiles = new Set<string>();
  state.units.filter(u => u.type === 'fort').forEach(fort => {
    getFortInfluenceTiles(fort).forEach(p => fortInfluenceTiles.add(posKey(p)));
  });

  const selectUnit = useCallback((unit: Unit) => {
    if (unit.owner !== currentPlayer) return;
    if (state.phase !== 'player1Orders' && state.phase !== 'player2Orders') return;

    const moves = getValidMoves(unit, state.units);
    setState(s => ({
      ...s,
      selectedUnitId: unit.id,
      attackMode: false,
      highlightedTiles: moves,
      highlightType: 'move' as const,
    }));
  }, [currentPlayer, state.phase, state.units]);

  const handleTileClick = useCallback((pos: Position) => {
    if (!selectedUnit) return;
    if (state.phase !== 'player1Orders' && state.phase !== 'player2Orders') return;

    if (state.attackMode) {
      const attacks = getValidAttacks(selectedUnit, state.units);
      if (attacks.some(a => posEqual(a, pos))) {
        setCurrentOrders(prev => [
          ...prev.filter(o => o.unitId !== selectedUnit.id),
          { unitId: selectedUnit.id, type: 'attack', target: pos },
        ]);
        setState(s => ({ ...s, selectedUnitId: null, attackMode: false, highlightedTiles: [], highlightType: null }));
      }
    } else {
      const moves = getValidMoves(selectedUnit, state.units);
      if (moves.some(m => posEqual(m, pos))) {
        setCurrentOrders(prev => [
          ...prev.filter(o => o.unitId !== selectedUnit.id),
          { unitId: selectedUnit.id, type: 'move', target: pos },
        ]);
        setState(s => ({ ...s, selectedUnitId: null, highlightedTiles: [], highlightType: null }));
      }
    }
  }, [selectedUnit, state.attackMode, state.phase, state.units]);

  const toggleAttackMode = useCallback(() => {
    if (!selectedUnit) return;
    const attacks = getValidAttacks(selectedUnit, state.units);
    setState(s => ({
      ...s,
      attackMode: !s.attackMode,
      highlightedTiles: !s.attackMode ? attacks : getValidMoves(selectedUnit, state.units),
      highlightType: !s.attackMode ? 'attack' : 'move',
    }));
  }, [selectedUnit, state.units]);

  const holdUnit = useCallback(() => {
    if (!selectedUnit) return;
    setCurrentOrders(prev => [
      ...prev.filter(o => o.unitId !== selectedUnit.id),
      { unitId: selectedUnit.id, type: 'hold' },
    ]);
    setState(s => ({ ...s, selectedUnitId: null, highlightedTiles: [], highlightType: null }));
  }, [selectedUnit]);

  const confirmOrders = useCallback(() => {
    // Auto-hold for units without orders
    const orderedIds = new Set(currentOrders.map(o => o.unitId));
    const finalOrders = [...currentOrders];
    myUnits.forEach(u => {
      if (!orderedIds.has(u.id)) finalOrders.push({ unitId: u.id, type: 'hold' });
    });

    if (state.phase === 'player1Orders') {
      if (mode === 'ai') {
        const aiOrders = generateAIOrders(state);
        const newState = resolveOrders({
          ...state,
          player1Orders: finalOrders,
          player2Orders: aiOrders,
        });
        setState({ ...newState, turn: newState.winner ? newState.turn : newState.turn + 1 });
        setCurrentOrders([]);
      } else {
        setState(s => ({ ...s, player1Orders: finalOrders, phase: 'handoff' }));
        setCurrentOrders([]);
        setHandoffMessage('Pass device to Player 2');
      }
    } else if (state.phase === 'player2Orders') {
      const newState = resolveOrders({
        ...state,
        player2Orders: finalOrders,
      });
      setState({ ...newState, turn: newState.winner ? newState.turn : newState.turn + 1 });
      setCurrentOrders([]);
    }
  }, [currentOrders, myUnits, state, mode]);

  const handleHandoffContinue = useCallback(() => {
    setHandoffMessage(null);
    setState(s => ({ ...s, phase: 'player2Orders' }));
  }, []);

  const nextTurn = useCallback(() => {
    setState(s => ({
      ...s,
      phase: 'player1Orders',
      combatLog: [],
      player1Orders: [],
      player2Orders: [],
    }));
  }, []);

  const restartGame = useCallback(() => {
    setState(createInitialState(mode));
    setCurrentOrders([]);
    setHandoffMessage(null);
  }, [mode]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') toggleAttackMode();
      if (e.key === 'h' || e.key === 'H') holdUnit();
      if (e.key === ' ') { e.preventDefault(); confirmOrders(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleAttackMode, holdUnit, confirmOrders]);

  // Victory screen
  if (state.winner) {
    return <VictoryScreen winner={state.winner} winReason={state.winReason} turn={state.turn} onRestart={restartGame} onMenu={onMenu} />;
  }

  // Handoff screen
  if (handoffMessage) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background">
        <h2 className="text-4xl font-display font-bold text-primary text-glow-gold">{handoffMessage}</h2>
        <p className="text-muted-foreground">Don't peek! Hand the device to the next player.</p>
        <button onClick={handleHandoffContinue} className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-display text-lg transition-all hover:box-glow-gold hover:scale-105">
          Ready
        </button>
      </div>
    );
  }

  // City counts
  const p1Cities = state.crownCities.filter(c => c.owner === 'player1').length;
  const p2Cities = state.crownCities.filter(c => c.owner === 'player2').length;

  const highlightSet = new Set(state.highlightedTiles.map(posKey));
  const orderMap = new Map(currentOrders.map(o => [o.unitId, o]));

  return (
    <div className="flex min-h-screen bg-background">
      {/* Main board area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Top bar */}
        <div className="w-full max-w-[600px] flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="font-display text-primary text-lg">Turn {state.turn}</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-player-blue font-semibold">♛ {p1Cities}</span>
            <span className="text-muted-foreground">vs</span>
            <span className="text-player-red font-semibold">♛ {p2Cities}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-display ${currentPlayer === 'player1' ? 'text-player-blue' : 'text-player-red'}`}>
              {currentPlayer === 'player1' ? 'Player 1' : mode === 'ai' ? 'AI' : 'Player 2'}
              {state.phase === 'results' ? ' — Results' : ' — Orders'}
            </span>
          </div>
        </div>

        {/* Column headers */}
        <div className="flex max-w-[600px] w-full">
          <div className="w-6" />
          {COLUMNS.map(c => (
            <div key={c} className="flex-1 text-center text-xs text-muted-foreground font-body">{c}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="max-w-[600px] w-full">
          {Array.from({ length: 10 }, (_, row) => (
            <div key={row} className="flex">
              <div className="w-6 flex items-center justify-center text-xs text-muted-foreground font-body">{row + 1}</div>
              {Array.from({ length: 10 }, (_, col) => {
                const pos = { col, row };
                const key = posKey(pos);
                const unit = state.units.find(u => posEqual(u.position, pos));
                const isCrown = CROWN_CITY_POSITIONS.some(c => posEqual(c, pos));
                const crownCity = state.crownCities.find(c => posEqual(c.position, pos));
                const isHighlighted = highlightSet.has(key);
                const isSelected = selectedUnit && posEqual(selectedUnit.position, pos);
                const isDark = (col + row) % 2 === 0;
                const isFortZone = fortInfluenceTiles.has(key);

                let bgClass = isDark ? 'bg-tile-dark' : 'bg-tile-light';
                if (isSelected) bgClass = 'bg-primary/30';
                else if (isHighlighted && state.highlightType === 'attack') bgClass = 'bg-tile-attack/40';
                else if (isHighlighted) bgClass = 'bg-tile-move/30';

                const hasOrder = unit && orderMap.has(unit.id);

                return (
                  <div
                    key={col}
                    onClick={() => unit && unit.owner === currentPlayer ? selectUnit(unit) : handleTileClick(pos)}
                    className={`flex-1 aspect-square flex items-center justify-center relative cursor-pointer border border-border/20 transition-colors duration-150 ${bgClass} ${isHighlighted ? 'hover:brightness-125' : ''}`}
                  >
                    {/* Fort influence indicator */}
                    {isFortZone && (
                      <div className="absolute inset-0 bg-tile-fort/25 border border-tile-fort/40 pointer-events-none" />
                    )}

                    {/* Crown city marker */}
                    {isCrown && (
                      <div className={`absolute inset-0 border-2 pointer-events-none ${
                        crownCity?.owner === 'player1' ? 'border-player-blue/60' :
                        crownCity?.owner === 'player2' ? 'border-player-red/60' :
                        'border-crown-gold/40'
                      }`}>
                        {!unit && (
                          <span className="absolute inset-0 flex items-center justify-center text-crown-gold/40 text-lg animate-pulse-gold">♛</span>
                        )}
                      </div>
                    )}

                    {/* Unit */}
                    {unit && (
                      <span
                        className={`text-lg md:text-xl font-bold z-10 transition-transform ${
                          unit.owner === 'player1' ? 'text-player-blue' : 'text-player-red'
                        } ${isSelected ? 'scale-125' : ''} ${hasOrder ? 'opacity-80' : ''}`}
                        title={`${unit.type} (STR ${getEffectiveStrength(unit, state.units)})`}
                      >
                        {UNIT_ICONS[unit.type]}
                      </span>
                    )}

                    {/* Order indicator */}
                    {unit && hasOrder && (
                      <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-3 mt-4 flex-wrap justify-center">
          {selectedUnit && (
            <>
              <button onClick={toggleAttackMode} className={`px-4 py-2 rounded-lg font-body text-sm transition-all border ${
                state.attackMode
                  ? 'bg-destructive text-destructive-foreground border-destructive'
                  : 'bg-secondary text-secondary-foreground border-border hover:bg-accent'
              }`}>
                {state.attackMode ? '⚔ Attack Mode' : '⚔ Attack (A)'}
              </button>
              <button onClick={holdUnit} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground border border-border font-body text-sm hover:bg-accent transition-all">
                🛡 Hold (H)
              </button>
            </>
          )}
          {(state.phase === 'player1Orders' || state.phase === 'player2Orders') && (
            <button onClick={confirmOrders} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-display text-sm transition-all hover:box-glow-gold hover:scale-105">
              Confirm Orders (Space)
            </button>
          )}
          {state.phase === 'results' && (
            <button onClick={nextTurn} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-display text-sm transition-all hover:box-glow-gold hover:scale-105">
              Next Turn
            </button>
          )}
          <button onClick={onMenu} className="px-4 py-2 rounded-lg bg-muted text-muted-foreground border border-border font-body text-sm hover:bg-secondary transition-all">
            Menu
          </button>
        </div>

        {/* Selected unit info */}
        {selectedUnit && (
          <div className="mt-3 text-sm text-muted-foreground font-body">
            Selected: <span className="text-foreground font-semibold">{selectedUnit.type}</span> at {posLabel(selectedUnit.position)} | STR {getEffectiveStrength(selectedUnit, state.units)}
          </div>
        )}
      </div>

      {/* Side panel */}
      <div className="w-72 border-l border-border p-4 hidden md:flex flex-col gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="font-display text-primary text-lg mb-2">Status</h3>
          <div className="space-y-2 text-sm font-body">
            <div className="flex justify-between">
              <span className="text-player-blue">Player 1 Cities</span>
              <span className="text-player-blue font-bold">{p1Cities}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-player-red">{mode === 'ai' ? 'AI' : 'Player 2'} Cities</span>
              <span className="text-player-red font-bold">{p2Cities}</span>
            </div>
            <div className="border-t border-border pt-2">
              <span className="text-muted-foreground">Orders given: {currentOrders.length}/{myUnits.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="font-display text-primary text-lg mb-2">Orders</h3>
          {currentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet. Select a unit.</p>
          ) : (
            <div className="space-y-1">
              {currentOrders.map(o => {
                const unit = state.units.find(u => u.id === o.unitId);
                if (!unit) return null;
                return (
                  <div key={o.unitId} className="text-xs text-foreground/80 font-body">
                    {UNIT_ICONS[unit.type]} {posLabel(unit.position)}: {o.type}{o.target ? ` → ${posLabel(o.target)}` : ''}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <BattleLog log={state.combatLog} turn={state.turn} />
      </div>
    </div>
  );
};

export default GameBoard;
