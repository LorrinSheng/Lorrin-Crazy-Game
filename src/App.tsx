/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Hand as HandIcon, 
  Layers, 
  ChevronRight,
  Info,
  X
} from 'lucide-react';
import { Card, GameState, Suit, Rank, GameStatus } from './types';
import { 
  createDeck, 
  shuffleDeck, 
  SUIT_SYMBOLS, 
  SUIT_COLORS, 
  SUITS 
} from './constants';

// --- Components ---

interface CardProps {
  card: Card;
  isFaceUp?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  isHighlighted?: boolean;
}

const PlayingCard: React.FC<CardProps> = ({ 
  card, 
  isFaceUp = true, 
  onClick, 
  disabled = false,
  className = "",
  isHighlighted = false
}) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={!disabled && isFaceUp ? { y: -15, scale: 1.05 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`
        relative w-28 h-40 sm:w-32 sm:h-48 rounded-xl cursor-pointer select-none
        transition-all duration-200 card-shadow border-2
        ${isFaceUp ? 'bg-white border-white' : 'bg-indigo-700 border-indigo-500'}
        ${isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-emerald-900' : ''}
        ${disabled ? 'opacity-80 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {isFaceUp ? (
        <div className="flex flex-col h-full p-2 justify-between">
          <div className={`flex flex-col leading-none font-bold ${SUIT_COLORS[card.suit]}`}>
            <span className="text-lg sm:text-xl font-display">{card.rank}</span>
            <span className="text-sm sm:text-base">{SUIT_SYMBOLS[card.suit]}</span>
          </div>
          <div className={`flex justify-center items-center text-4xl sm:text-5xl ${SUIT_COLORS[card.suit]}`}>
            {SUIT_SYMBOLS[card.suit]}
          </div>
          <div className={`flex flex-col leading-none font-bold rotate-180 ${SUIT_COLORS[card.suit]}`}>
            <span className="text-lg sm:text-xl font-display">{card.rank}</span>
            <span className="text-sm sm:text-base">{SUIT_SYMBOLS[card.suit]}</span>
          </div>
        </div>
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <div className="w-full h-full m-1 border-2 border-white/20 rounded-lg flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-white/10 flex items-center justify-center">
              <span className="text-white/20 font-display font-bold text-2xl">L</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const SuitSelector: React.FC<{ onSelect: (suit: Suit) => void }> = ({ onSelect }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4">
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-6 text-center">
          Choose a New Suit
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {SUITS.map((suit) => (
            <button
              key={suit}
              onClick={() => onSelect(suit)}
              className={`
                flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-100
                hover:border-indigo-500 hover:bg-indigo-50 transition-all group
              `}
            >
              <span className={`text-5xl mb-2 ${SUIT_COLORS[suit]}`}>
                {SUIT_SYMBOLS[suit]}
              </span>
              <span className="text-slate-600 font-medium capitalize group-hover:text-indigo-600">
                {suit}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const GameOverModal: React.FC<{ winner: 'player' | 'ai'; onRestart: () => void }> = ({ winner, onRestart }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-sm w-full mx-4"
      >
        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${winner === 'player' ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-600'}`}>
          <Trophy size={40} />
        </div>
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">
          {winner === 'player' ? 'You Won!' : 'AI Won!'}
        </h2>
        <p className="text-slate-500 mb-8">
          {winner === 'player' ? 'Congratulations! You are the Crazy Eights master.' : 'Better luck next time! The AI was too quick.'}
        </p>
        <button
          onClick={onRestart}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw size={20} />
          Play Again
        </button>
      </motion.div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    discardPile: [],
    playerHand: [],
    aiHand: [],
    currentTurn: 'player',
    status: 'waiting',
    winner: null,
    activeSuit: null,
  });

  const [message, setMessage] = useState<string>("Welcome to Lorrin Crazy Eights!");
  const [showRules, setShowRules] = useState(false);

  // Initialize Game
  const initGame = useCallback(() => {
    const fullDeck = shuffleDeck(createDeck());
    const playerHand = fullDeck.splice(0, 8);
    const aiHand = fullDeck.splice(0, 8);
    
    // Find first non-8 card for discard pile
    let firstDiscardIdx = fullDeck.findIndex(c => c.rank !== '8');
    if (firstDiscardIdx === -1) firstDiscardIdx = 0;
    const discardPile = firstDiscardIdx !== -1 ? fullDeck.splice(firstDiscardIdx, 1) : [fullDeck.pop()!];

    setGameState({
      deck: fullDeck,
      discardPile,
      playerHand,
      aiHand,
      currentTurn: 'player',
      status: 'playing',
      winner: null,
      activeSuit: discardPile[0].suit,
    });
    setMessage("Your turn! Match the suit or rank.");
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];

  const isValidMove = (card: Card) => {
    if (card.rank === '8') return true;
    if (!topDiscard) return false;
    return card.suit === gameState.activeSuit || card.rank === topDiscard.rank;
  };

  const checkWin = (hand: Card[], turn: 'player' | 'ai') => {
    if (hand.length === 0) {
      setGameState(prev => ({ ...prev, status: 'game_over', winner: turn }));
      return true;
    }
    return false;
  };

  const handleDraw = () => {
    if (gameState.currentTurn !== 'player' || gameState.status !== 'playing') return;

    if (gameState.deck.length === 0) {
      setMessage("Deck is empty! Skipping turn.");
      setTimeout(() => setGameState(prev => ({ ...prev, currentTurn: 'ai' })), 1000);
      return;
    }

    const newDeck = [...gameState.deck];
    const drawnCard = newDeck.pop()!;
    
    setGameState(prev => ({
      ...prev,
      deck: newDeck,
      playerHand: [...prev.playerHand, drawnCard],
      currentTurn: 'ai'
    }));
    setMessage("You drew a card.");
  };

  const playCard = (card: Card, isPlayer: boolean) => {
    if (!isValidMove(card)) {
      if (isPlayer) setMessage("Invalid move! Match suit or rank, or play an 8.");
      return;
    }

    const newHand = (isPlayer ? gameState.playerHand : gameState.aiHand).filter(c => c.id !== card.id);
    const newDiscard = [...gameState.discardPile, card];
    
    if (card.rank === '8') {
      setGameState(prev => ({
        ...prev,
        discardPile: newDiscard,
        [isPlayer ? 'playerHand' : 'aiHand']: newHand,
        status: isPlayer ? 'suit_selection' : prev.status,
        activeSuit: isPlayer ? prev.activeSuit : null, // AI will set this in its turn logic
      }));
      if (isPlayer) setMessage("Crazy 8! Choose a new suit.");
    } else {
      const won = checkWin(newHand, isPlayer ? 'player' : 'ai');
      if (!won) {
        setGameState(prev => ({
          ...prev,
          discardPile: newDiscard,
          [isPlayer ? 'playerHand' : 'aiHand']: newHand,
          currentTurn: isPlayer ? 'ai' : 'player',
          activeSuit: card.suit,
        }));
        setMessage(isPlayer ? "AI's turn..." : "Your turn!");
      } else {
        setGameState(prev => ({
          ...prev,
          discardPile: newDiscard,
          [isPlayer ? 'playerHand' : 'aiHand']: newHand,
        }));
      }
    }
  };

  const handleSuitSelect = (suit: Suit) => {
    setGameState(prev => ({
      ...prev,
      activeSuit: suit,
      status: 'playing',
      currentTurn: 'ai'
    }));
    setMessage(`Suit changed to ${suit}. AI's turn...`);
  };

  // AI Logic
  useEffect(() => {
    if (gameState.currentTurn === 'ai' && gameState.status === 'playing' && !gameState.winner) {
      const timer = setTimeout(() => {
        const playableCards = gameState.aiHand.filter(isValidMove);
        
        if (playableCards.length > 0) {
          // Prefer non-8s
          const nonEight = playableCards.find(c => c.rank !== '8');
          const cardToPlay = nonEight || playableCards[0];
          
          if (cardToPlay.rank === '8') {
            // AI logic for choosing suit: pick the one it has most of
            const suitCounts: Record<Suit, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
            gameState.aiHand.forEach(c => { if(c.id !== cardToPlay.id) suitCounts[c.suit]++ });
            const bestSuit = (Object.keys(suitCounts) as Suit[]).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b);
            
            const newHand = gameState.aiHand.filter(c => c.id !== cardToPlay.id);
            const newDiscard = [...gameState.discardPile, cardToPlay];
            const won = checkWin(newHand, 'ai');
            
            setGameState(prev => ({
              ...prev,
              discardPile: newDiscard,
              aiHand: newHand,
              activeSuit: bestSuit,
              currentTurn: 'player'
            }));
            setMessage(`AI played an 8 and chose ${bestSuit}. Your turn!`);
          } else {
            playCard(cardToPlay, false);
          }
        } else {
          // AI must draw
          if (gameState.deck.length > 0) {
            const newDeck = [...gameState.deck];
            const drawnCard = newDeck.pop()!;
            setGameState(prev => ({
              ...prev,
              deck: newDeck,
              aiHand: [...prev.aiHand, drawnCard],
              currentTurn: 'player'
            }));
            setMessage("AI drew a card. Your turn!");
          } else {
            setGameState(prev => ({ ...prev, currentTurn: 'player' }));
            setMessage("AI skipped turn. Your turn!");
          }
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentTurn, gameState.status, gameState.aiHand, gameState.deck]);

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-between p-4 sm:p-8 select-none">
      {/* Header */}
      <div className="w-full flex justify-between items-center z-10">
        <div className="flex flex-col">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            TINA <span className="text-emerald-400">CRAZY 8s</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full animate-pulse ${gameState.currentTurn === 'player' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
            <span className="text-xs sm:text-sm font-medium text-white/60 uppercase tracking-widest">
              {gameState.currentTurn === 'player' ? 'Your Turn' : "AI Thinking..."}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setShowRules(true)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
          >
            <Info size={20} />
          </button>
          <button 
            onClick={initGame}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* AI Hand / Zone */}
      <div className="w-full max-w-4xl bg-black/20 backdrop-blur-sm rounded-b-[2rem] border-b border-x border-white/5 p-4 sm:p-6 relative -mt-4 sm:-mt-8">
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-0.5 bg-slate-700 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] text-slate-300 shadow-lg">
          AI Opponent
        </div>
        <div className="flex justify-center -space-x-12 sm:-space-x-16">
          {gameState.aiHand.map((card, idx) => (
            <PlayingCard 
              key={card.id} 
              card={card} 
              isFaceUp={false} 
              disabled 
              className="transform hover:translate-y-2"
            />
          ))}
        </div>
      </div>

      {/* Center Area: Deck and Discard Pile */}
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="flex items-center gap-12 sm:gap-24 bg-white/5 backdrop-blur-sm p-12 rounded-[4rem] border border-white/5 shadow-inner">
          {/* Draw Pile */}
          <div className="relative flex flex-col items-center gap-4">
            <div className="relative">
              {/* Stack effect */}
              <div className="absolute inset-0 bg-indigo-900 rounded-xl translate-x-1.5 translate-y-1.5" />
              <div className="absolute inset-0 bg-indigo-800 rounded-xl translate-x-0.75 translate-y-0.75" />
              <PlayingCard 
                card={{ id: 'back', suit: 'hearts', rank: 'A' }} 
                isFaceUp={false} 
                onClick={handleDraw}
                disabled={gameState.currentTurn !== 'player' || gameState.status !== 'playing'}
                className="sm:w-36 sm:h-52"
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-1.5 bg-black/40 rounded-full">
                <Layers size={16} className="text-white/60" />
                <span className="text-sm font-bold text-white/80">{gameState.deck.length}</span>
              </div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Draw Pile
              </div>
            </div>
          </div>

          {/* Discard Pile */}
          <div className="relative flex flex-col items-center gap-4">
            <div className="relative">
               <AnimatePresence mode="popLayout">
                {topDiscard && (
                  <motion.div
                    key={topDiscard.id}
                    initial={{ rotate: Math.random() * 20 - 10, scale: 0.8, opacity: 0 }}
                    animate={{ rotate: Math.random() * 10 - 5, scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    <PlayingCard card={topDiscard} disabled className="sm:w-36 sm:h-52" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                <span className={`text-xl leading-none ${SUIT_COLORS[gameState.activeSuit || 'hearts']}`}>
                  {SUIT_SYMBOLS[gameState.activeSuit || 'hearts']}
                </span>
                <span className="text-sm font-bold text-white/80 uppercase tracking-wider">
                  {gameState.activeSuit}
                </span>
              </div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Discard Pile
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Bar */}
      <motion.div 
        key={message}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-white/90 text-sm sm:text-base font-medium"
      >
        {message}
      </motion.div>

      {/* Player Hand / Zone */}
      <div className="w-full max-w-6xl bg-white/5 backdrop-blur-md rounded-t-[3rem] border-t border-x border-white/10 p-6 sm:p-10 relative">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1 bg-emerald-500 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-950 shadow-lg">
          Your Hand
        </div>
        <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex justify-center min-w-max px-4">
            <div className="flex -space-x-10 sm:-space-x-14">
              {gameState.playerHand.map((card) => (
                <PlayingCard 
                  key={card.id} 
                  card={card} 
                  isHighlighted={isValidMove(card) && gameState.currentTurn === 'player'}
                  onClick={() => playCard(card, true)}
                  disabled={gameState.currentTurn !== 'player' || gameState.status !== 'playing'}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {gameState.status === 'suit_selection' && (
          <SuitSelector onSelect={handleSuitSelect} />
        )}
        {gameState.status === 'game_over' && gameState.winner && (
          <GameOverModal winner={gameState.winner} onRestart={initGame} />
        )}
        {showRules && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full relative">
              <button 
                onClick={() => setShowRules(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">How to Play</h2>
              <div className="space-y-4 text-slate-600 text-sm sm:text-base">
                <p>• Match the <strong>Suit</strong> or <strong>Rank</strong> of the card on the discard pile.</p>
                <p>• <strong>8s are Wild!</strong> Play an 8 anytime to change the active suit.</p>
                <p>• If you can't play, you must <strong>Draw</strong> a card from the deck.</p>
                <p>• The first player to clear their hand wins the game!</p>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="w-full mt-8 py-3 bg-slate-900 text-white rounded-xl font-bold"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="absolute bottom-4 left-4 hidden sm:flex items-center gap-4 text-white/30 text-xs font-medium uppercase tracking-widest">
        <div className="flex items-center gap-1">
          <HandIcon size={14} />
          <span>{gameState.playerHand.length} Cards</span>
        </div>
        <div className="w-1 h-1 bg-white/20 rounded-full" />
        <span>Standard 52 Deck</span>
      </div>
    </div>
  );
}
