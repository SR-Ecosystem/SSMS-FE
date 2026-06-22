import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { Loader2, CheckCircle2, XCircle, Trophy, Clock, Star, Flame, Sparkles } from 'lucide-react';
import axios from 'axios';

const QuizPlayer = () => {
  const { id } = useParams();
  const pin = id; // use the quiz ID as the lobby PIN
  const { user } = useAuth();
  const navigate = useNavigate();

  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState('joining'); // joining, waiting, active, result, finished
  const [quizTitle, setQuizTitle] = useState('');
  
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState(null); // { isCorrect, pointsEarned }
  const [totalScore, setTotalScore] = useState(0);
  const totalScoreRef = useRef(0);
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [liveAnswered, setLiveAnswered] = useState(0);
  const [liveTotalPlayers, setLiveTotalPlayers] = useState(0);

  // Keep totalScoreRef updated with current totalScore
  useEffect(() => {
    totalScoreRef.current = totalScore;
  }, [totalScore]);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL, { withCredentials: true });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('player-join', {
        pin,
        name: user.name,
        rollNumber: user.rollNumber,
        studentId: user._id
      });
    });

    newSocket.on('join-error', (data) => {
      alert(data.message);
      navigate('/student/quizzes');
    });

    newSocket.on('joined-successfully', (data) => {
      setQuizTitle(data.title);
      setGameState('waiting');
    });

    newSocket.on('game-started', () => {
      setGameState('active');
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => console.log('Fullscreen failed:', err));
        }
      } catch(e) {}
    });

    newSocket.on('new-question', (data) => {
      setCurrentQuestion(data);
      setTimeLeft(data.timeLimit);
      setQuestionStartTime(Date.now());
      setHasAnswered(false);
      setAnswerResult(null);
      setLiveAnswered(0);
      setLiveTotalPlayers(0);
      setGameState('active');
    });

    newSocket.on('answer-acknowledged', () => {
      setHasAnswered(true);
    });

    newSocket.on('player-answered', (data) => {
      setLiveAnswered(data.totalAnswers);
      setLiveTotalPlayers(data.totalPlayers);
    });

    newSocket.on('answer-result', (data) => {
      setAnswerResult({
        isCorrect: data.isCorrect,
        pointsEarned: data.pointsEarned,
        currentRank: data.currentRank,
        correctAnswerText: data.correctAnswerText,
        correctOption: data.correctOption,
        selectedOption: data.selectedOption
      });
      setTotalScore(prev => prev + data.pointsEarned);
      if (data.isCorrect) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#34d399', '#f59e0b', '#ffffff']
        });
      }
    });

    newSocket.on('show-leaderboard', (data) => {
      setLeaderboard(data.leaderboard);
      setGameState('leaderboard');
    });

    newSocket.on('game-finished', async (data) => {
      setLeaderboard(data.leaderboard);
      setGameState('finished');
      
      // Save attempt to database using the ref value to avoid stale closures
      try {
        await axios.post(`/quizzes/${data.quizId}/attempts`, {
          studentId: user._id,
          score: totalScoreRef.current
        });
      } catch (err) {
        console.error('Failed to save score', err);
      }
    });

    newSocket.on('host-disconnected', () => {
      alert('The host ended the game unexpectedly.');
      navigate('/student/quizzes');
    });

    return () => newSocket.close();
  }, [pin, user, navigate]);

  // Timer Effect
  useEffect(() => {
    let timer;
    if (gameState === 'active' && currentQuestion && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, currentQuestion, timeLeft]);

  const handleAnswerSubmit = (index) => {
    if (hasAnswered) return;
    setHasAnswered(true);
    const timeTakenMs = Date.now() - questionStartTime;
    socket.emit('player-submit-answer', { pin, answerIndex: index, timeTakenMs });
  };

  if (gameState === 'joining') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-16 h-16 animate-spin text-emerald-400 mb-4" />
        <p className="text-lg font-bold tracking-widest text-emerald-400 animate-pulse uppercase">Connecting to Arena...</p>
      </div>
    );
  }

  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center text-white overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="w-32 h-32 bg-slate-800/80 rounded-full flex items-center justify-center mb-8 animate-bounce border-4 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.4)] relative z-10">
          <Sparkles className="w-16 h-16 text-emerald-400" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-emerald-400">
          You Are In!
        </h1>
        <h2 className="text-2xl md:text-3xl text-emerald-400 font-extrabold mb-12 relative z-10 uppercase tracking-wide">
          {quizTitle}
        </h2>
        
        <div className="bg-slate-900/60 backdrop-blur-md px-8 py-4 rounded-2xl border border-slate-800 shadow-xl inline-flex items-center gap-3 animate-pulse relative z-10">
          <Flame className="w-5 h-5 text-orange-500" />
          <p className="text-slate-300 text-lg font-bold uppercase tracking-wider">Waiting for Host to ignite the quiz...</p>
        </div>
      </div>
    );
  }

  if (gameState === 'leaderboard' || gameState === 'finished') {
    const myRank = leaderboard.findIndex(p => p.rollNumber === user.rollNumber) + 1;
    
    if (gameState === 'finished' && myRank > 0 && myRank <= 3) {
      setTimeout(() => {
        const duration = 4 * 1000;
        const end = Date.now() + duration;
        (function frame() {
          confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0 }, colors: ['#f59e0b', '#3b82f6', '#10b981'] });
          confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1 }, colors: ['#f59e0b', '#3b82f6', '#10b981'] });
          if (Date.now() < end) requestAnimationFrame(frame);
        }());
      }, 300);
    }

    return (
      <div className="min-h-screen bg-slate-950 fixed inset-0 z-50 flex flex-col items-center p-6 pt-16 text-white overflow-y-auto">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08),transparent_70%)] pointer-events-none"></div>

        {gameState === 'leaderboard' && answerResult ? (
          <div className="w-full max-w-3xl flex flex-col items-center mb-8 z-10 shrink-0">
            {answerResult.isCorrect ? (
              <div className="text-center p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl w-full max-w-md shadow-xl mb-6">
                <CheckCircle2 className="w-16 h-16 mb-2 mx-auto text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.4)] animate-bounce" />
                <h1 className="text-3xl font-black text-emerald-400 tracking-tight">CORRECT!</h1>
                <p className="text-lg font-black text-white mt-1">+{answerResult.pointsEarned} PTS</p>
              </div>
            ) : (
              <div className="text-center p-5 bg-rose-500/10 border border-rose-500/20 rounded-3xl w-full max-w-md shadow-xl mb-6">
                <XCircle className="w-16 h-16 mb-2 mx-auto text-rose-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]" />
                <h1 className="text-3xl font-black text-rose-500 tracking-tight">
                  {answerResult.selectedOption === -1 ? "TIME'S UP!" : "INCORRECT"}
                </h1>
                <p className="text-slate-400 text-sm font-bold mt-1">Consistency is key, keep pushing!</p>
              </div>
            )}

            {/* Detailed correctness visual options review */}
            <div className="w-full bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 text-center">Question Review</h3>
              <p className="text-base font-extrabold text-white text-center mb-4">{currentQuestion?.text}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentQuestion?.options.map((opt, idx) => {
                  const isCorrectOpt = idx === answerResult.correctOption;
                  const isSelectedOpt = idx === answerResult.selectedOption;
                  
                  let borderClass = "border-slate-800 bg-slate-900/60 opacity-40";
                  let statusIcon = null;
                  
                  if (isCorrectOpt) {
                    borderClass = "border-emerald-500 bg-emerald-950/40 shadow-[0_0_15px_rgba(16,185,129,0.15)] opacity-100 scale-101";
                    statusIcon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
                  } else if (isSelectedOpt) {
                    borderClass = "border-rose-500 bg-rose-950/40 shadow-[0_0_15px_rgba(244,63,94,0.15)] opacity-100 scale-101";
                    statusIcon = <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
                  }
                  
                  return (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-xl border-2 flex items-center justify-between gap-3 transition-all duration-300 text-sm ${borderClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs bg-slate-850 text-white ${isCorrectOpt ? 'bg-emerald-500/20 text-emerald-400' : isSelectedOpt ? 'bg-rose-500/20 text-rose-400' : ''}`}>
                          {['A', 'B', 'C', 'D'][idx]}
                        </div>
                        <span className="font-extrabold text-left">{opt}</span>
                      </div>
                      {statusIcon}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              <Trophy className="w-24 h-24 text-yellow-400 mb-6 drop-shadow-[0_0_40px_rgba(245,158,11,0.5)] animate-pulse" />
              <Star className="w-8 h-8 text-yellow-300 absolute -top-2 -right-2 animate-bounce" />
            </div>

            <h1 className="text-5xl font-black mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-500">
              {gameState === 'finished' ? 'Final Standings' : 'Lobby Leaderboard'}
            </h1>
            <div className="px-6 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full mb-8 shadow-lg">
              <p className="text-emerald-400 text-xl font-black">Score: {totalScore} PTS</p>
            </div>
          </>
        )}

        {/* Visual Podium for Top 3 */}
        {gameState === 'finished' && leaderboard.length > 0 && (
          <div className="flex items-end justify-center gap-4 md:gap-8 my-8 w-full max-w-2xl px-4 shrink-0 relative z-10">
            {/* 2nd Place */}
            {leaderboard[1] && (
              <div className="flex flex-col items-center flex-1 transition-all duration-700">
                <div className="relative mb-2 flex flex-col items-center">
                  <div className="text-4xl mb-1">🥈</div>
                  <div className="font-extrabold text-sm md:text-base text-slate-200 text-center truncate max-w-[120px]">{leaderboard[1].name}</div>
                  <div className="text-xs text-slate-400">{leaderboard[1].rollNumber}</div>
                </div>
                <div className="w-full bg-gradient-to-t from-slate-900/90 to-slate-800/40 border-t-4 border-slate-400 h-32 rounded-t-3xl flex flex-col items-center justify-between p-4 shadow-[0_0_20px_rgba(148,163,184,0.15)] relative">
                  <div className="text-lg font-black text-slate-300">2nd</div>
                  <div className="text-base font-black text-emerald-400 mt-auto">{leaderboard[1].score} <span className="text-[10px] text-slate-500 font-bold">PTS</span></div>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {leaderboard[0] && (
              <div className="flex flex-col items-center flex-1 transition-all duration-700">
                <div className="relative mb-2 flex flex-col items-center">
                  <div className="text-5xl mb-1 filter drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">👑 🥇</div>
                  <div className="font-black text-base md:text-lg text-yellow-300 text-center truncate max-w-[140px]">{leaderboard[0].name}</div>
                  <div className="text-xs text-slate-300 font-medium">{leaderboard[0].rollNumber}</div>
                </div>
                <div className="w-full bg-gradient-to-t from-slate-900/90 to-yellow-600/20 border-t-4 border-yellow-400 h-44 rounded-t-3xl flex flex-col items-center justify-between p-4 shadow-[0_0_30px_rgba(245,158,11,0.25)] relative scale-105 z-10">
                  <div className="text-xl font-black text-yellow-300">1st</div>
                  <div className="text-lg font-black text-emerald-400 mt-auto">{leaderboard[0].score} <span className="text-xs text-slate-400 font-bold">PTS</span></div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {leaderboard[2] && (
              <div className="flex flex-col items-center flex-1 transition-all duration-700">
                <div className="relative mb-2 flex flex-col items-center">
                  <div className="text-4xl mb-1">🥉</div>
                  <div className="font-extrabold text-sm md:text-base text-amber-600 text-center truncate max-w-[120px]">{leaderboard[2].name}</div>
                  <div className="text-xs text-slate-400">{leaderboard[2].rollNumber}</div>
                </div>
                <div className="w-full bg-gradient-to-t from-slate-900/90 to-amber-900/40 border-t-4 border-amber-600 h-24 rounded-t-3xl flex flex-col items-center justify-between p-4 shadow-[0_0_20px_rgba(180,83,9,0.15)] relative">
                  <div className="text-lg font-black text-amber-600">3rd</div>
                  <div className="text-base font-black text-emerald-400 mt-auto">{leaderboard[2].score} <span className="text-[10px] text-slate-500 font-bold">PTS</span></div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {gameState === 'finished' && leaderboard.length > 0 && (
          <h2 className="text-2xl font-black text-slate-400 mb-4 mt-6 relative z-10 uppercase tracking-widest">Scoreboard</h2>
        )}

        <div className="w-full max-w-lg space-y-4 relative z-10">
          {leaderboard.map((p, i) => {
            const isMe = p.rollNumber === user.rollNumber;
            const rankStyles = 
              i === 0 ? 'bg-gradient-to-r from-amber-500/30 to-yellow-600/20 border-yellow-500/60 shadow-[0_0_20px_rgba(245,158,11,0.25)]' :
              i === 1 ? 'bg-gradient-to-r from-slate-500/30 to-slate-600/20 border-slate-400/50' :
              i === 2 ? 'bg-gradient-to-r from-amber-800/30 to-amber-900/20 border-amber-800/50' :
              'bg-slate-900/80 border-slate-800';

            return (
              <div 
                key={i} 
                className={`flex items-center p-5 rounded-3xl border-2 transition-all duration-300 transform ${rankStyles} ${isMe ? 'scale-105 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.2)]' : 'hover:scale-[1.01]'}`}
              >
                <div className={`w-12 h-12 flex items-center justify-center font-black rounded-full mr-4 text-xl
                  ${i === 0 ? 'bg-yellow-400 text-yellow-950' : 
                    i === 1 ? 'bg-slate-300 text-slate-950' : 
                    i === 2 ? 'bg-amber-600 text-amber-950' : 
                    'bg-slate-800 text-slate-400'}`}
                >
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-lg text-white flex items-center gap-2">
                    {p.name} {isMe && <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">YOU</span>}
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">{p.rollNumber}</p>
                </div>
                <div className="font-black text-2xl text-emerald-400 drop-shadow-[0_2px_4px_rgba(16,185,129,0.3)]">{p.score}</div>
              </div>
            );
          })}
        </div>

        {gameState === 'finished' && (
          <button 
            onClick={() => navigate('/student/quizzes')} 
            className="mt-16 px-12 py-5 bg-white text-slate-950 text-xl font-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] cursor-pointer relative z-10"
          >
            Go Back To Quizzes
          </button>
        )}
      </div>
    );
  }

  // Active state
  return (
    <div className="min-h-screen bg-slate-950 fixed inset-0 z-50 flex flex-col select-none text-white">
      {/* Header Info */}
      <div className="h-20 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800 shrink-0 shadow-lg relative z-10">
        <div className="flex items-center gap-3">
          <span className="px-4 py-1.5 rounded-full bg-slate-800 text-indigo-400 text-sm font-black uppercase tracking-wider border border-slate-700">
            {currentQuestion ? `Question ${currentQuestion.questionIndex + 1} of ${currentQuestion.totalQuestions}` : 'Loading...'}
          </span>
        </div>
        
        {/* Visual Game Timer */}
        {gameState === 'active' && (
          <div className="flex items-center gap-2">
            <Clock size={20} className={timeLeft <= 5 ? 'text-rose-500 animate-bounce' : 'text-slate-400'} />
            <div className={`text-3xl font-black font-mono tracking-wider ${timeLeft <= 5 ? 'text-rose-500 animate-pulse scale-110' : 'text-white'}`}>
              {timeLeft}s
            </div>
          </div>
        )}

        <div className="bg-emerald-500/10 border border-emerald-500/20 px-5 py-2 rounded-2xl flex items-center gap-2">
          <Star size={16} className="text-yellow-400 fill-yellow-400" />
          <span className="font-black text-emerald-400 text-2xl tracking-wide">{totalScore} <span className="text-xs text-slate-400 uppercase tracking-widest font-black">PTS</span></span>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="h-3 bg-slate-900 w-full shrink-0 shadow-inner">
        <div 
          className={`h-full transition-all duration-1000 ease-linear rounded-r-full ${timeLeft <= 5 ? 'bg-gradient-to-r from-rose-600 to-red-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
          style={{ width: `${(timeLeft / (currentQuestion?.timeLimit || 20)) * 100}%` }}
        />
      </div>

      {!hasAnswered ? (
        <div className="flex-1 p-6 flex flex-col">
          {/* Question Title */}
          <div className="flex-1 flex items-center justify-center text-center p-8 bg-slate-900/30 rounded-3xl border border-slate-900/50 mb-6">
            <h2 className="text-3xl md:text-5xl font-black leading-tight max-w-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">
              {currentQuestion?.text || 'Get Ready!'}
            </h2>
          </div>
          
          {/* Option Keys Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-[50vh] md:h-[40vh]">
            {[
              'bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 border-rose-700 shadow-rose-950/55',
              'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 border-blue-700 shadow-blue-950/55',
              'bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 border-amber-700 shadow-amber-950/55',
              'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 border-emerald-700 shadow-emerald-950/55'
            ].map((colorClass, idx) => (
              <button 
                key={idx}
                onClick={() => handleAnswerSubmit(idx)}
                className={`${colorClass} p-6 rounded-3xl border-b-[6px] shadow-xl active:border-b-2 active:translate-y-1 transition-all flex items-center gap-6 text-left cursor-pointer group`}
              >
                <div className="w-14 h-14 shrink-0 bg-white/20 rounded-2xl flex items-center justify-center text-white text-3xl font-black border border-white/10 group-hover:scale-105 transition-transform shadow-inner">
                  {['A', 'B', 'C', 'D'][idx]}
                </div>
                <span className="text-white font-extrabold text-xl md:text-2xl line-clamp-3 leading-snug">
                  {currentQuestion?.options[idx] || ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Response Status Panel */
        <div className={`flex-1 flex flex-col items-center justify-start p-6 pt-12 text-white relative overflow-y-auto transition-colors duration-500
          ${!answerResult ? 'bg-gradient-to-b from-indigo-950 to-slate-950' : 
            answerResult?.isCorrect ? 'bg-gradient-to-b from-emerald-950 via-slate-950 to-slate-950' : 
            timeLeft === 0 ? 'bg-gradient-to-b from-slate-900 to-slate-950' : 
            'bg-gradient-to-b from-rose-950 via-slate-950 to-slate-950'}`}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

          {answerResult?.currentRank && (
            <div className="absolute top-10 right-10 bg-slate-900/80 backdrop-blur-md px-8 py-4 rounded-3xl border border-slate-800 shadow-2xl animate-bounce z-20">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Current Rank</span>
              <div className="text-4xl font-black text-emerald-400 text-center mt-1">#{answerResult.currentRank}</div>
            </div>
          )}
          
          {!answerResult ? (
            <div className="text-center p-6 max-w-md animate-pulse z-10 flex flex-col items-center justify-center min-h-[50vh]">
              <Clock className="w-32 h-32 mb-8 mx-auto text-indigo-400 drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]" />
              <h1 className="text-4xl md:text-5xl font-black mb-3">Locked In!</h1>
              <p className="text-slate-400 text-lg font-bold">Waiting for others to finish answering...</p>
              
              {/* Live Tracker progress bar */}
              <div className="w-full max-w-md bg-slate-900/80 p-6 rounded-3xl border border-indigo-500/20 shadow-2xl mt-8 text-center">
                <p className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-2">Live Response Tracker</p>
                <div className="text-3xl font-black text-white mb-3">
                  {liveAnswered} <span className="text-lg text-slate-500 font-bold">/ {liveTotalPlayers || 1} Answered</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    style={{ width: `${(liveAnswered / (liveTotalPlayers || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center z-10">
              {answerResult?.isCorrect ? (
                <div className="text-center p-6">
                  <CheckCircle2 className="w-28 h-28 mb-4 mx-auto text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.5)] animate-bounce" />
                  <h1 className="text-5xl font-black mb-3 tracking-tight">CORRECT!</h1>
                  <div className="inline-block bg-emerald-500/20 border-2 border-emerald-500/40 px-8 py-3 rounded-3xl shadow-xl">
                    <p className="text-3xl font-black text-emerald-400">+{answerResult.pointsEarned} <span className="text-xs font-extrabold text-white">PTS</span></p>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 w-full max-w-2xl">
                  <XCircle className="w-28 h-28 mb-4 mx-auto text-rose-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]" />
                  <h1 className="text-5xl font-black mb-3 tracking-tight">{timeLeft === 0 ? "TIME'S UP!" : 'INCORRECT'}</h1>
                  <p className="text-slate-400 text-base font-bold mb-2">Consistency is key, keep pushing!</p>
                </div>
              )}

              {/* Detailed correctness visual options review */}
              <div className="w-full max-w-3xl mt-6 px-4 pb-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 text-center">Question Review</h3>
                <p className="text-lg md:text-xl font-extrabold text-white text-center mb-6">{currentQuestion?.text}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion?.options.map((opt, idx) => {
                    const isCorrectOpt = idx === answerResult.correctOption;
                    const isSelectedOpt = idx === answerResult.selectedOption;
                    
                    let borderClass = "border-slate-800 bg-slate-900/60 opacity-40";
                    let statusIcon = null;
                    
                    if (isCorrectOpt) {
                      borderClass = "border-emerald-500 bg-emerald-950/40 shadow-[0_0_20px_rgba(16,185,129,0.2)] opacity-100 scale-102";
                      statusIcon = <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />;
                    } else if (isSelectedOpt) {
                      borderClass = "border-rose-500 bg-rose-950/40 shadow-[0_0_20px_rgba(244,63,94,0.2)] opacity-100 scale-102";
                      statusIcon = <XCircle className="w-6 h-6 text-rose-400 shrink-0" />;
                    }
                    
                    return (
                      <div 
                        key={idx} 
                        className={`p-5 rounded-2xl border-2 flex items-center justify-between gap-4 transition-all duration-300 ${borderClass}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-slate-850 text-white ${isCorrectOpt ? 'bg-emerald-500/20 text-emerald-400' : isSelectedOpt ? 'bg-rose-500/20 text-rose-400' : ''}`}>
                            {['A', 'B', 'C', 'D'][idx]}
                          </div>
                          <span className="font-extrabold text-base md:text-lg text-left">{opt}</span>
                        </div>
                        {statusIcon}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {answerResult && (
            <div className="mt-8 bg-slate-900/50 backdrop-blur-md px-6 py-3 rounded-full border border-slate-850 animate-pulse text-sm text-slate-400 font-extrabold uppercase tracking-widest">
              Lobby updating shortly...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizPlayer;
