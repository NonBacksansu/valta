interface HowToPlayProps {
  onBack: () => void;
}

const HowToPlay = ({ onBack }: HowToPlayProps) => {
  return (
    <div className="min-h-screen bg-background p-8 overflow-auto">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-display font-bold text-primary text-glow-gold mb-8">How to Play</h1>

        <Section title="Goal">
          <p>Control <span className="text-primary font-bold">3 Crown Cities</span> or destroy the enemy <span className="text-primary font-bold">Commander</span> to win.</p>
        </Section>

        <Section title="Turn System">
          <p>Both sides assign orders simultaneously. Orders remain hidden until the turn ends, then all actions resolve at the same time.</p>
        </Section>

        <Section title="Controls">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Click</strong> a unit to select it</li>
            <li><strong>Click</strong> a highlighted tile to move</li>
            <li>Press <kbd className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-sm">A</kbd> for attack mode</li>
            <li>Press <kbd className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-sm">H</kbd> to hold</li>
            <li>Press <kbd className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-sm">SPACE</kbd> to confirm all orders</li>
          </ul>
        </Section>

        <Section title="Unit Types">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UnitCard icon="♛" name="Commander" strength={2} desc="Moves any distance horizontally/vertically (can't pass through units). Attacks adjacent. If destroyed, you lose!" />
            <UnitCard icon="●" name="Soldier" strength={1} desc="Moves 1 tile forward or sideways. Attacks 1 tile forward." />
            <UnitCard icon="▲" name="Knight" strength={2} desc="Moves in L-shape (like chess). Can jump over units. Attacks adjacent." />
            <UnitCard icon="■" name="Fort" strength={1} desc="Moves 1-2 tiles horizontally/vertically. Can't move onto Crown Cities. Friendly units within 2 tiles get +1 strength. Cannot be destroyed — combat results in bounce." />
          </div>
        </Section>

        <Section title="Combat">
          <ul className="list-disc list-inside space-y-1">
            <li>Higher strength wins; loser is destroyed</li>
            <li>Equal strength: both bounce back</li>
            <li>Fort involved: always bounce</li>
            <li>Fort bonus: +1 strength to friendly units within 2 tiles</li>
          </ul>
        </Section>

        <Section title="Movement Rules">
          <ul className="list-disc list-inside space-y-1">
            <li>If two units swap positions, both moves fail</li>
            <li>If multiple units move to the same tile, combat occurs</li>
          </ul>
        </Section>

        <button
          onClick={onBack}
          className="mt-8 px-8 py-3 rounded-lg border border-primary/30 bg-secondary text-secondary-foreground font-display text-lg transition-all hover:bg-primary hover:text-primary-foreground hover:box-glow-gold"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-display font-semibold text-primary mb-3">{title}</h2>
      <div className="text-foreground/90 font-body leading-relaxed">{children}</div>
    </div>
  );
}

function UnitCard({ icon, name, strength, desc }: { icon: string; name: string; strength: number; desc: string }) {
  return (
    <div className="p-4 rounded-lg bg-card border border-border">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl text-primary">{icon}</span>
        <span className="font-display font-semibold text-foreground">{name}</span>
        <span className="text-sm text-muted-foreground ml-auto">STR {strength}</span>
      </div>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

export default HowToPlay;
