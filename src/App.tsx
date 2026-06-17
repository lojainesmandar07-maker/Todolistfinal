/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Settings, Leaf, ShoppingBasket, Plus, Trash2, Upload, Edit2, X, Check, FileQuestion, Camera, Lock, Unlock, Play, Pause, RotateCcw, Music, Music3, Timer, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue } from 'motion/react';
import * as htmlToImage from 'html-to-image';
import localforage from 'localforage';
import { useLocalForage, fileToBase64 } from './useLocalForage';
import { useGlobalAssets, useGoals } from './useFirestore';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

// --- Types ---
type Tab = 'Home' | 'Characters' | 'Decorations' | 'Goals' | 'Memories' | 'Admin';

// --- Shared Assets & SVGs ---
const AcornBullet = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mt-1">
    <path d="M12 2C7.58172 2 4 5.58172 4 10C4 11.8384 4.6213 13.535 5.6582 14.93C6.73173 16.3752 7 16.8 9 19C10.6667 20.8333 11 22 12 22C13 22 13.3333 20.8333 15 19C17 16.8 17.2683 16.3752 18.3418 14.93C19.3787 13.535 20 11.8384 20 10C20 5.58172 16.4183 2 12 2Z" fill="#A07253"/>
    <path d="M4 10H20C20 10 18 6 12 6C6 6 4 10 4 10Z" fill="#6B442A"/>
    <path d="M12 2V6" stroke="#6B442A" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const DecorativeFlourish = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center gap-1 sm:gap-3 w-full mb-3 sm:mb-4">
    <span className="text-wood-dark opacity-70 shrink-0">
      <svg className="w-5 h-2 sm:w-8 sm:h-3" viewBox="0 0 32 12" fill="currentColor">
        <path d="M30 6C24 6 22 1 18 1C14 1 12 6 6 6C12 6 14 11 18 11C22 11 24 6 30 6Z"/>
        <circle cx="2" cy="6" r="2"/>
        <circle cx="18" cy="6" r="1"/>
      </svg>
    </span>
    <h3 className="font-serif text-[11px] xs:text-[14px] sm:text-2xl font-extrabold text-[#4d2b18] tracking-wide text-center whitespace-nowrap select-none">{children}</h3>
    <span className="text-wood-dark opacity-70 rotate-180 shrink-0">
      <svg className="w-5 h-2 sm:w-8 sm:h-3" viewBox="0 0 32 12" fill="currentColor">
        <path d="M30 6C24 6 22 1 18 1C14 1 12 6 6 6C12 6 14 11 18 11C22 11 24 6 30 6Z"/>
        <circle cx="2" cy="6" r="2"/>
        <circle cx="18" cy="6" r="1"/>
      </svg>
    </span>
  </div>
);

// --- Draggable Setup (React mechanics for Decorations and Dress-Up) ---
type DraggableItem = { id: string; src: string; x: number; y: number; width?: number; flip?: number; isLocked?: boolean };

