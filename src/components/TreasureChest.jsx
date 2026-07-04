import { useState } from 'react';
import axios from 'axios';
import { Package, Sparkles } from 'lucide-react';

const CHEST_COLORS = {
  Bronze:    { from: '#CD7F32', to: '#8B5A2B', glow: 'shadow-amber-700/40' },
  Silver:    { from: '#C0C0C0', to: '#808080', glow: 'shadow-slate-400/40' },
  Gold:      { from: '#FFD700', to: '#DAA520', glow: 'shadow-yellow-500/40' },
  Diamond:   { from: '#B9F2FF', to: '#00CED1', glow: 'shadow-cyan-400/40' },
  Legendary: { from: '#FF6B35', to: '#9B59B6', glow: 'shadow-purple-500/50' }
};

const CHEST_ICONS = {
  Bronze: '📦', Silver: '🗃️', Gold: '📥', Diamond: '💎', Legendary: '👑'
};

const TreasureChest = ({ chests = [], onChestOpened }) => {
  const [opening, setOpening] = useState(false);
  const [openedLoot, setOpenedLoot] = useState(null);
  const [openingIndex, setOpeningIndex] = useState(-1);

  const handleOpen = async (index) => {
    if (opening) return;
    try {
      setOpening(true);
      setOpeningIndex(index);
      setOpenedLoot(null);

      // Wait a beat for animation
      await new Promise(r => setTimeout(r, 1200));

      const { data } = await axios.post('/gamification/open-chest', { chestIndex: index });
      setOpenedLoot(data);
      if (onChestOpened) onChestOpened(data);
    } catch (err) {
      console.error('Chest open error:', err);
    } finally {
      setOpening(false);
      setOpeningIndex(-1);
    }
  };

  if (!chests.length && !openedLoot) return null;

  return (
    <div className="space-y-4">
      {/* Chest Grid */}
      {chests.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {chests.map((chest, i) => {
            const colors = CHEST_COLORS[chest.type] || CHEST_COLORS.Bronze;
            const isOpening = openingIndex === i;
            return (
              <button
                key={i}
                onClick={() => handleOpen(i)}
                disabled={opening}
                className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all
                  ${isOpening
                    ? 'animate-bounce scale-110 border-amber-400 bg-amber-500/10'
                    : 'border-slate-700/50 bg-slate-800/50 hover:bg-slate-700/50 hover:scale-105 hover:border-slate-600'
                  }
                  ${colors.glow} shadow-lg
                  disabled:cursor-not-allowed`}
              >
                <span className="text-3xl mb-1">{CHEST_ICONS[chest.type]}</span>
                <span
                  className="text-xs font-extrabold uppercase tracking-wider"
                  style={{ color: colors.from }}
                >
                  {chest.type}
                </span>
                {isOpening && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
                    <Sparkles className="text-amber-400 animate-spin" size={24} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Loot Reveal */}
      {openedLoot && (
        <div className="bg-gradient-to-br from-amber-500/10 to-violet-500/10 border border-amber-500/30 rounded-2xl p-5 text-center animate-in fade-in">
          <Sparkles className="mx-auto text-amber-400 mb-2" size={28} />
          <h3 className="text-lg font-extrabold text-white mb-3">
            {openedLoot.chestType} Chest Opened!
          </h3>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <span className="text-2xl">🪙</span>
              <p className="text-amber-400 font-bold text-lg">+{openedLoot.coinsAwarded}</p>
              <p className="text-slate-500 text-xs">Coins</p>
            </div>
            <div className="text-center">
              <span className="text-2xl">⚡</span>
              <p className="text-violet-400 font-bold text-lg">+{openedLoot.xpAwarded}</p>
              <p className="text-slate-500 text-xs">XP</p>
            </div>
          </div>
          {openedLoot.rareItems?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">Rare Drop!</p>
              {openedLoot.rareItems.map((item, j) => (
                <div key={j} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30 text-emerald-300 font-bold text-sm">
                  <span>{item.icon}</span> {item.name}
                </div>
              ))}
            </div>
          )}
          {openedLoot.leveledUp && (
            <p className="text-yellow-400 text-sm mt-2 font-bold animate-bounce">
              ⭐ Level Up!
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TreasureChest;