const DraggableObject: React.FC<{ 
  item: DraggableItem, 
  onRemove?: (id: string) => void, 
  onUpdate?: (item: DraggableItem) => void,
  hideControls?: boolean 
}> = ({ item, onRemove, onUpdate, hideControls }) => {
  const [width, setWidth] = useState(item.width || 120);
  const [flip, setFlip] = useState(item.flip || 1);
  const [isLocked, setIsLocked] = useState(item.isLocked || false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [showUnlockTip, setShowUnlockTip] = useState(false);
  const lastTapRef = useRef<number>(0);
  const x = useMotionValue(item.x || 0);
  const y = useMotionValue(item.y || 0);

  // Sync internal state back up on change (except x/y which sync on drag end)
  useEffect(() => {
    if (onUpdate) {
      onUpdate({ ...item, width, flip, isLocked, x: x.get(), y: y.get() });
    }
  }, [width, flip, isLocked]);

  // Handle outside tap/click to deselect when active
  useEffect(() => {
    if (!isSelected) return;
    const handleOutsideClick = () => {
      setIsSelected(false);
    };
    window.addEventListener('pointerdown', handleOutsideClick);
    return () => {
      window.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [isSelected]);

  const handleToggleLock = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isLocked) {
      // Locking is simple, single click/tap is enough
      setIsLocked(true);
      if (onUpdate) {
        onUpdate({ ...item, width, flip, isLocked: true, x: x.get(), y: y.get() });
      }
    } else {
      // Unlocking requires double click/tap!
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 350; // milliseconds
      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
        setIsLocked(false);
        setShowUnlockTip(false);
        if (onUpdate) {
          onUpdate({ ...item, width, flip, isLocked: false, x: x.get(), y: y.get() });
        }
      } else {
        setShowUnlockTip(true);
        // Hide the bounce reminder bubble after 1.5 seconds automatically
        setTimeout(() => {
          setShowUnlockTip(false);
        }, 1500);
      }
      lastTapRef.current = now;
    }
  };

  const handleDoubleClick = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (hideControls) return;
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);
    setShowUnlockTip(false);
    if (onUpdate) {
      onUpdate({ ...item, width, flip, isLocked: nextLocked, x: x.get(), y: y.get() });
    }
  };

  return (
    <motion.div
      drag={!isLocked}
      dragMomentum={false}
      style={{ x, y, touchAction: 'none' }}
      onDragStart={() => {
        setIsDragging(true);
        setIsSelected(true);
      }}
      onDragEnd={() => {
        setIsDragging(false);
        if (onUpdate) {
          x.set(x.get());
          y.set(y.get());
          onUpdate({ 
            ...item, 
            x: x.get(), 
            y: y.get(),
            width,
            flip,
            isLocked
          });
        }
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        setIsSelected(true);
      }}
      onDoubleClick={handleDoubleClick}
      className={`absolute z-[100] group pointer-events-auto ${isLocked ? '' : 'cursor-grab active:cursor-grabbing'} ${isDragging ? 'z-[200]' : ''}`}
    >
      <div 
        className={`relative p-2 rounded transition-all duration-200 ${
          hideControls 
            ? '' 
            : isSelected 
              ? 'ring-2 ring-dashed ring-wood-dark/75 bg-wood-light/10 shadow-lg' 
              : 'group-hover:ring-2 ring-dashed ring-wood-dark/40'
        }`} 
        style={{ width: width }}
      >
        {/* Tooltip reminder to click twice */}
        {showUnlockTip && isLocked && !hideControls && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[#8c5737] text-[#fcf8f2] text-[10px] font-sans px-2.5 py-1 rounded shadow-md whitespace-nowrap z-[120] pointer-events-none animate-bounce border border-wood-dark/20">
            Click twice to unlock!
          </div>
        )}

        {/* Lock/Unlock Toggle */}
        {!hideControls && (
          <button 
            onClick={handleToggleLock}
            onPointerDown={(e) => e.stopPropagation()}
            className={`absolute -top-11 left-1/2 -translate-x-1/2 w-9 h-9 flex items-center justify-center bg-[#8c5737] hover:bg-[#6e4125] text-white rounded-full border border-wood-dark/40 shadow-md z-[110] transition-all transform active:scale-90 ${
              isSelected ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-0 invisible sm:group-hover:opacity-100 sm:group-hover:scale-100 sm:group-hover:visible'
            }`}
            title={isLocked ? "Click twice to unlock" : "Lock decoration"}
          >
            {isLocked ? <Lock className="w-4 h-4 text-[#ffebad] animate-pulse" /> : <Unlock className="w-4 h-4 text-white" />}
          </button>
        )}

        {/* Delete button */}
        {onRemove && !hideControls && !isLocked && (
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onRemove(item.id); 
            }}
            onPointerDown={(e) => e.stopPropagation()} 
            className={`absolute -top-3.5 -right-3.5 w-9 h-9 flex items-center justify-center bg-red-500 hover:bg-[#b91c1c] text-white rounded-full border border-red-700/30 shadow-md z-[110] transition-all transform active:scale-90 ${
              isSelected ? 'opacity-100 scale-100' : 'opacity-0 sm:group-hover:opacity-100 sm:group-hover:scale-100 scale-0'
            }`}
            title="Remove decoration"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {/* Resize & Flip Controls */}
        {!isLocked && !hideControls && (
          <div 
            className={`absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-[110] transition-all transform p-1 bg-[#fcf8f2] border border-wood-dark/20 rounded-full shadow-md ${
              isSelected ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-75 invisible sm:group-hover:opacity-100 sm:group-hover:scale-100 sm:group-hover:visible'
            }`}
            onPointerDown={(e) => e.stopPropagation()}
          >
             <button 
               onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWidth(w => Math.max(40, w - 20)); }} 
               className="bg-[#8c5737] hover:bg-[#6e4125] text-[#fcf8f2] rounded-full w-7 h-7 flex items-center justify-center shadow-sm font-sans font-bold hover:scale-110 active:scale-95 text-base leading-none pb-0.5"
               title="Make smaller"
             >-</button>
             <button 
               onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFlip(f => f * -1); }} 
               className="bg-[#8c5737] hover:bg-[#6e4125] text-[#fcf8f2] rounded-full w-7 h-7 flex items-center justify-center shadow-sm font-sans hover:scale-110 active:scale-95 text-xs font-bold"
               title="Flip horizontally"
             >⇄</button>
             <button 
               onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWidth(w => w + 20); }} 
               className="bg-[#8c5737] hover:bg-[#6e4125] text-[#fcf8f2] rounded-full w-7 h-7 flex items-center justify-center shadow-sm font-sans font-bold hover:scale-110 active:scale-95 text-base leading-none pb-0.5"
               title="Make larger"
             >+</button>
          </div>
        )}

        {item.src ? (
          <img 
             src={item.src} 
             className="w-full h-auto pointer-events-none origin-center transition-transform" 
             alt="Asset" 
             referrerPolicy="no-referrer"
             style={{ transform: `scaleX(${flip})` }}
          />
        ) : (
          <div 
             className="w-full aspect-square bg-gray-200 border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center text-xs text-center text-gray-500 pointer-events-none"
          >
             <span>[Asset]</span>
             <span className="text-[10px] break-all">{item.src}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

import { auth, useIsAdmin } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { AuthView } from './AuthView';

export type Memory = { id: string; url: string; date: string; note: string };

export default function Main() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return null;
  if (!user) return <AuthView />;

  return <CornerApp user={user} />;
}

const getInitialPlacement = (itemWidth = 120) => {
  const container = document.getElementById('decorations-container');
  let baseW = 300;
  let baseH = 700;
  if (container) {
    baseW = container.clientWidth;
    baseH = container.clientHeight;
  } else {
    const screenW = window.innerWidth;
    baseW = Math.min(800, screenW - 40);
  }
  
  const midX = Math.max(10, Math.floor((baseW - itemWidth) / 2));
  const midY = Math.max(100, Math.floor(baseH / 2 - 120));
  
  // Add some random jitter so multiple clicks don't overlap perfectly
  const jitterX = Math.floor(Math.random() * 41) - 20; // -20 to +20
  const jitterY = Math.floor(Math.random() * 41) - 20; // -20 to +20
  
  return {
    x: Math.max(10, Math.min(baseW - itemWidth - 10, midX + jitterX)),
    y: Math.max(10, Math.min(baseH - 120, midY + jitterY))
  };
};

export function CornerApp({ user }: { user: User }) {
  const isAdmin = useIsAdmin();
  const [currentTab, setCurrentTab] = useState<Tab>('Home');
  const [globalDecorations, setGlobalDecorations] = useLocalForage<DraggableItem[]>(`corner_globalDecos_${user.uid}`, []);
  const [showSettings, setShowSettings] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);

  // Lifted Pomodoro Timer state
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionLength, setSessionLength] = useState(25);
  const [showConfettiTimer, setShowConfettiTimer] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setShowConfettiTimer(true);
      setTimeout(() => setShowConfettiTimer(false), 8000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);
  
  // Custom assets state
  const [customBgUrl, setCustomBgUrl] = useLocalForage<string>(`corner_bg_${user.uid}`, '');
  const [signBgUrl, setSignBgUrl] = useLocalForage<string>(`corner_sign_${user.uid}`, '');
  const [boardBgUrl, setBoardBgUrl] = useLocalForage<string>(`corner_board_${user.uid}`, '');
  const [avatarUrl, setAvatarUrl] = useLocalForage<string>(`corner_avatar_${user.uid}`, '');
  const [customDecals, setCustomDecals] = useLocalForage<string[]>(`corner_decals_${user.uid}`, []);
  const [customClothes, setCustomClothes] = useLocalForage<string[]>(`corner_clothes_${user.uid}`, []);
  const [characterBaseUrl, setCharacterBaseUrl] = useLocalForage<string>(`corner_characterBase_${user.uid}`, '');
  const [fontMode, setFontMode] = useLocalForage<'Dark' | 'Light'>(`corner_fontMode_${user.uid}`, 'Dark');
  const [profileName, setProfileName] = useLocalForage<string>(`corner_profileName_${user.uid}`, 'Little Corner');

  // Memories
  const [memories, setMemories] = useLocalForage<Memory[]>(`corner_memories_${user.uid}`, []);
  const [isCapturingMemory, setIsCapturingMemory] = useState(false);

  const takeSnapshot = async () => {
    const boardElement = document.getElementById('main-board-capture');
    if (!boardElement) return;
    try {
      setIsCapturingMemory(true);
      // Wait a tick for UI update
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await (htmlToImage.toJpeg as any)(boardElement, {
         quality: 0.4,
         style: { transform: 'scale(1)', margin: '0' },
         skipFonts: true,
         fontEmbedCSS: '',
         styleSheetsFilter: (sheet) => {
           try {
             if (sheet.href && !sheet.href.startsWith(window.location.origin)) {
               return false;
             }
             const rules = sheet.cssRules;
             return !!rules;
           } catch {
             return false;
           }
         }
      });
      const newMemory: Memory = {
         id: Date.now().toString(),
         url: dataUrl,
         date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
         note: 'A cozy moment...'
      };
      setMemories(prev => [newMemory, ...prev]);
      setCurrentTab('Memories');
    } catch (err) {
      console.error(err);
    } finally {
      setIsCapturingMemory(false);
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'Home': return (
        <HomeView 
          avatarUrl={avatarUrl} 
          setAvatarUrl={setAvatarUrl} 
          profileName={profileName} 
          setProfileName={setProfileName} 
          onOpenSettings={() => setShowSettings(true)} 
          onOpenTimer={() => setShowTimerModal(true)}
          timeLeft={timeLeft}
          isActive={isActive}
        />
      );
      case 'Characters': return <CharactersDressUpView characterBaseUrl={characterBaseUrl} setCharacterBaseUrl={setCharacterBaseUrl} onDone={(src: string) => {
        const pos = getInitialPlacement(160);
        setGlobalDecorations(prev => [...prev, { id: Math.random().toString(), src, x: pos.x, y: pos.y, width: 160 }]);
        setCurrentTab('Home');
      }} />;
      case 'Decorations': return <DecorationsMenu onAdd={(src: string) => {
        const pos = getInitialPlacement(120);
        setGlobalDecorations(prev => [...prev, { id: Math.random().toString(), src, x: pos.x, y: pos.y }]);
      }} />;
      case 'Goals': return <GoalsTrackerView />;
      case 'Memories': return <MemoriesDiaryView memories={memories} setMemories={setMemories} />;
      case 'Admin': return <AdminDashboard />;
    }
  };

  return (
    <div 
      className={`relative min-h-screen pb-16 pt-8 flex justify-center overflow-x-hidden select-none ${fontMode === 'Light' ? 'theme-light-fonts' : ''}`}
      style={customBgUrl ? { backgroundImage: `url(${customBgUrl})`, backgroundSize: 'cover' } : {}}
    >
      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)}
          customBgUrl={customBgUrl}
          setCustomBgUrl={setCustomBgUrl}
          signBgUrl={signBgUrl}
          setSignBgUrl={setSignBgUrl}
          boardBgUrl={boardBgUrl}
          setBoardBgUrl={setBoardBgUrl}
          fontMode={fontMode}
          setFontMode={setFontMode}
          avatarUrl={avatarUrl}
          setAvatarUrl={setAvatarUrl}
        />
      )}

      <AnimatePresence>
        {showTimerModal && (
          <FocusTimerModal 
            onClose={() => setShowTimerModal(false)}
            timeLeft={timeLeft}
            setTimeLeft={setTimeLeft}
            isActive={isActive}
            setIsActive={setIsActive}
            sessionLength={sessionLength}
            setSessionLength={setSessionLength}
            showConfettiTimer={showConfettiTimer}
            setShowConfettiTimer={setShowConfettiTimer}
          />
        )}
      </AnimatePresence>

      {/* Floating Camera Button */}
      <button 
        onClick={takeSnapshot}
        disabled={isCapturingMemory}
        className="fixed bottom-6 right-6 w-14 h-14 bg-pink-400 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/50 hover:bg-pink-500 hover:scale-110 active:scale-95 transition-all z-50 group"
        title="Take Snapshot of Desk"
      >
        <Camera className="w-6 h-6" />
        <span className="absolute right-16 bg-white/90 text-pink-700 text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm whitespace-nowrap font-bold">
          {isCapturingMemory ? 'Capturing...' : 'Snap Desk!'}
        </span>
      </button>

      <div className="w-full max-w-[850px] flex flex-col items-center z-10 px-4 md:px-0 mx-auto">
        
        {/* -- Header Sign -- */}
        <div className="relative w-full wood-board rounded-t-[3rem] rounded-b-xl p-2 md:p-3 border-b-4 md:border-b-8 border-r-2 md:border-r-4 border-wood-dark z-20 dynamic-border">
          <div 
            className="wood-inner rounded-t-[2.5rem] rounded-b-lg p-2 md:p-4 relative overflow-hidden flex flex-col items-center justify-center min-h-[80px] md:min-h-[150px] dynamic-text-container dynamic-border"
            style={signBgUrl ? { backgroundImage: `url(${signBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          >
            {/* Grass/Mushroom decorative footer placeholder */}
            <div className="absolute bottom-0 left-0 right-0 h-3 md:h-6 bg-green-900/10 border-t border-green-900/20" />

            <h1 
              className="font-script text-[2.75rem] sm:text-[3.75rem] md:text-[4.75rem] text-[#4d2b18] mt-2 md:mt-6 z-20 dynamic-text leading-none select-none transition-transform hover:scale-[1.02] duration-300"
              style={{ 
                textShadow: '1px 1px 1px rgba(255,255,255,0.7), 2.5px 3.5px 5px rgba(77,43,24,0.3)',
                letterSpacing: '0.04em'
              }}
            >
              Little Corner
            </h1>
          </div>
        </div>

        {/* -- Ropes & Navigation -- */}
        <div className="flex flex-wrap gap-x-1.5 gap-y-2.5 xs:gap-x-2 md:gap-4 w-full justify-center -mt-1 z-10 relative px-2 md:px-8 pb-4">
          <NavPill label="Home" tab="Home" current={currentTab} setTab={setCurrentTab} color="bg-pink-muted" />
          <NavPill label="Characters" tab="Characters" current={currentTab} setTab={setCurrentTab} color="bg-purple-muted pattern-stars" pattern />
          <NavPill label="Decorations" tab="Decorations" current={currentTab} setTab={setCurrentTab} color="bg-mauve-muted pattern-damask" pattern />
          <NavPill label="Goals" tab="Goals" current={currentTab} setTab={setCurrentTab} color="bg-teal-muted pattern-clouds" pattern />
          <NavPill label="Memories" tab="Memories" current={currentTab} setTab={setCurrentTab} color="bg-[#d0a79e] pattern-dots" pattern />
          {isAdmin && <NavPill label="Admin" tab="Admin" current={currentTab} setTab={setCurrentTab} color="bg-red-200" />}
        </div>

        {/* -- Main Board -- */}
        <div className="w-full relative wood-board pl-3 pr-[14px] pt-3 pb-4 md:pl-5 md:pr-6 md:pt-5 md:pb-7 mt-2 md:mt-4 rounded-xl border-b-4 md:border-b-8 border-r-2 md:border-r-4 border-wood-dark z-0 dynamic-border" id="main-board-capture">
          <div 
            className="bg-paper stitch-border p-2.5 xs:p-4 sm:p-6 md:p-8 rounded-lg relative text-text-brown h-[680px] xs:h-[720px] sm:h-[750px] md:h-[780px] flex flex-col shadow-sm dynamic-text-container dynamic-border overflow-visible"
            style={boardBgUrl ? { backgroundImage: `url(${boardBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          >
            {/* Global Freely Draggable Decorations Layer inside Board */}
            <div id="decorations-container" className="absolute inset-0 z-[40] pointer-events-none w-full h-full overflow-visible">
              {globalDecorations.map(dec => (
                <DraggableObject 
                  key={dec.id} 
                  item={dec} 
                  hideControls={isCapturingMemory}
                  onRemove={isCapturingMemory ? undefined : (id) => setGlobalDecorations(prev => prev.filter(d => d.id !== id))} 
                  onUpdate={(updatedItem) => setGlobalDecorations(prev => prev.map(d => d.id === updatedItem.id ? updatedItem : d))}
                />
              ))}
            </div>

            {/* Screws */}
            <div className="screw top-3 left-3" />
            <div className="screw top-3 right-3" />
            <div className="screw bottom-3 left-3" />
            <div className="screw bottom-3 right-3" />

            {/* Welcome Banner */}
            <div className="flex justify-center mt-[-0.5rem] md:mt-[-1rem] mb-4 md:mb-6 relative z-30">
               <div className="bg-wood-light border-y-2 border-x-4 border-wood-shadow px-4 md:px-8 py-1.5 md:py-2 rounded-sm relative flex items-center gap-3 dynamic-border drop-shadow-md">
                  <div className="absolute -left-3 top-[-2px] bottom-[-2px] w-4 bg-[#c8a883] rounded-l-full border-2 border-wood-shadow dynamic-border" />
                  <div className="absolute -right-3 top-[-2px] bottom-[-2px] w-4 bg-[#c8a883] rounded-r-full border-2 border-wood-shadow dynamic-border" />
                  <span className="text-wood-dark text-sm dynamic-text">✿</span>
                  <h2 className="font-script text-xl md:text-2xl text-[#8E4424] dynamic-text">Welcome!</h2>
                  <span className="text-wood-dark text-sm dynamic-text">✿</span>
               </div>
            </div>

            {/* Dynamic Content */}
            <div className={`mt-8 flex-1 pr-2 relative z-10 transition-all duration-300 ${currentTab === 'Home' ? 'overflow-hidden h-full flex flex-col' : 'overflow-y-auto custom-scrollbar'}`}>
              {renderContent()}
            </div>
            
            {/* Lofi Radio / Phonograph */}
            <LoFiPlayer />
          </div>
        </div>

      </div>
    </div>
  );
}

// --- Navigation Pill Helper ---
function NavPill({ label, tab, current, setTab, color, pattern }: { label: string, tab: Tab, current: Tab, setTab: (t: Tab) => void, color: string, pattern?: boolean }) {
  const isActive = current === tab;
  return (
    <div className="relative group cursor-pointer flex flex-col items-center flex-shrink-0" onClick={() => setTab(tab)}>
      {/* Ropes */}
      <div className="w-1 sm:w-2 h-4 sm:h-6 bg-[repeating-linear-gradient(45deg,#f5f5f5,#f5f5f5_2px,#d4d4d4_2px,#d4d4d4_4px)] rounded-sm shadow-sm z-0" />
      {/* Pill */}
      <div className={`
        relative overflow-hidden z-10 px-2.5 xs:px-4 sm:px-7 py-1.5 sm:py-2 rounded-full border-2 border-dashed 
        shadow-[0_4px_6px_rgba(0,0,0,0.16)] transition-transform duration-200
        ${isActive 
          ? `${color} border-[#ead9c4] translate-y-1 shadow-[0_2px_4px_rgba(0,0,0,0.12)]` 
          : 'bg-[#ebdcd0]/90 border-[#cbb3a1] hover:translate-y-0.5 hover:bg-[#e6d0bf]'
        }
      `}>
        {isActive && pattern && <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none" />}
        <span className={`
          relative z-20 font-serif text-[11px] xs:text-[13px] sm:text-[17px] font-bold whitespace-nowrap tracking-wide select-none
          ${isActive 
            ? 'text-[#fdf9f1] drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]' 
            : 'text-[#6b4231]'
          }
        `}>
          {label}
        </span>
      </div>
    </div>
  );
}

type Task = {
  id: number;
  text: string;
  completed: boolean;
  completing: boolean;
  dateCategory: string; // 'Today', 'Tomorrow', 'This week', 'This month'
  isDaily: boolean;
  important?: boolean;
};

const initialTasks: Task[] = [
  { id: 1, text: "Welcome to your Little Corner!", completed: false, completing: false, dateCategory: "Today", isDaily: true },
];

function LoFiPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => {
    const saved = localStorage.getItem('corner_trackIndex');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem('corner_trackIndex', currentTrackIndex.toString());
  }, [currentTrackIndex]);

  const audioRef = useRef<HTMLAudioElement>(null);

  const tracks = [
    { name: "Chill LoFi", src: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3" },
    { name: "Coffee Shop", src: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg" },
    { name: "Crackling Fire", src: "https://actions.google.com/sounds/v1/ambiences/fire.ogg" },
  ];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      if (isPlaying) {
         audioRef.current.play().catch(e => console.log('Playback error:', e));
      }
    }
  }, [currentTrackIndex, isPlaying]); // Added isPlaying to deps just in case, though play() is also called in togglePlay

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.log('Playback error:', e));
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed bottom-6 left-6 md:bottom-24 md:left-auto md:right-6 z-50 flex flex-col items-start md:items-end gap-2 drop-shadow-md">
       <audio ref={audioRef} loop src={tracks[currentTrackIndex]?.src || tracks[0].src} /> 
       
       <div className="flex flex-col items-start md:items-end gap-2">
         {/* Toggle Menu Button - Top */}
         <button 
           onClick={() => setShowMenu(!showMenu)}
           className="bg-wood-light text-wood-dark px-3 py-1.5 rounded-full border-2 border-wood-dark shadow-sm text-xs font-bold font-sans hover:bg-wood-mid hover:text-white transition-colors flex items-center gap-2"
         >
           <Music className="w-3 h-3" />
           {tracks[currentTrackIndex]?.name || tracks[0].name}
         </button>

         <div className="flex flex-row-reverse md:flex-row items-start gap-3">
           {/* Track Menu */}
           <AnimatePresence>
             {showMenu && (
               <motion.div 
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className="bg-wood-light border-2 border-wood-dark p-2 rounded-xl shadow-lg flex flex-col gap-1 max-h-[200px] overflow-y-auto custom-scrollbar"
               >
                 {tracks.map((track, i) => (
                   <button
                     key={i}
                     onClick={() => { setCurrentTrackIndex(i); setShowMenu(false); }}
                     className={`text-left px-3 py-1.5 rounded-lg font-sans text-sm whitespace-nowrap transition-colors ${currentTrackIndex === i ? 'bg-wood-dark text-white font-bold' : 'text-wood-dark hover:bg-wood-mid/40'}`}
                   >
                     {track.name}
                   </button>
                 ))}
               </motion.div>
             )}
           </AnimatePresence>

           {/* Phonograph / Radio UI */}
           <div 
             className={`relative flex items-center justify-center w-16 h-16 rounded-full bg-wood-light border-4 border-wood-dark shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95 ${isPlaying ? 'animate-[spin_4s_linear_infinite] border-teal-muted' : ''}`}
             onClick={togglePlay}
           >
             {/* Inner record details */}
             <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-pink-400 border-2 border-[#1a1a1a]" />
             </div>
             
             {isPlaying && (
               <motion.div 
                 initial={{ opacity: 0, y: 0 }}
                 animate={{ opacity: [0, 1, 0], y: -20, x: [0, 10, -5, 0] }}
                 transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                 className="absolute -top-2 -right-4 pointer-events-none"
               >
                 <Music3 className="w-4 h-4 text-pink-400" />
               </motion.div>
             )}
           </div>
         </div>
       </div>
    </div>
  );
}

function FocusTimerModal({ 
  onClose, 
  timeLeft, 
  setTimeLeft, 
  isActive, 
  setIsActive, 
  sessionLength, 
  setSessionLength,
  showConfettiTimer,
  setShowConfettiTimer
}: any) {
  const { width, height } = useWindowSize();
  const [customTime, setCustomTime] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(sessionLength * 60);
    setShowConfettiTimer(false);
  };

  const handleSessionChange = (mins: number) => {
    setSessionLength(mins);
    if (!isActive) {
      setTimeLeft(mins * 60);
    }
    setShowConfettiTimer(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customTime);
    if (!isNaN(mins) && mins > 0) {
       handleSessionChange(mins);
       setShowCustom(false);
       setCustomTime("");
    }
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {showConfettiTimer && <Confetti width={width} height={height} recycle={false} numberOfPieces={300} gravity={0.15} style={{ position: 'fixed', top: 0, left: 0, zIndex: 10001 }} />}
      
      <motion.div 
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        className="relative bg-paper stitch-border p-6 md:p-8 rounded-2xl w-full max-w-[400px] shadow-2xl border-4 border-wood-dark flex flex-col items-center"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-wood-dark/10 rounded-full text-wood-dark transition-colors z-20">
          <span className="font-sans font-bold text-lg leading-none">✕</span>
        </button>

        <DecorativeFlourish>Focus Timer</DecorativeFlourish>

        {/* Acorn shape container */}
        <div className="relative w-48 mx-auto flex flex-col items-center mt-4 z-10 transition-transform hover:-translate-y-1 duration-300 group">
           {/* Acorn Cap */}
           <div className="w-40 h-16 bg-[#8c5737] rounded-[50px_50px_10px_10px] border-b-4 border-[#61361c] relative flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)] z-10">
             {/* STEM */}
             <div className="absolute -top-3 w-3 h-5 bg-[#61361c] rounded-[10px_10px_0_0]" />
             <div className="absolute -top-3 -right-2 transform rotate-45 w-4 h-4 text-green-700/80 pointer-events-none group-hover:rotate-[60deg] transition-transform duration-500 origin-bottom-left">
               <Leaf className="w-full h-full fill-current" />
             </div>
             {/* Crosshatch Pattern for Cap */}
             <div className="absolute inset-0 opacity-20 pointer-events-none rounded-[50px_50px_10px_10px]" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, #4d2b18 4px, #4d2b18 8px), repeating-linear-gradient(-45deg, transparent, transparent 4px, #4d2b18 4px, #4d2b18 8px)'}}></div>
           </div>
           
           {/* Acorn Body (Timer Display) */}
           <div className="w-36 h-36 bg-[#d8b792] rounded-[10px_10px_100px_100px] flex flex-col items-center pt-3 pb-6 shadow-[inset_0_-8px_16px_rgba(100,50,20,0.3)] border-2 border-t-0 border-[#c5a17b] relative overflow-hidden -mt-1">
              <h4 className="font-serif text-[11px] uppercase tracking-widest text-[#8c5737] font-bold mb-1 z-10 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">Focus Time</h4>
              <div className={`font-mono text-4xl font-bold tracking-tighter drop-shadow-md z-10 transition-colors ${timeLeft === 0 ? 'text-green-700 animate-pulse' : 'text-[#61361c]'}`}>
                {timeString}
              </div>

              {/* Controls */}
              <div className="flex gap-2 mt-2 z-10">
                <button onClick={toggleTimer} className="w-8 h-8 rounded-full bg-[#8c5737] hover:bg-[#61361c] flex items-center justify-center text-white shadow-sm transition-colors border border-white/20 hover:scale-110 active:scale-95">
                  {isActive ? <Pause className="w-4 h-4 fill-current"/> : <Play className="w-4 h-4 fill-current ml-0.5"/>}
                </button>
                <button onClick={resetTimer} className="w-8 h-8 rounded-full bg-[#8c5737] hover:bg-[#61361c] flex items-center justify-center text-white shadow-sm transition-colors border border-white/20 hover:scale-110 active:scale-95">
                  <RotateCcw className="w-4 h-4"/>
                </button>
              </div>
              
              {/* Progress fill visual */}
              <div 
                className="absolute bottom-0 left-0 right-0 bg-[#c5a17b] transition-all duration-1000 ease-linear z-0"
                style={{ height: `${((sessionLength * 60 - timeLeft) / (sessionLength * 60)) * 100}%` }}
              />
           </div>
        </div>

        {/* Duration Selectors */}
        <div className="flex gap-1.5 mt-6 bg-wood-light/40 px-3 py-1.5 rounded-full border border-wood-dark/10 shadow-sm relative z-0 flex-wrap justify-center w-full max-w-[280px]">
          {[5, 10, 25, 45].map(m => (
            <button 
              key={m}
              onClick={() => { handleSessionChange(m); setShowCustom(false); }}
              className={`text-[11px] font-bold font-sans px-2.5 py-1 rounded-full transition-all ${sessionLength === m && !showCustom ? 'bg-wood-dark text-white shadow-sm scale-110' : 'text-wood-dark hover:bg-wood-mid/30'}`}
            >
              {m}m
            </button>
          ))}
          <button
            onClick={() => setShowCustom(!showCustom)}
            className={`text-[11px] font-bold font-sans px-2.5 py-1 rounded-full transition-all ${showCustom ? 'bg-wood-dark text-white shadow-sm scale-110' : 'text-wood-dark hover:bg-wood-mid/30'}`}
          >
            Custom
          </button>
        </div>
        
        <AnimatePresence>
          {showCustom && (
            <motion.form 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              onSubmit={handleCustomSubmit} 
              className="mt-3 flex gap-2 w-full justify-center max-w-[240px]"
            >
              <input 
                type="number" 
                placeholder="Mins" 
                value={customTime} 
                onChange={e => setCustomTime(e.target.value)}
                className="w-20 px-2 py-1 text-xs border border-wood-dark/35 bg-white rounded-md focus:outline-none text-center font-bold font-sans"
              />
              <button type="submit" className="bg-[#8c5737] hover:bg-[#61361c] text-white text-xs px-3 py-1 rounded-md font-sans font-semibold transition-colors">
                Set
              </button>
            </motion.form>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}

function HomeView({ 
  avatarUrl, 
  setAvatarUrl, 
  profileName, 
  setProfileName, 
  onOpenSettings,
  onOpenTimer,
  timeLeft,
  isActive
}: { 
  avatarUrl: string; 
  setAvatarUrl: (url: string) => void; 
  profileName: string; 
  setProfileName: (name: string) => void; 
  onOpenSettings: () => void; 
  onOpenTimer: () => void;
  timeLeft: number;
  isActive: boolean;
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [dateFilter, setDateFilter] = useState("Today");
  const [viewMode, setViewMode] = useState<'Active' | 'Completed'>('Active');
  const [openTaskMenuId, setOpenTaskMenuId] = useState<number | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profileName);

  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskIsDaily, setNewTaskIsDaily] = useState(false);
  const [newTaskIsImportant, setNewTaskIsImportant] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTaskText, setEditTaskText] = useState("");

  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  
  const [rolloverTasks, setRolloverTasks] = useState<Task[]>([]);
  const [showRollover, setShowRollover] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
       const todayStr = new Date().toISOString().split('T')[0];
       let storedTasks = await localforage.getItem<Task[]>('corner_tasks');
       let storedDate = await localforage.getItem<string>('corner_date');
       
       if (!storedTasks) {
          const old = localStorage.getItem('corner_tasks');
          if (old) storedTasks = JSON.parse(old);
       }
       if (!storedDate) {
          const old = localStorage.getItem('corner_date');
          if (old) storedDate = old;
       }
       
       let loadedTasks: Task[] = storedTasks ? storedTasks : initialTasks;
       
       // Fix stuck completed animations on load
       loadedTasks = loadedTasks.map(t => ({ ...t, completing: false }));
       
       if (storedDate && storedDate !== todayStr) {
          // A new day! Reset dailies
          let uncompletedTasks: Task[] = [];
          loadedTasks = loadedTasks.map(t => {
            if (t.isDaily) {
               return { ...t, completed: false, dateCategory: "Today" };
            }
            if (t.dateCategory === "Tomorrow") {
               return { ...t, dateCategory: "Today" }; // Rollover Tomorrow to Today automatically
            }
            if (!t.completed && (t.dateCategory === "Today" || t.dateCategory === "This week" || t.dateCategory === "This month")) {
               uncompletedTasks.push(t);
            }
            if (t.completed && t.dateCategory === "Today") {
               return { ...t, dateCategory: "Past_Completed" }; // Hide old completed ones from today
            }
            return t;
          });
          
          if (uncompletedTasks.length > 0) {
             setRolloverTasks(uncompletedTasks);
             setShowRollover(true);
          }
          await localforage.setItem('corner_date', todayStr);
       } else if (!storedDate) {
          await localforage.setItem('corner_date', todayStr);
       }
       
       setTasks(loadedTasks);
       setTasksLoaded(true);
    };
    loadTasks();
  }, []);

  useEffect(() => {
    if (tasksLoaded) {
       localforage.setItem('corner_tasks', tasks);
    }
  }, [tasks, tasksLoaded]);

  const toggleTask = (id: number) => {
    if (editingTaskId !== null) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    if (task.completed) {
      setTasks(ts => ts.map(t => t.id === id ? { ...t, completed: false } : t));
    } else if (!task.completing) {
      // Set both completed AND completing to true so it stays in Active for the animation
      // but also has completed=true in case they refresh immediately.
      setTasks(ts => ts.map(t => t.id === id ? { ...t, completing: true, completed: true } : t));
      setTimeout(() => {
        setTasks(ts => ts.map(t => t.id === id ? { ...t, completing: false } : t));
      }, 1200);
    }
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    setTasks(prev => [...prev, {
      id: Date.now(),
      text: newTaskText,
      completed: false,
      completing: false,
      dateCategory: dateFilter,
      isDaily: newTaskIsDaily,
      important: newTaskIsImportant,
    }]);
    setNewTaskText("");
    setNewTaskIsDaily(false);
    setNewTaskIsImportant(false);
    setShowNewTaskForm(false);
  };

  const saveEdit = (id: number) => {
    if (!editTaskText.trim()) return;
    setTasks(ts => ts.map(t => t.id === id ? { ...t, text: editTaskText } : t));
    setEditingTaskId(null);
  };

  const confirmRemoveTask = (id: number) => {
    setTaskToDelete(id);
  };

  const executeRemoveTask = () => {
    if (taskToDelete !== null) {
      setTasks(ts => ts.filter(t => t.id !== taskToDelete));
      setTaskToDelete(null);
    }
  };
  
  const clearCompletedTasks = () => {
    setTasks(ts => ts.filter(t => !(t.dateCategory === dateFilter && t.completed)));
  };

  const handleRolloverDecision = (taskId: number, decision: 'delete' | 'keep') => {
    if (decision === 'delete') {
      setTasks(ts => ts.filter(t => t.id !== taskId));
    } else {
      setTasks(ts => ts.map(t => t.id === taskId ? { ...t, dateCategory: "Today" } : t));
    }
    setRolloverTasks(prev => prev.filter(t => t.id !== taskId));
    if (rolloverTasks.length <= 1) setShowRollover(false);
  };

  const filteredTasksByDate = tasks.filter(t => t.dateCategory === dateFilter);
  const displayedTasks = filteredTasksByDate.filter(t => {
    if (viewMode === 'Active') return !t.completed || t.completing;
    return t.completed && !t.completing;
  });

  const totalTasks = filteredTasksByDate.length;
  const completedTasksCount = filteredTasksByDate.filter(t => t.completed).length;
  const progressPercent = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0;

  return (
    <div className="flex flex-row gap-0 relative items-stretch w-full h-full min-h-0 overflow-hidden">

      {/* Left Sidebar: Profile */}
      <div className="w-[36%] xs:w-[34%] sm:w-[240px] flex-shrink-0 flex flex-col items-center pr-3 xs:pr-4 sm:pr-8 border-r-2 border-dashed border-[#d8b792]/65 pb-4">
        {/* Avatar Area with Hover Uploader */}
        <label className="w-14 h-14 xs:w-24 xs:h-24 sm:w-32 sm:h-32 rounded-full bg-[#d0a79e] p-1 sm:p-1.5 border-[2px] sm:border-[4px] border-[#6b4231] shadow-[0_4px_12px_rgba(41,25,10,0.25)] relative transition-[transform,shadow] hover:scale-105 duration-300 cursor-pointer overflow-hidden group flex items-center justify-center flex-shrink-0 aspect-square">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={async (e) => {
              if (e.target.files?.[0]) {
                const b64 = await fileToBase64(e.target.files[0]);
                setAvatarUrl(b64);
              }
            }} 
          />
          <div className="w-full h-full rounded-full overflow-hidden bg-white border-2 border-black border-opacity-10 flex items-center justify-center text-xs text-gray-500 relative flex-shrink-0 aspect-square" id="asset-avatar">
             {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
                <div className="flex flex-col items-center scale-75 sm:scale-100 opacity-50"><Upload className="w-4 h-4 sm:w-6 sm:h-6 mb-0.5 sm:mb-1"/> Avatar</div>
             )}
             {/* Hover Overlay */}
             <div className="absolute inset-0 bg-[#6b4231]/70 text-[#fcf8f2] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-sans text-[10px] sm:text-[11px] font-bold">
               <Upload className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1 text-white" />
               <span className="hidden xs:inline">Update</span>
             </div>
          </div>
        </label>
        
        {/* Name with Inline Edit */}
        <div className="mt-2.5 sm:mt-4 flex flex-col items-center min-h-[30px] sm:min-h-[38px] justify-center max-w-full">
          {isEditingName ? (
            <input 
              type="text"
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              onBlur={() => {
                if (tempName.trim()) setProfileName(tempName.trim());
                setIsEditingName(false);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (tempName.trim()) setProfileName(tempName.trim());
                  setIsEditingName(false);
                } else if (e.key === 'Escape') {
                  setTempName(profileName);
                  setIsEditingName(false);
                }
              }}
              className="text-center bg-white border-2 border-wood-dark px-1.5 py-0.5 font-serif text-xs sm:text-lg text-[#4d2b18] rounded-xl focus:outline-none focus:ring-1 focus:ring-wood-dark font-bold max-w-full"
              autoFocus
            />
          ) : (
            <div 
              onClick={() => { setTempName(profileName); setIsEditingName(true); }}
              className="group flex items-center justify-center gap-1 font-serif text-[11px] xs:text-base sm:text-xl font-bold text-text-brown cursor-pointer hover:bg-wood-light/40 py-0.5 px-1 xs:px-3 sm:px-3.5 rounded-full transition-all max-w-full"
              title="Click to edit profile name"
            >
              <Leaf className="w-3 h-3 sm:w-4 sm:h-4 text-green-700 fill-current drop-shadow-sm flex-shrink-0" />
              <span className="drop-shadow-sm truncate max-w-[65px] xs:max-w-[100px] sm:max-w-[140px]">{profileName}</span>
              <span className="text-pink-400 text-xs sm:text-lg flex-shrink-0">🎀</span>
            </div>
          )}
        </div>

        {/* Scroll Greeting */}
        <div className="mt-2 sm:mt-4 mb-3 sm:mb-6 scroll-banner w-full text-center py-2 sm:py-3 px-1 sm:px-2 select-none transition-transform hover:-translate-y-0.5 duration-300">
          <p className="font-serif text-[10px] xs:text-sm sm:text-lg leading-tight text-[#4d2b18]">
             welcome to my<br/>{profileName.toLowerCase()} !
          </p>
        </div>

        {/* Progress & Quick Actions */}
        <div className="w-full text-left font-sans text-text-brown px-0.5 xs:px-2">
          {/* Enhanced Progress Bar */}
          <div className="mb-4 sm:mb-6 w-full">
            <p className="mb-1.5 flex justify-between items-end select-none">
              <span className="font-semibold text-wood-dark text-[10px] xs:text-xs sm:text-sm">Progress</span> 
              <strong className="text-[11px] xs:text-sm sm:text-lg leading-none text-green-800 font-extrabold">{completedTasksCount}/{totalTasks}</strong>
            </p>
            <div className="w-full h-2.5 sm:h-3.5 bg-wood-mid/30 rounded-full overflow-hidden border border-wood-dark/20 shadow-inner relative">
              <motion.div 
                className="absolute top-0 left-0 bottom-0 bg-green-600/80 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
          
          <ul className="space-y-1.5 sm:space-y-3 w-full">
            <li onClick={() => setViewMode('Active')} className={`flex items-center justify-between cursor-pointer group transition-all p-1 sm:p-2 rounded-lg ${viewMode === 'Active' ? 'bg-[#eecda6] border border-wood-dark/20 shadow-sm font-bold' : 'hover:bg-[#eecda6]/40 border border-transparent'}`}>
              <div className="flex items-center gap-1 sm:gap-3 overflow-hidden">
                <div className={`p-1 sm:p-1.5 rounded-full border shadow-sm transition-colors ${viewMode === 'Active' ? 'bg-[#c5a17b] border-wood-dark' : 'bg-[#d8b792]/60 border-wood-dark/30'} flex-shrink-0`}>
                  <Leaf className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-wood-dark" />
                </div>
                <span className={`text-[10px] xs:text-xs sm:text-[17px] truncate ${viewMode === 'Active' ? 'text-[#3e1e10] font-extrabold' : 'text-wood-dark'}`}>Current Tasks</span>
              </div>
              {viewMode === 'Active' && <span className="text-wood-dark/60 text-[9px] sm:text-xs flex-shrink-0 ml-1">✿</span>}
            </li>
            
            <li onClick={() => setViewMode('Completed')} className={`flex items-center justify-between cursor-pointer group transition-all p-1 sm:p-2 rounded-lg ${viewMode === 'Completed' ? 'bg-[#eecda6] border border-wood-dark/20 shadow-sm font-bold' : 'hover:bg-[#eecda6]/40 border border-transparent'}`}>
              <div className="flex items-center gap-1 sm:gap-3 overflow-hidden">
                <div className={`p-1 sm:p-1.5 rounded-full border shadow-sm transition-colors ${viewMode === 'Completed' ? 'bg-[#c5a17b] border-wood-dark' : 'bg-[#d8b792]/60 border-wood-dark/30'} flex-shrink-0`}>
                  <ShoppingBasket className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-wood-dark" />
                </div>
                <span className={`text-[10px] xs:text-xs sm:text-[17px] truncate ${viewMode === 'Completed' ? 'text-[#3e1e10] font-extrabold' : 'text-wood-dark'}`}>Completed Tasks</span>
              </div>
              {viewMode === 'Completed' && <span className="text-wood-dark/60 text-[9px] sm:text-xs flex-shrink-0 ml-1">✿</span>}
            </li>

            <li onClick={onOpenTimer} className="flex items-center justify-between cursor-pointer group transition-all p-1 sm:p-2 rounded-lg hover:bg-[#eecda6]/40 border border-transparent">
              <div className="flex items-center gap-1 sm:gap-3 overflow-hidden">
                <div className="p-1 sm:p-1.5 bg-[#8c5737] rounded-full border border-wood-dark shadow-sm flex-shrink-0">
                  <Timer className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-[10px] xs:text-xs sm:text-[17px] text-wood-dark font-medium truncate">
                  Focus {isActive ? `(${Math.floor(timeLeft / 60)})` : '✿'}
                </span>
              </div>
            </li>

            <li onClick={onOpenSettings} className="flex items-center justify-between cursor-pointer group transition-all p-1 sm:p-2 rounded-lg hover:bg-[#eecda6]/40 border border-transparent">
              <div className="flex items-center gap-1 sm:gap-3 overflow-hidden">
                <div className="p-1 sm:p-1.5 bg-[#d8b792] rounded-full border border-wood-dark shadow-sm flex-shrink-0">
                  <Settings className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-wood-dark" />
                </div>
                <span className="text-[10px] xs:text-xs sm:text-[17px] text-wood-dark font-medium truncate">Settings</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Right Area: Tasks */}
      <div className="flex-1 pt-0 pl-3 xs:pl-4 sm:pl-8 flex flex-col relative z-10 overflow-hidden">
        
        {/* Filters */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-4 mb-4 sm:mb-6">
          {["Today", "This week", "Tomorrow", "This month"].map(f => (
            <button 
              key={f} 
              onClick={() => { setDateFilter(f); setViewMode('Active'); setShowNewTaskForm(false); }}
              className={`py-1 sm:py-1.5 px-1.5 sm:px-4 border-[1.5px] sm:border-2 border-dashed rounded-full text-[10px] xs:text-xs sm:text-[17px] font-sans font-bold transition-all ${
                dateFilter === f 
                  ? 'bg-[#7e563e] border-[#5e3c27] text-[#fdf9f1] shadow-inner scale-95' 
                  : 'bg-[#fdfaf4] border-[#6e402a]/45 text-[#4d2b18] hover:bg-[#eadecc]/30 hover:border-[#6e402a]/70 hover:text-[#381d0f] shadow-sm'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mb-6">
          <DecorativeFlourish>{viewMode === 'Active' ? `${dateFilter}'s Tasks` : `Completed in ${dateFilter}`}</DecorativeFlourish>
          
          {viewMode === 'Completed' && displayedTasks.length > 0 && (
            <button 
              onClick={clearCompletedTasks}
              className="text-xs font-bold font-sans text-red-500 hover:text-white border border-red-200 hover:bg-red-500 hover:border-red-500 px-3 py-1 rounded-full transition-colors"
            >
              Clear All Completed
            </button>
          )}
        </div>
        
        {/* Add Task Area (Moved to Top) */}
        {viewMode === 'Active' && (
          <div className="mb-6 overflow-hidden">
             {showNewTaskForm ? (
               <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#fdfaf3] p-3 xs:p-4 rounded-xl border-2 border-wood-dark/20 flex flex-col gap-2.5 xs:gap-3 shadow-sm relative text-text-brown">
                 <div className="absolute top-0 right-0 w-8 h-8 bg-wood-dark/10 rounded-bl-xl pointer-events-none" />
                 <input 
                   autoFocus
                   placeholder={`Write a task for ${dateFilter}...`}
                   value={newTaskText}
                   onChange={e => setNewTaskText(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && addTask()}
                   className="w-full bg-transparent border-b-2 border-wood-dark/10 px-1 py-1.5 xs:py-2 font-serif text-sm xs:text-base sm:text-lg text-wood-dark focus:outline-none focus:border-wood-dark/30"
                 />
                 <div className="flex justify-between items-center mt-2 flex-wrap gap-1.5 xs:gap-2">
                    <div className="flex items-center gap-2 xs:gap-4 flex-wrap">
                      <label className="flex items-center gap-1 cursor-pointer text-[#4d2b18] text-[10px] xs:text-xs sm:text-sm font-sans font-bold select-none">
                        <input type="checkbox" checked={newTaskIsDaily} onChange={e => setNewTaskIsDaily(e.target.checked)} className="rounded text-[#4d2b18] focus:ring-wood-dark bg-white border-wood-dark/40" />
                        Daily Task
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer text-red-600 text-[10px] xs:text-xs sm:text-sm font-sans font-bold select-none">
                        <input type="checkbox" checked={newTaskIsImportant} onChange={e => setNewTaskIsImportant(e.target.checked)} className="rounded text-red-500 focus:ring-red-500 bg-white border-red-200" />
                        Important
                      </label>
                    </div>
                    <div className="flex gap-1.5 ml-auto">
                      <button onClick={() => setShowNewTaskForm(false)} className="px-2 xs:px-4 py-1 xs:py-1.5 text-[10px] xs:text-xs sm:text-sm font-bold text-[#8c5737] hover:bg-wood-mid/20 rounded-full transition-colors">Cancel</button>
                      <button onClick={addTask} className="px-2.5 xs:px-4 py-1.5 text-[10px] xs:text-xs sm:text-sm font-bold bg-[#8c5737] text-white rounded-full hover:bg-wood-shadow hover:-translate-y-0.5 transition-all shadow-sm whitespace-nowrap">Save Task</button>
                    </div>
                 </div>
               </motion.div>
             ) : (
               <button 
                 onClick={() => setShowNewTaskForm(true)}
                 className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-[#d8b792] rounded-xl text-[#8c5737] font-sans font-bold hover:bg-[#fdfaf3] hover:border-[#8c5737] hover:text-[#61361c] transition-all group shadow-sm bg-white"
               >
                 <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                 Add New Task
               </button>
             )}
          </div>
        )}
        
        <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12 pr-4 flex-1 items-start content-start overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {displayedTasks.length === 0 && viewMode === 'Completed' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="col-span-full text-center font-sans text-wood-dark/50 italic py-8 border-2 border-dashed border-wood-dark/10 rounded-xl">
                No completed tasks yet! 🍃
              </motion.div>
            )}
            
            {displayedTasks.map(task => {
              const isDone = task.completed || task.completing;
              const isJustFinished = task.completing;
              const isEditing = editingTaskId === task.id;
              const rotation = ((task.id * 17) % 5) - 2; // -2, -1, 0, 1, or 2 degrees
              const stickyShadow = '4px 8px 16px rgba(97,54,28,0.14), -1px 2px 4px rgba(97,54,28,0.06)';

              return (
                <motion.li 
                  layout
                  key={task.id} 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: task.completed ? 0.8 : 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -20, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3 }}
                  style={{ 
                    transform: `rotate(${rotation}deg)`,
                    boxShadow: stickyShadow
                  }}
                  className={`mt-3 relative p-4 flex flex-col group/item transition-all ${
                     task.important 
                        ? 'bg-[#fff5f5] border-[#fecaca]' 
                        : 'bg-[#fffdf0] border-[#fdf0a6]'
                  } border rounded-xl hover:scale-[1.01] duration-200`}
                >
                  {/* Pin or Tape decoration */}
                  {task.important && (
                     <div className="absolute -top-1 -right-2 flex gap-1 items-center bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm transform rotate-3 z-10">
                        <span className="animate-pulse">!</span>
                        IMPORTANT
                     </div>
                  )}

                  <div className="flex-1 flex flex-col pt-1">
                    <div className="flex justify-between items-start gap-3 relative pb-2 min-h-[60px]">
                      <div className="flex-1">
                        {isEditing ? (
                          <div className="flex flex-col gap-2 relative z-20">
                            <textarea 
                              autoFocus
                              value={editTaskText}
                              onChange={e => setEditTaskText(e.target.value)}
                              onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(task.id); } }}
                              className="w-full bg-transparent border-b-2 border-wood-dark/20 resize-none font-serif text-[17px] text-text-brown leading-snug focus:outline-none focus:border-wood-dark/40 placeholder-wood-dark/30"
                              rows={2}
                            />
                            <button onClick={() => saveEdit(task.id)} className="self-end bg-green-700/10 text-green-800 border border-green-700/20 px-3 py-1 text-xs font-bold rounded-md hover:bg-green-700/20 transition-colors shadow-sm">
                              Save
                            </button>
                          </div>
                        ) : (
                          <span 
                            className={`font-serif text-[17px] leading-relaxed cursor-pointer block break-words ${isDone ? 'opacity-50 text-wood-dark line-through decoration-wood-dark/40' : 'text-text-brown'}`}
                            onClick={() => toggleTask(task.id)}
                          >
                            {task.text}
                          </span>
                        )}
                      </div>
                      
                      {/* Completion Checkbox */}
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-all border-2 relative z-20 mt-1 cursor-pointer ${
                          isDone ? 'bg-green-600 border-green-600 text-white shadow-inner' : 'bg-white/50 border-wood-dark/20 text-transparent hover:bg-white hover:border-wood-dark/40 shadow-sm'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        {isJustFinished && (
                          <motion.div 
                            key="sparkle"
                            initial={{ opacity: 1, scale: 0.5 }} 
                            animate={{ opacity: 0, scale: 2 }} 
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 flex items-center justify-center text-xl drop-shadow-sm pointer-events-none"
                          >✨</motion.div>
                        )}
                      </button>
                    </div>

                    <div className="flex justify-between items-end mt-auto pt-3 border-t border-wood-dark/5">
                       {/* Left Side: status badges */}
                       <div className="flex gap-1 flex-wrap">
                          {task.isDaily && <span className="text-[10px] bg-wood-dark/5 border border-wood-dark/10 text-wood-dark/70 px-1.5 py-0.5 rounded font-sans font-bold uppercase tracking-wider">Daily</span>}
                       </div>
                       
                       {/* Dropdown Action menu */}
                       {!isDone && (
                         <div className="relative z-20 shrink-0 ml-2">
                           <button 
                             onClick={(e) => { e.stopPropagation(); setOpenTaskMenuId(openTaskMenuId === task.id ? null : task.id); }}
                             className="p-1 bg-white border border-[#eadac5] hover:bg-[#ebdcd0] text-[#8c5737] rounded-lg transition-colors shadow-sm cursor-pointer flex items-center justify-center"
                             title="Options"
                           >
                             <MoreHorizontal className="w-3.5 h-3.5" />
                           </button>
                           
                           <AnimatePresence>
                             {openTaskMenuId === task.id && (
                               <>
                                 <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenTaskMenuId(null); }} />
                                 <motion.div 
                                   initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                   animate={{ opacity: 1, scale: 1, y: 0 }}
                                   exit={{ opacity: 0, scale: 0.9, y: 5 }}
                                   className="absolute right-0 bottom-8 bg-[#fdfdf7] border border-[#d8b792] rounded-lg shadow-md py-1.5 w-24 flex flex-col z-50 overflow-hidden font-sans text-xs"
                                 >
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); setEditingTaskId(task.id); setEditTaskText(task.text); setOpenTaskMenuId(null); }} 
                                     className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#eecda6]/20 w-full text-left font-semibold text-[#4d2b18]"
                                   >
                                     <Edit2 className="w-3 h-3 text-[#c5a17b]" />
                                     <span>Edit</span>
                                   </button>
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); confirmRemoveTask(task.id); setOpenTaskMenuId(null); }} 
                                     className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-50 w-full text-left font-semibold text-red-600"
                                   >
                                     <Trash2 className="w-3 h-3 text-red-400" />
                                     <span>Delete</span>
                                   </button>
                                 </motion.div>
                               </>
                             )}
                           </AnimatePresence>
                         </div>
                       )}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>

      {/* Rollover Modal */}
      <AnimatePresence>
        {showRollover && rolloverTasks.length > 0 && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-wood-dark/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#fcf8f2] border-2 border-[#d8b792] p-6 rounded-2xl shadow-xl w-full max-w-lg relative z-10 flex flex-col max-h-[80vh]"
            >
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 bg-orange-100 text-[#8c5737] rounded-full flex items-center justify-center mb-4 border border-[#d8b792]">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-2xl text-wood-dark font-bold mb-1">Past Tasks Await!</h3>
                <p className="text-wood-dark/80 font-sans text-sm">You have some incomplete tasks from a previous day. How would you like to handle them?</p>
              </div>
              
              <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 mb-4">
                 <div className="flex flex-col gap-3">
                   {rolloverTasks.map(task => (
                      <div key={task.id} className="bg-white border border-wood-dark/20 rounded-xl p-4 flex justify-between items-center gap-4 shadow-sm">
                         <span className="font-serif text-lg text-text-brown flex-1 truncate">{task.text}</span>
                         <div className="flex gap-2 shrink-0">
                           <button 
                             onClick={() => handleRolloverDecision(task.id, 'delete')}
                             className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors flex items-center gap-1 group"
                             title="Delete"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleRolloverDecision(task.id, 'keep')}
                             className="bg-green-600/90 hover:bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                           >
                             <Check className="w-3.5 h-3.5" /> Move to Today
                           </button>
                         </div>
                      </div>
                   ))}
                 </div>
              </div>
              
              <div className="flex gap-3 justify-center pt-4 border-t border-wood-dark/10">
                <button 
                  onClick={() => setShowRollover(false)}
                  className="px-6 py-2.5 rounded-full font-sans font-bold text-wood-dark/70 bg-wood-mid/20 hover:bg-wood-mid/40 transition-colors w-full"
                >
                  Decide Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {taskToDelete !== null && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setTaskToDelete(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#fcf8f2] border-2 border-[#d8b792] p-6 rounded-2xl shadow-xl max-w-[320px] w-full text-center relative z-10"
            >
              <div className="mx-auto w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4 drop-shadow-sm">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl text-wood-dark font-bold mb-2">Delete Task?</h3>
              <p className="text-wood-dark/80 font-sans text-sm mb-6">Are you sure you want to permanently remove this task? This action cannot be undone.</p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setTaskToDelete(null)}
                  className="px-5 py-2.5 rounded-full font-sans font-bold text-wood-dark text-sm hover:bg-wood-mid/30 transition-colors w-full"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeRemoveTask}
                  className="px-5 py-2.5 rounded-full font-sans font-bold text-sm bg-red-500 text-white hover:bg-red-600 shadow-sm transition-colors w-full"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CharactersDressUpView({ characterBaseUrl, setCharacterBaseUrl, onDone }: any) {
  const [sceneClothes, setSceneClothes] = useState<any[]>([]);
  const captureRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const { assets: globalClothes } = useGlobalAssets('clothing');
  const { assets: globalCharacters } = useGlobalAssets('character');

  const selectedBase = globalCharacters.find(c => c.url === characterBaseUrl);

  const matchedClothes = selectedBase 
    ? globalClothes.filter(c => c.characterId === selectedBase.id)
    : [];

  const handleToggleClothes = (clothing: any) => {
     setSceneClothes(prev => {
        if (prev.find(p => p.id === clothing.id)) {
           return prev.filter(p => p.id !== clothing.id);
        } else {
           return [...prev, clothing];
        }
     });
  };

  const handleDone = async () => {
     if (!captureRef.current || !characterBaseUrl) return;
     setIsCapturing(true);
     try {
       await new Promise(r => setTimeout(r, 100)); // allow render to settle
       const dataUrl = await (htmlToImage.toPng as any)(captureRef.current, {
         skipFonts: true,
         backgroundColor: 'rgba(0,0,0,0)',
          styleSheetsFilter: (sheet) => {
            try {
              if (sheet.href && !sheet.href.startsWith(window.location.origin)) {
                return false;
              }
              const rules = sheet.cssRules;
              return !!rules;
            } catch {
              return false;
            }
          },
         fontEmbedCSS: '',
         style: {
           transform: 'scale(1)', // Ensuring the snapshot works properly
           transformOrigin: 'top left'
         }
       });
       onDone(dataUrl);
     } catch (err) {
       console.error("Failed to capture scene:", err);
     } finally {
       setIsCapturing(false);
     }
  };

  if (!characterBaseUrl) {
    return (
      <div className="flex flex-col items-center min-h-[500px] justify-center text-center">
         <DecorativeFlourish>Dress Up Character</DecorativeFlourish>
         <p className="mb-6 max-w-sm text-wood-dark/80">Choose a character to start dressing up!</p>
         
         <div className="flex gap-4 justify-center flex-wrap max-w-2xl px-4">
            {globalCharacters.map(c => (
               <button 
                  key={c.id} 
                  onClick={() => setCharacterBaseUrl(c.url)} 
                  className="w-32 h-32 border-4 border-[#d8b792] bg-white rounded-xl hover:scale-105 hover:border-[#8c5737] transition-all overflow-hidden p-2 shadow-sm"
               >
                 <img src={c.url} alt="Character" className="w-full h-full object-contain pointer-events-none" />
               </button>
            ))}
            {globalCharacters.length === 0 && (
               <p className="italic text-wood-dark/50 p-4 border-2 border-dashed border-wood-dark/20 rounded-xl">No characters available yet. Admins must upload them first.</p>
            )}
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-[500px]">
      <DecorativeFlourish>Dress Up</DecorativeFlourish>
      
      <div className="flex justify-between w-full max-w-4xl mb-4 px-4 items-center">
         <button onClick={() => { setCharacterBaseUrl(''); setSceneClothes([]); }} className="text-[#8c5737] font-bold font-sans hover:underline flex items-center gap-1">
           <RotateCcw className="w-4 h-4" /> Change Character
         </button>
         <p className="italic text-wood-dark/70 text-sm">Click wardrobe items to toggle them on/off!</p>
      </div>
      
      <div className="flex w-full max-w-4xl gap-2 xs:gap-4 md:gap-8 flex-row px-1 xs:px-2 md:px-4">
        {/* Clothing Items Catalog (Left) */}
        <div className="w-[36%] xs:w-[34%] sm:w-64 bg-wood-light/40 border border-wood-dark/20 rounded-lg p-1.5 xs:p-3 sm:p-4 custom-scrollbar overflow-y-auto z-10 flex flex-col max-h-[380px] xs:max-h-[440px] sm:max-h-[500px]">
           <h4 className="border-b border-wood-dark/20 pb-1 xs:pb-2 mb-2 sm:mb-4 text-center text-xs xs:text-sm sm:text-base font-bold text-wood-dark">Wardrobe</h4>
           
           <div className="grid grid-cols-2 gap-1 xs:gap-3 flex-1 content-start">
              {matchedClothes.map((clothing: any) => {
                const isSelected = sceneClothes.find(s => s.id === clothing.id);
                return (
                  <button 
                    key={clothing.id}
                    onClick={() => handleToggleClothes(clothing)}
                    className={`relative aspect-square bg-paper border border-wood-dark/10 rounded-md flex justify-center items-center cursor-pointer hover:bg-white/90 hover:scale-105 shadow-sm transform transition-all overflow-hidden p-0.5 xs:p-1 ${isSelected ? 'ring-2 ring-[#5c8b51] bg-[#eef5ed]' : ''}`}
                  >
                    <img src={clothing.url} alt={`Clothing`} className="w-full h-full object-contain drop-shadow-md pointer-events-none" />
                    {isSelected && <div className="absolute top-0.5 right-0.5 xs:top-1 xs:right-1 bg-[#5c8b51] rounded-full p-0.25 xs:p-0.5"><Check className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-white" /></div>}
                  </button>
                )
              })}
              {matchedClothes.length === 0 && (
                <div className="col-span-2 aspect-[2/1] bg-white/30 border border-dashed border-wood-dark/20 rounded-md flex justify-center items-center text-[10px] xs:text-xs text-center text-wood-dark/60 p-2xs xs:p-4">
                   No outfits found.
                </div>
              )}
           </div>
           
           <button 
             onClick={handleDone}
             disabled={isCapturing}
             className="mt-3 xs:mt-6 w-full py-2 xs:py-3 bg-[#5c8b51] text-white rounded-xl border-b-[4px] border-[#3b5e33] font-sans text-xs xs:text-sm sm:text-base font-bold flex items-center justify-center hover:bg-[#4d7543] active:translate-y-[2px] active:border-b-[2px] active:mb-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm leading-tight px-1 xs:px-2"
           >
              {isCapturing ? 'Saving...' : <div className="flex items-center gap-1 xs:gap-2"><Check className="w-4 h-4 xs:w-5 xs:h-5 flex-shrink-0" /> <span className="text-[10px] xs:text-xs sm:text-base">Done & Spawn</span></div>}
           </button>
        </div>

        {/* Character Base (Right/Center) */}
        <div className="flex-1 bg-paper-shade border-2 border-dashed border-wood-dark/30 rounded-lg flex relative items-center justify-center min-h-[350px] xs:min-h-[440px] sm:min-h-[500px] overflow-hidden p-1 xs:p-2">
            {/* 
                CRITICAL FIX FOR CAPTURE && FITTING: 
                The capture container must exactly match the sizing used in the admin tool (w-[300px] h-[400px]) 
                so coordinates transfer perfectly 1:1.
                We scale the container visually to fit on mobile using scale/transform.
            */}
            <div className="scale-[0.58] xs:scale-[0.78] sm:scale-100 transition-transform origin-center flex items-center justify-center w-[300px] h-[400px] flex-shrink-0">
               <div ref={captureRef} className="relative w-[300px] h-[400px] flex-shrink-0 overflow-visible">
                 <img 
                   src={characterBaseUrl} 
                   className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
                 />
                 
                 {sceneClothes.map(c => {
                    const isFullFit = c.useFullCanvasFit || c.id?.startsWith('default_') || (c.x === 0 && c.y === 0 && c.width === 300) || c.x === undefined;
                    return (
                      <img
                        key={c.id}
                        src={c.url}
                        style={isFullFit ? {
                           position: 'absolute',
                           inset: 0,
                           width: '100%',
                           height: '100%',
                           objectFit: 'contain',
                           pointerEvents: 'none'
                        } : {
                           position: 'absolute',
                           left: `${c.x}px`,
                           top: `${c.y}px`,
                           width: `${c.width}px`,
                           pointerEvents: 'none'
                        }}
                        className="drop-shadow-md"
                      />
                    );
                 })}
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function DecorationsMenu({ onAdd }: any) {
  const { assets: globalDecals } = useGlobalAssets('decal');
  const [selectedCat, setSelectedCat] = useState('All');
  
  const categories = ['All', ...Array.from(new Set(globalDecals.map((d: any) => d.category || 'Uncategorized')))];
  
  const displayedDecals = selectedCat === 'All' 
    ? globalDecals 
    : globalDecals.filter((d: any) => (d.category || 'Uncategorized') === selectedCat);

  return (
    <div 
      className="bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-[#8c5737]/25 shadow-xl p-5 sm:p-7 md:p-9 flex flex-col gap-6 w-full text-left relative overflow-hidden"
      style={{ boxShadow: '0 10px 25px -5px rgba(100,50,20,0.08), inset 0 0 24px rgba(230,218,199,0.25)' }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#8c5737]/5 rounded-bl-full pointer-events-none" />
      
      <div className="flex flex-col items-center mb-2">
        <DecorativeFlourish>Sticker Album</DecorativeFlourish>
        <p className="text-center font-sans text-sm text-[#593922]/80 mt-1 max-w-md">
          Peel off cute stickers to customize your desk workspace! Click any item to spawn it, then drag it freely.
        </p>
      </div>
      
      {categories.length > 1 ? (
        <div className="flex flex-wrap justify-center gap-2 mb-2 w-full pb-2 border-b border-wood-dark/10">
          {categories.map(cat => (
            <button
              key={cat as string}
              onClick={() => setSelectedCat(cat as string)}
              className={`px-4 py-1.5 rounded-full font-sans font-bold text-xs sm:text-sm whitespace-nowrap transition-all shadow-sm ${selectedCat === cat ? 'bg-[#8c5737] text-white scale-105' : 'bg-[#e8dcc4]/60 text-[#61361c] hover:bg-[#ebd3b2] hover:text-[#4d2b18]'}`}
            >
              {cat as string}
            </button>
          ))}
        </div>
      ) : null}
      
      {globalDecals.length === 0 ? (
         <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70 italic text-wood-dark py-16 px-4 border-2 border-dashed border-wood-dark/20 rounded-2xl bg-wood-mid/5">
           <p className="font-serif text-lg mb-1">Sticker pages are currently empty</p>
           <p className="text-xs font-sans max-w-xs">Ask an administrator to load adorable stickers and ornaments into the app database!</p>
         </div>
      ) : (
        <div className="bg-[#faf6ed]/70 border border-dashed border-[#d8b792] p-4 sm:p-6 rounded-2xl">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 sm:gap-6 w-full">
            {displayedDecals.map((decal: any, i: number) => (
              <motion.div 
                key={i} 
                whileHover={{ scale: 1.08, rotate: [0, -1.5, 1.5, 0] }}
                whileTap={{ scale: 0.95 }}
                className="relative group aspect-square bg-[#fffefc] border-2 border-dashed border-[#8c5737]/20 rounded-2xl flex items-center justify-center hover:bg-white hover:border-[#8c5737]/45 transition-colors shadow-sm transform cursor-pointer overflow-hidden p-2.5"
                onClick={() => onAdd(decal.url)}
              >
                <div className="absolute inset-0 bg-[#fdfbf6]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <button 
                  className="w-full h-full overflow-hidden flex justify-center items-center focus:outline-none"
                  aria-label={`Spawn sticker ${i}`}
                >
                   <img src={decal.url} alt={`Sticker ${i}`} className="max-w-full max-h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.06)] pointer-events-none transition-transform" />
                </button>
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#8e4424]/80 text-[8px] text-white px-1.5 py-0.5 rounded-full font-bold font-sans">
                  Peel
                </div>
              </motion.div>
            ))}
            {displayedDecals.length === 0 && (
               <div className="col-span-full py-16 text-center opacity-60 italic font-sans text-wood-dark w-full">No stickers found in this category.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminDashboard() {
  const [selectedType, setSelectedType] = useState<'character' | 'clothing' | 'decal'>('character');
  const { assets: characters, addGlobalAsset: addCharacter, removeGlobalAsset: removeCharacter } = useGlobalAssets('character');
  const { assets: clothings, addGlobalAsset: addClothing, removeGlobalAsset: removeClothing } = useGlobalAssets('clothing');
  const { assets: decals, addGlobalAsset: addDecal, removeGlobalAsset: removeDecal } = useGlobalAssets('decal');

  const assets = selectedType === 'character' ? characters : selectedType === 'clothing' ? clothings : decals;
  const removeAsset = selectedType === 'character' ? removeCharacter : selectedType === 'clothing' ? removeClothing : removeDecal;

  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);

  const [fittingImage, setFittingImage] = useState<string | null>(null);
  const [fittingConfig, setFittingConfig] = useState({ x: 0, y: 0, width: 300 });
  const [useFullCanvasFit, setUseFullCanvasFit] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [newCategoryName, setNewCategoryName] = useState('Plants');
  const [adminError, setAdminError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const b64 = await fileToBase64(e.target.files[0]);
      if (selectedType === 'clothing') {
        if (!selectedCharacterId) {
           setAdminError("Please select a character base below first to fit the clothing onto!")
           return;
        }
        setFittingImage(b64);
        setFittingConfig({ x: 0, y: 0, width: 300 });
        setUseFullCanvasFit(false);
      } else if (selectedType === 'character') {
        await addCharacter(b64);
      } else {
        await addDecal(b64, { category: newCategoryName }); // Sticker
      }
    }
    // reset input
    if (e.target) e.target.value = '';
  };

  const handleSaveFitting = async () => {
    if (fittingImage && selectedCharacterId) {
      await addClothing(fittingImage, {
        characterId: selectedCharacterId,
        x: fittingConfig.x,
        y: fittingConfig.y,
        width: fittingConfig.width,
        useFullCanvasFit
      });
      setFittingImage(null);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-paper stitch-border rounded-xl max-w-4xl mx-auto w-full overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="font-script text-3xl text-wood-dark">Admin Dashboard</h2>
      </div>

      {adminError && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-red-100 text-red-800 font-sans text-sm font-bold p-3.5 rounded-xl border border-red-200 flex justify-between items-center shadow-sm shrink-0"
        >
          <span className="flex-1">{adminError}</span>
          <button onClick={() => setAdminError(null)} className="text-red-800 hover:text-red-950 font-bold font-sans text-lg ml-3 bg-red-200/50 hover:bg-red-200 w-6 h-6 rounded-full flex items-center justify-center transition-colors">✕</button>
        </motion.div>
      )}
      
      <p className="text-sm font-sans mb-4 text-[#61361c] shrink-0">
        Welcome Admin! You can upload global characters, tailored clothing, and stickers. Users won't need to upload anything themselves. ("Decals" means stickers).
      </p>

      <div className="flex gap-4 mb-6 shrink-0">
        {(['character', 'clothing', 'decal'] as const).map(type => (
          <button
            key={type}
            onClick={() => {
              setSelectedType(type);
              setFittingImage(null);
            }}
            className={`px-4 py-2 rounded-lg font-sans font-bold capitalize transition-colors ${selectedType === type ? 'bg-[#8c5737] text-white' : 'bg-[#e8dcc4] text-[#61361c] hover:bg-[#d8b792]'}`}
          >
            {type === 'decal' ? 'Stickers' : type + 's'}
          </button>
        ))}
      </div>

      {selectedType === 'clothing' && !fittingImage && (
        <div className="mb-6 shrink-0">
          <h3 className="font-bold text-wood-dark mb-2 font-sans">1. Select a Character Base to fit clothing onto:</h3>
          <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
            {characters.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCharacterId(c.id)}
                className={`flex-shrink-0 w-24 h-24 border-4 rounded-xl overflow-hidden p-1 transition-all ${selectedCharacterId === c.id ? 'border-green-500 bg-green-50 shadow-md scale-105' : 'border-[#d8b792] bg-white hover:scale-105'}`}
              >
                <img src={c.url} alt="" className="w-full h-full object-contain pointer-events-none" />
              </button>
            ))}
            {characters.length === 0 && <span className="text-sm text-gray-500 italic mt-2">Upload a character first!</span>}
          </div>
        </div>
      )}

      {fittingImage && selectedCharacter ? (
        <div className="mb-6 flex flex-col items-center bg-wood-mid/10 p-6 rounded-xl border-2 border-dashed border-wood-dark/20 shrink-0">
          <h3 className="font-bold font-sans text-wood-dark mb-2">2. Adjust Clothing Fit</h3>
          <p className="text-xs text-wood-dark/70 mb-4 text-center max-w-sm">If your clothing image is the same size as your character base (e.g., drawn on the same canvas), simply click "Save as Full Canvas Fit".</p>
          
          <label className="flex items-center gap-2 mb-4 bg-white px-3 py-1.5 rounded shadow-sm border border-wood-dark/20 cursor-pointer">
            <input type="checkbox" checked={useFullCanvasFit} onChange={e => {
               setUseFullCanvasFit(e.target.checked);
               if (e.target.checked) setFittingConfig({ x: 0, y: 0, width: 300 });
            }} className="text-[#8c5737] focus:ring-[#8c5737]" />
            <span className="font-sans text-sm font-bold text-wood-dark">Auto-Fit (Matches Character Size)</span>
          </label>

          <div 
            ref={containerRef}
            className={`relative w-[300px] h-[400px] bg-white rounded-xl shadow-inner overflow-hidden border-2 mb-4 select-none ${useFullCanvasFit ? 'border-[#8c5737]' : 'border-wood-dark/20'}`}
          >
            <img src={selectedCharacter.url} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
            
            {useFullCanvasFit ? (
               <img src={fittingImage} className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-md" />
            ) : (
               <div
                 className="absolute cursor-move touch-none"
                 style={{ left: `${fittingConfig.x}px`, top: `${fittingConfig.y}px` }}
                 onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const target = e.currentTarget as HTMLElement;
                    target.setPointerCapture(e.pointerId);
                    
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startLeft = fittingConfig.x;
                    const startTop = fittingConfig.y;
                    
                    const handleMove = (moveEvent: PointerEvent) => {
                      setFittingConfig(prev => ({ 
                        ...prev, 
                        x: startLeft + (moveEvent.clientX - startX),
                        y: startTop + (moveEvent.clientY - startY)
                      }));
                    };
                    const handleUp = (upEvent: PointerEvent) => {
                      target.releasePointerCapture(upEvent.pointerId);
                      target.removeEventListener('pointermove', handleMove);
                      target.removeEventListener('pointerup', handleUp);
                      target.removeEventListener('pointercancel', handleUp);
                    };
                    target.addEventListener('pointermove', handleMove);
                    target.addEventListener('pointerup', handleUp);
                    target.addEventListener('pointercancel', handleUp);
                 }}
               >
                 <div className="relative group">
                   <img src={fittingImage} style={{ width: `${fittingConfig.width}px` }} draggable={false} className="drop-shadow-md pointer-events-none" />
                   
                   {/* Resizer Handle */}
                   <div 
                     className="absolute bottom-0 right-0 w-8 h-8 bg-[#8c5737] border-[3px] border-white rounded-full translate-x-1/2 translate-y-1/2 cursor-nwse-resize opacity-80 hover:opacity-100 transition-opacity shadow-lg touch-none"
                     onPointerDown={(e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       const target = e.currentTarget as HTMLElement;
                       target.setPointerCapture(e.pointerId);

                       const startX = e.clientX;
                       const startWidth = fittingConfig.width;
                       
                       const handleMove = (moveEvent: PointerEvent) => {
                         const deltaX = moveEvent.clientX - startX;
                         setFittingConfig(prev => ({ ...prev, width: Math.max(20, startWidth + deltaX) }));
                       };
                       const handleUp = (upEvent: PointerEvent) => {
                         target.releasePointerCapture(upEvent.pointerId);
                         target.removeEventListener('pointermove', handleMove);
                         target.removeEventListener('pointerup', handleUp);
                         target.removeEventListener('pointercancel', handleUp);
                       };
                       target.addEventListener('pointermove', handleMove);
                       target.addEventListener('pointerup', handleUp);
                       target.addEventListener('pointercancel', handleUp);
                     }}
                   />
                 </div>
               </div>
            )}
          </div>

          <div className="flex gap-4">
            <button onClick={() => setFittingImage(null)} className="px-6 py-2 rounded-full font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">Cancel</button>
            <button onClick={handleSaveFitting} className="px-6 py-2 rounded-full font-bold text-white bg-green-500 hover:bg-green-600 transition-colors shadow-md">Save Clothing Config</button>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex justify-center shrink-0">
          <label className={`cursor-pointer border-dashed border-2 border-[#d8b792] rounded-xl p-8 flex flex-col items-center justify-center text-[#8c5737] hover:bg-[#fcf8f2] transition-colors w-full max-w-sm ${selectedType === 'clothing' && !selectedCharacterId ? 'opacity-50 pointer-events-none' : ''}`}>
            <Upload className="w-8 h-8 mb-2" />
            <span className="font-sans font-bold">1. Upload new {selectedType === 'decal' ? 'sticker' : selectedType}</span>
            {selectedType === 'clothing' && <span className="text-xs mt-1 text-center font-sans opacity-80">(Requires Character selected)</span>}
            {selectedType === 'decal' && (
               <div className="mt-4 flex flex-col items-center" onClick={(e) => e.preventDefault()}>
                 <span className="text-xs font-bold text-wood-dark mb-1">Sticker Category:</span>
                 <input 
                   type="text" 
                   value={newCategoryName} 
                   onChange={(e) => setNewCategoryName(e.target.value)} 
                   placeholder="e.g. Plants" 
                   className="px-3 py-1 rounded text-sm text-wood-dark border border-wood-dark/20 text-center bg-white shadow-sm w-3/4"
                 />
                 <span className="text-[10px] opacity-70 mt-1">Set this BEFORE selecting file!</span>
               </div>
            )}
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-[300px] border-2 border-wood-dark/10 p-4 rounded-xl bg-white shadow-inner">
        <h3 className="font-bold text-wood-dark mb-4 font-sans border-b border-wood-dark/10 pb-2">Uploaded {selectedType === 'decal' ? 'Stickers' : selectedType + 's'}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <AnimatePresence>
            {assets.map(asset => (
              <motion.div key={asset.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative aspect-square border-2 border-[#d8b792] rounded-xl overflow-hidden bg-[#faf7f2] group flex items-center justify-center">
                <img src={asset.url} alt="" className="object-contain w-4/5 h-4/5 pointer-events-none" />
                <button
                  onClick={() => removeAsset(asset.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {assets.length === 0 && (
            <div className="col-span-full h-full flex items-center justify-center text-gray-400 font-sans italic py-10">
              No global {selectedType === 'decal' ? 'stickers' : selectedType + 's'} uploaded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsModal({ onClose, customBgUrl, setCustomBgUrl, signBgUrl, setSignBgUrl, boardBgUrl, setBoardBgUrl, fontMode, setFontMode, avatarUrl, setAvatarUrl }: any) {
  const isAdmin = useIsAdmin();
  const [copied, setCopied] = useState(false);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        className="relative bg-paper stitch-border p-5 md:p-8 rounded-2xl w-full max-w-[550px] max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl border-4 border-wood-dark"
      >
        <div className="flex justify-between items-center mb-6 border-b-2 border-wood-dark/10 pb-4">
           <h2 className="font-script text-3xl text-wood-dark">App Settings & Setup</h2>
           <button onClick={onClose} className="p-2 hover:bg-wood-dark/10 rounded-full text-wood-dark transition-colors">
             <span className="font-sans font-bold text-xl leading-none">✕</span>
           </button>
        </div>

        <div className="space-y-6">
          {/* Account Section */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-text-brown mb-2">Account Actions</h3>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => auth.signOut()}
                className="w-full bg-red-50 text-red-600 font-bold font-sans py-3 rounded-lg border-2 border-red-200 hover:bg-red-100 transition-colors shadow-sm"
              >
                Log Out
              </button>
            </div>
            
            {isAdmin ? (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-bold text-green-900 text-sm mb-1">Admin Mode Active</h4>
                <p className="text-green-800 text-xs mb-2">
                  You are logged in as an administrator. The Admin Tab is now available at the top of your screen to upload assets.
                </p>
                <div className="bg-white border border-green-100 p-2 rounded flex items-center justify-between shadow-sm">
                  <div className="flex flex-col text-[10px] text-gray-500 truncate mr-2">
                    <span className="font-semibold">User ID:</span>
                    <span className="font-mono">{auth.currentUser?.uid}</span>
                  </div>
                  <button onClick={() => {
                    if (auth.currentUser?.uid) {
                      navigator.clipboard.writeText(auth.currentUser.uid);
                      setCopied(true); setTimeout(() => setCopied(false), 2000);
                    }
                  }} className="text-xs text-green-700 hover:underline shrink-0 font-medium">{copied ? "Copied! ✓" : "Copy ID"}</button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-center justify-between text-xs text-text-brown/50 bg-[#e8d0b3]/10 p-2.5 rounded-lg border border-wood-dark/10">
                <span>Account ID: <code className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-wood-dark/5">{auth.currentUser?.uid || "Not logged in"}</code></span>
                <button 
                  onClick={() => {
                    if (auth.currentUser?.uid) {
                      navigator.clipboard.writeText(auth.currentUser.uid);
                      setCopied(true); setTimeout(() => setCopied(false), 2000);
                    }
                  }} 
                  className="text-wood-dark font-semibold hover:underline"
                >
                  {copied ? "Copied! ✓" : "Copy ID"}
                </button>
              </div>
            )}
          </div>

          {/* Font Mode Toggle */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-text-brown mb-2">Text Color Mode</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => setFontMode('Dark')}
                className={`flex-1 py-2 rounded-xl font-sans font-bold border-2 transition-all ${
                  fontMode === 'Dark' 
                    ? 'bg-wood-dark text-white border-wood-dark shadow-md' 
                    : 'bg-white text-wood-dark border-wood-dark/20 hover:border-wood-dark/50'
                }`}
              >
                Dark Text
              </button>
              <button 
                onClick={() => setFontMode('Light')}
                className={`flex-1 py-2 rounded-xl font-sans font-bold border-2 transition-all ${
                  fontMode === 'Light' 
                    ? 'bg-wood-dark text-white border-wood-dark shadow-md' 
                    : 'bg-white text-wood-dark border-wood-dark/20 hover:border-wood-dark/50'
                }`}
              >
                Light Text
              </button>
            </div>
            <p className="font-sans text-xs text-text-brown/60 mt-2">
              Switch to Light Text if your custom background is dark and hard to read.
            </p>
          </div>

          {/* Background Upload */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-text-brown mb-2">Change Page Background</h3>
            <label className="flex items-center gap-3 p-3 bg-[#e8d0b3]/30 border-2 border-dashed border-wood-dark/30 rounded-lg cursor-pointer hover:bg-[#e8d0b3]/50 transition-colors">
               <div className="p-2 bg-white rounded-md shadow-sm border border-wood-dark/10">
                 <Upload className="w-5 h-5 text-wood-dark" />
               </div>
               <div className="flex-1 font-sans text-sm text-text-brown">
                 Upload a background for the entire page. 
               </div>
               <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                 if (e.target.files?.[0]) {
                   const b64 = await fileToBase64(e.target.files[0]);
                   setCustomBgUrl(b64);
                 }
               }} />
            </label>
            {customBgUrl && (
               <div className="mt-2 flex items-center justify-between bg-white p-2 text-text-brown rounded-md border border-wood-dark/10 font-sans text-xs shadow-sm">
                 <span className="text-green-700 truncate max-w-[200px] font-semibold">Background active ✓</span>
                 <button onClick={() => setCustomBgUrl('')} className="text-red-500 hover:underline px-2 py-1 rounded bg-red-50">Remove</button>
               </div>
            )}
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold text-text-brown mb-2">Change Sign Banner Background</h3>
            <label className="flex items-center gap-3 p-3 bg-[#e8d0b3]/30 border-2 border-dashed border-wood-dark/30 rounded-lg cursor-pointer hover:bg-[#e8d0b3]/50 transition-colors">
               <div className="p-2 bg-white rounded-md shadow-sm border border-wood-dark/10">
                 <Upload className="w-5 h-5 text-wood-dark" />
               </div>
               <div className="flex-1 font-sans text-sm text-text-brown">
                 Upload a background image for "Little Corner" sign. 
               </div>
               <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                 if (e.target.files?.[0]) {
                   const b64 = await fileToBase64(e.target.files[0]);
                   setSignBgUrl(b64);
                 }
               }} />
            </label>
            {signBgUrl && (
               <div className="mt-2 flex items-center justify-between bg-white p-2 text-text-brown rounded-md border border-wood-dark/10 font-sans text-xs shadow-sm">
                 <span className="text-green-700 truncate max-w-[200px] font-semibold">Sign background active ✓</span>
                 <button onClick={() => setSignBgUrl('')} className="text-red-500 hover:underline px-2 py-1 rounded bg-red-50">Remove</button>
               </div>
            )}
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold text-text-brown mb-2">Change Main Board Background</h3>
            <label className="flex items-center gap-3 p-3 bg-[#e8d0b3]/30 border-2 border-dashed border-wood-dark/30 rounded-lg cursor-pointer hover:bg-[#e8d0b3]/50 transition-colors">
               <div className="p-2 bg-white rounded-md shadow-sm border border-wood-dark/10">
                 <Upload className="w-5 h-5 text-wood-dark" />
               </div>
               <div className="flex-1 font-sans text-sm text-text-brown">
                 Upload a background image for the main app area. 
               </div>
               <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                 if (e.target.files?.[0]) {
                   const b64 = await fileToBase64(e.target.files[0]);
                   setBoardBgUrl(b64);
                 }
               }} />
            </label>
            {boardBgUrl && (
               <div className="mt-2 flex items-center justify-between bg-white p-2 text-text-brown rounded-md border border-wood-dark/10 font-sans text-xs shadow-sm">
                 <span className="text-green-700 truncate max-w-[200px] font-semibold">Board background active ✓</span>
                 <button onClick={() => setBoardBgUrl('')} className="text-red-500 hover:underline px-2 py-1 rounded bg-red-50">Remove</button>
               </div>
            )}
          </div>

          {/* Avatar Upload */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-text-brown mb-2">Change Avatar</h3>
            <label className="flex items-center gap-3 p-3 bg-[#e8d0b3]/30 border-2 border-dashed border-wood-dark/30 rounded-lg cursor-pointer hover:bg-[#e8d0b3]/50 transition-colors">
               <div className="p-2 bg-white rounded-md shadow-sm border border-wood-dark/10">
                 <Upload className="w-5 h-5 text-wood-dark" />
               </div>
               <div className="flex-1 font-sans text-sm text-text-brown">
                 Click to upload a new profile picture.
               </div>
               <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                 if (e.target.files?.[0]) {
                   const b64 = await fileToBase64(e.target.files[0]);
                   setAvatarUrl(b64);
                 }
               }} />
            </label>
            {avatarUrl && (
               <div className="mt-2 flex items-center justify-between bg-white p-2 text-text-brown rounded-md border border-wood-dark/10 font-sans text-xs shadow-sm">
                 <span className="text-green-700 truncate max-w-[200px] font-semibold">Avatar active ✓</span>
                 <button onClick={() => setAvatarUrl('')} className="text-red-500 hover:underline px-2 py-1 rounded bg-red-50">Remove</button>
               </div>
            )}
          </div>

          {/* Information Section */}
          <div className="mt-8 bg-[#e1f0e5] border border-[#7ba988] p-5 rounded-xl shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />
            <h4 className="font-bold font-sans text-sm text-green-900 mb-2 flex flex-col gap-1">
              <span className="uppercase text-[10px] tracking-widest text-green-700">Instructions</span>
              {isAdmin ? "Admin Guide & Customization:" : "Welcome to Little Corner:"}
            </h4>
            <p className="font-sans text-[13px] text-green-900 leading-relaxed drop-shadow-sm">
              {isAdmin ? (
                <>
                  1. <strong>Sticker & Character Upload:</strong> Use the Admin tab at the top to customize characters, clothing, and stickers for all users.<br/>
                  2. <strong>Page Backgrounds:</strong> Change default app background options or upload private layouts here.<br/>
                  3. <strong>Cozy Design:</strong> Once items are uploaded, they immediately sync in real time across all logged-in sessions!
                </>
              ) : (
                <>
                  Make this cozy space your own! Upload a custom page background and profile avatar above. Use character models, snug clothing, and cute decals to design the perfect relaxation desk.
                </>
              )}
            </p>
          </div>
        </div>

      </motion.div>
    </div>
  );
}

function GoalsTrackerView() {
  const { goals, addGoal, toggleGoal, removeGoal } = useGoals();
  const [newTitle, setNewTitle] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const [showGoalForm, setShowGoalForm] = useState(false);
  
  const { assets: globalDecals } = useGlobalAssets('decal');
  const [selectedSticker, setSelectedSticker] = useState("");

  const handleAddGoal = () => {
    if (newTitle.trim()) {
      addGoal(newTitle, newDetails, selectedSticker);
      setNewTitle("");
      setNewDetails("");
      setSelectedSticker("");
      setShowGoalForm(false);
    }
  };

  const handleToggleGoal = (id: string, currentCompleted: boolean) => {
    if (!currentCompleted) {
       setShowConfetti(true);
       setTimeout(() => setShowConfetti(false), 5000); // 5 seconds of celebration
    }
    toggleGoal(id, currentCompleted);
  };

  const completedCount = goals.filter((g: any) => g.completed).length;
  const totalCount = goals.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 105 : 0; // slight scale for fullness
  const actualPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div 
      className="bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-[#8c5737]/25 shadow-xl p-5 sm:p-7 md:p-9 flex flex-col gap-6 w-full text-left relative overflow-hidden"
      style={{ boxShadow: '0 10px 25px -5px rgba(100,50,20,0.08), inset 0 0 24px rgba(230,218,199,0.25)' }}
    >
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.2} style={{ position: 'fixed', top: 0, left: 0, zIndex: 10000 }} />}
      
      {/* Decorative floral background seal */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#5c8b51]/5 rounded-bl-full pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-wood-dark/15 pb-5 z-10">
         <div>
           <div className="flex items-center gap-2">
             <span className="text-xl sm:text-2xl">🌱</span>
             <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#5c3e21] tracking-tight">Dream & Goal Board</h3>
           </div>
           <p className="font-sans text-xs sm:text-sm text-[#593922]/70 mt-0.5">Achievements and heartwarming milestones to fulfill in your sweet lifetime.</p>
         </div>
         
         <button 
           onClick={() => setShowGoalForm(!showGoalForm)}
           className="bg-[#8c5737] hover:bg-[#61361c] text-white px-5 py-2.5 rounded-full font-sans font-bold shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all text-xs sm:text-sm flex gap-2 items-center justify-center shrink-0"
         >
           {showGoalForm ? (
             'Cancel Form'
           ) : (
             <><Plus className="w-4 h-4"/> Write a New Dream</>
           )}
         </button>
      </div>

      {/* Sprouting Progress Bar */}
      {totalCount > 0 && (
        <div className="bg-[#fcf8f2] border border-[#ebd3b2] p-4 rounded-2xl flex flex-col gap-2 shadow-sm z-10 transition-all">
          <div className="flex justify-between items-center text-xs font-bold text-[#5c3e21]/80">
            <span className="flex items-center gap-1">🌸 Cozy Progress Indicator:</span>
            <span className="text-[#5c8b51] font-mono text-xs bg-white px-2 py-0.5 rounded-full border border-wood-dark/5">
              {completedCount} of {totalCount} bloomed ({actualPercent}%)
            </span>
          </div>
          <div className="w-full bg-[#ebd3b2]/20 h-3.5 rounded-full overflow-hidden relative border border-nested-wood/10 p-[1.5px]">
            <div 
              className="h-full bg-gradient-to-r from-[#a0cc94] to-[#5c8b51] rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${Math.min(100, Math.max(0, actualPercent))}%` }}
            >
              <div className="absolute inset-x-0 top-0 bottom-[50%] bg-white/10" />
            </div>
          </div>
          <div className="flex justify-between text-[10px] sm:text-[11px] font-sans text-wood-dark/65 mt-0.5 px-0.5">
            <span>🌱 Seeds Planted</span>
            <span className="italic text-[#5c8b51]">
              {actualPercent === 100 ? '🎉 Absolutely incredible! All dreams bloomed!' : actualPercent > 50 ? '🌟 Growing beautifully into a garden!' : '💧 Water them daily by taking action!'}
            </span>
            <span>🌸 Beautiful Garden</span>
          </div>
        </div>
      )}
      
      {/* Add New Goal */}
      <AnimatePresence>
        {showGoalForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="overflow-hidden z-10"
          >
            <div className="bg-[#fefcf8] border-2 border-dashed border-[#8c5737]/30 shadow-md rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#8c5737]/70">What is your dream?</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Publish a cozy cookbook, Drink water daily..."
                  className="w-full px-4 py-2.5 bg-white border border-[#8c5737]/20 rounded-xl font-sans text-[#5c3e21] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8c5737]/15 focus:border-[#8c5737] text-sm"
                  onKeyDown={e => e.key === 'Enter' && handleAddGoal()}
                />
              </div>
              
              <div className="flex flex-col gap-4">
                 <div className="flex flex-col gap-1.5">
                   <label className="text-xs font-bold uppercase tracking-wider text-[#8c5737]/70">Additional Details / Milestones</label>
                   <textarea 
                     value={newDetails}
                     onChange={e => setNewDetails(e.target.value)}
                     placeholder="Any small baby steps to hit this milestone..."
                     className="w-full px-4 py-2.5 bg-white border border-[#8c5737]/20 rounded-xl font-sans text-[#5c3e21] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8c5737]/15 focus:border-[#8c5737] resize-none h-20 text-sm"
                   />
                 </div>
                 
                 {/* Sticker selection box */}
                 <div className="w-full bg-[#faf7f2]/50 border border-[#8c5737]/15 rounded-xl p-4 flex flex-col items-center">
                    <span className="text-xs font-bold text-[#8c5737]/80 uppercase tracking-widest mb-2.5 flex items-center gap-1">🏷️ Attach a Badge Sticker</span>
                    {globalDecals.length > 0 ? (
                       <div className="flex flex-wrap gap-2.5 justify-center w-full content-start max-h-[120px] overflow-y-auto p-1 custom-scrollbar">
                          <button 
                            onClick={() => setSelectedSticker("")}
                            className={`w-11 h-11 flex items-center justify-center rounded-xl border-2 transition-all ${!selectedSticker ? 'border-[#8c5737] bg-white shadow-sm font-bold text-[#8c5737] text-xs' : 'border-dashed border-stone-300 hover:border-stone-400 bg-white/50 text-stone-400 text-xs text-center'}`}
                          >
                            None
                          </button>
                          {globalDecals.map((d: any, idx: number) => (
                             <button
                               key={idx}
                               onClick={() => setSelectedSticker(d.url)}
                               className={`w-11 h-11 p-1.5 rounded-xl border-2 bg-white flex items-center justify-center transition-all ${selectedSticker === d.url ? 'border-[#8c5737] ring-2 ring-[#8c5737]/10 scale-110 shadow-sm' : 'border-[#8c5737]/10 hover:border-[#8c5737]/35 hover:scale-105'}`}
                             >
                                <img src={d.url} alt="sticker" className="w-full h-full object-contain pointer-events-none" />
                             </button>
                          ))}
                       </div>
                    ) : (
                       <div className="text-xs opacity-55 text-center py-2 italic text-wood-dark/70">No stickers uploaded yet. Go to Admin to add decals.</div>
                    )}
                 </div>
              </div>
              <div className="flex justify-end gap-2 mt-1">
                <button 
                  onClick={() => setShowGoalForm(false)}
                  className="px-5 py-2.5 border border-stone-200 text-[#5c3e21] hover:bg-stone-50 rounded-xl font-sans font-bold text-xs sm:text-sm transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddGoal}
                  className="bg-[#5c8b51] hover:bg-[#4d7543] text-white px-6 py-2.5 rounded-xl font-sans font-bold shadow-md hover:scale-105 active:scale-100 transition-all text-xs sm:text-sm"
                >
                  Plant this Goal 🌱
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 z-10">
        <AnimatePresence>
          {goals.map((goal: any) => (
            <motion.div 
              key={goal.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col relative group shadow-sm min-h-[180px] justify-between ${
                goal.completed 
                  ? 'bg-gradient-to-br from-[#f8fcf7] to-[#f2faf0] border-[#a0cc94]/60' 
                  : 'bg-[#faf6ee] border-[#ebd3b2]/75 hover:border-[#8c5737] hover:shadow-md'
              }`}
            >
              {/* Sticker Decor */}
              {goal.stickerUrl && (
                 <div className="absolute top-2.5 right-2.5 w-12 h-12 opacity-95 group-hover:scale-110 transition-transform -rotate-12 drop-shadow-[0_2px_4px_rgba(0,0,0,0.08)] pointer-events-none z-10">
                    <img src={goal.stickerUrl} alt="badge" className="w-full h-full object-contain" />
                 </div>
              )}
              
              {/* Soft decorative pinned paperclip / washi tape layout at top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[5px] w-12 h-3 bg-[#ebd3b2]/45 rounded-sm border-l border-r border-[#d8b584]/20 rotate-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)] pointer-events-none" />
            
              <div className="flex flex-col flex-1">
                {/* Top Row: Title & Actions */}
                <div className="flex justify-between items-start mb-2 gap-2 relative z-10">
                  <h4 className={`font-serif text-base sm:text-lg font-bold pr-10 leading-snug ${goal.completed ? 'text-stone-700/80 line-through' : 'text-[#5c3e21]'}`}>
                    {goal.title}
                  </h4>
                </div>
  
                {/* Details */}
                <p className={`font-sans text-xs sm:text-sm relative z-10 whitespace-pre-wrap flex-1 mb-4 ${goal.completed ? 'text-stone-500/70' : 'text-[#593922]/90 mt-1 lines-spaced'}`}>
                  {goal.details || <span className="italic opacity-40">No instructions or details attached.</span>}
                </p>
              </div>
              
              <div className="flex justify-between items-center border-t border-wood-dark/10 pt-3 z-10">
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button 
                    onClick={() => removeGoal(goal.id)}
                    className="p-1.5 bg-white/80 border border-stone-200 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-all shadow-sm flex items-center justify-center"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <button 
                  onClick={() => handleToggleGoal(goal.id, goal.completed)}
                  className={`py-1.5 px-3 border rounded-xl font-sans text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 ${goal.completed ? 'bg-[#5c8b51] border-[#4d7543] text-white' : 'bg-white border-[#8c5737]/30 text-[#8c5737] hover:bg-[#8c5737] hover:text-white hover:border-[#8c5737]'}`}
                >
                  {goal.completed ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                      <span>Bloomed!</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2px]" />
                      <span>Water Goal</span>
                    </>
                  )}
                </button>
              </div>

              {/* Completed overlay filter */}
              {goal.completed && (
                <div className="absolute inset-0 bg-white/10 z-0 pointer-events-none rounded-2xl" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {goals.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16 px-6 bg-wood-light/5 rounded-2xl border-2 border-dashed border-wood-dark/20 dynamic-border">
            <span className="text-3xl mb-2 block">🌟</span>
            <h4 className="text-lg font-serif font-bold text-wood-dark mb-1 dynamic-text">Your list is still clean & fresh!</h4>
            <p className="text-xs sm:text-sm font-sans text-wood-dark/65 max-w-sm mx-auto dynamic-text-muted">What is a heartwarming dream (big or tiny) that you want to cultivate in your Little Corner?</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MemoriesDiaryView({ memories, setMemories }: { memories: Memory[], setMemories: React.Dispatch<React.SetStateAction<Memory[]>> }) {
  const deleteMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const updateNote = (id: string, newNote: string) => {
    setMemories(prev => prev.map(m => m.id === id ? { ...m, note: newNote } : m));
  };

  return (
    <div 
      className="bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-[#8c5737]/25 shadow-xl p-5 sm:p-7 md:p-9 flex flex-col gap-6 w-full text-left relative overflow-hidden"
      style={{ boxShadow: '0 10px 25px -5px rgba(100,50,20,0.08), inset 0 0 24px rgba(230,218,199,0.25)' }}
    >
      {/* Decorative background embellishment */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#e0a99e]/5 rounded-bl-full pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-wood-dark/15 pb-5 z-10">
         <div>
           <div className="flex items-center gap-2">
             <span className="text-xl sm:text-2xl">📸</span>
             <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#5c3e21] tracking-tight">Desk Scrapbook</h3>
           </div>
           <p className="font-sans text-xs sm:text-sm text-[#593922]/70 mt-0.5">Captioned snapshots of your customized desk workspace. Journal your feelings!</p>
         </div>
      </div>

      {memories.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-6 bg-[#faf6ee]/50 border-2 border-dashed border-[#8c5737]/20 rounded-2xl p-8 z-10">
          <Camera className="w-12 h-12 text-[#8c5737]/40 mb-3" />
          <h4 className="text-lg font-serif font-bold text-[#5c3e21] mb-1">Scrapbook is waiting...</h4>
          <p className="text-xs sm:text-sm font-sans text-[#593922]/70 max-w-sm mx-auto">
            Click the pink camera button <span className="inline-flex bg-pink-100/80 px-1 py-0.5 rounded-md font-bold text-pink-700">Snap Desk!</span> in the bottom right corner anytime to capture and save your desk configuration!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pr-1.5 custom-scrollbar pb-6 z-10">
          <AnimatePresence>
            {memories.map((m) => {
              const staticAngle = Math.sin(parseInt(m.id)) * 2; // consistent rotation tilt for each card
              return (
                <motion.div 
                  key={m.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: 0,
                    rotate: staticAngle
                  }}
                  whileHover={{ 
                    scale: 1.02, 
                    rotate: 0, 
                    zIndex: 20,
                    boxShadow: '0 12px 28px rgba(92,62,33,0.14)'
                  }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  className="bg-[#fffefc] p-4 rounded-sm border border-stone-200/80 relative group flex flex-col pointer-events-auto"
                  style={{ 
                    boxShadow: '0 4px 15px rgba(92,62,33,0.06), inset 0 0 20px rgba(230,218,199,0.1)'
                  }}
                >
                  {/* Tape pieces */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-[#eae0c6]/60 backdrop-blur-[1px] border border-[#d2c2a0]/30 -skew-x-12 shadow-[0_1px_2px_rgba(0,0,0,0.03)] z-20" />
                  
                  {/* Photo snapshot container */}
                  <div className="aspect-[4/3] w-full bg-white border border-stone-150 p-2.5 shadow-inner mb-4 overflow-hidden relative rounded-[2px]">
                    <img src={m.url} alt="Desk Snapshot" className="w-full h-full object-cover object-top hover:scale-[1.02] transition-transform duration-300" />
                    <div className="absolute inset-x-2.5 top-2.5 bottom-2.5 shadow-inner pointer-events-none border border-black/5" />
                  </div>

                  {/* Date & Note section styled like a diary ledger */}
                  <div className="flex-1 flex flex-col relative z-0 min-h-[96px] bg-[#faf7f0]/40 p-2 rounded-lg border border-[#8c5737]/10">
                    <div className="font-sans text-[10px] uppercase font-bold tracking-wider text-[#8c5737]/65 mb-1.5 px-1.5 select-none">
                      ✦ {m.date}
                    </div>
                    <textarea 
                      value={m.note}
                      onChange={(e) => updateNote(m.id, e.target.value)}
                      className="w-full flex-1 bg-transparent border-none resize-none font-serif text-xs sm:text-sm text-[#5c3e21] focus:outline-none focus:ring-0 leading-6 placeholder-stone-400 p-1.5"
                      placeholder="Type a sweet memory about today..."
                      style={{
                        backgroundImage: 'linear-gradient(transparent, transparent 23px, rgba(140,87,55,0.1) 24px)',
                        backgroundSize: '100% 24px',
                        lineHeight: '24px'
                      }}
                    />
                  </div>

                  {/* Accessible hover and focus trash bin button */}
                  <button 
                    onClick={() => deleteMemory(m.id)}
                    className="absolute -top-2.5 -right-2.5 p-2 bg-red-400 hover:bg-red-500 text-white rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110 active:scale-95 transition-all shadow-md z-30 flex items-center justify-center border-2 border-white"
                    title="Remove polaroid"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
