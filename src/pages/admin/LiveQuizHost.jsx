import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Users, Play, SkipForward, Trophy, Loader2 } from 'lucide-react';

const LiveQuizHost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [socket, setSocket] = useState(null);
  
  const [gameState, setGameState] = useState('loading'); // loading, lobby, active, leaderboard, finished
  const [pin, setPin] = useState('');
  const [players, setPlayers] = useState([]);
  
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  // Timer countdown & auto-trigger leaderboard
  useEffect(() => {
    let timer;
    if (gameState === 'active') {
      if (timeLeft > 0) {
        timer = setInterval(() => {
          setTimeLeft(prev => prev - 1);
        }, 1000);
      } else {
        // Time is up, automatically show leaderboard/results
        if (socket) {
          socket.emit('host-show-leaderboard', { pin });
        }
      }
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, socket, pin]);

  useEffect(() => {
    // 1. Fetch Quiz Data
    const fetchQuiz = async () => {
      try {
        const { data } = await axios.get(`/quizzes/${id}`);
        setQuiz(data);
        
        // 2. Initialize Socket
        const newSocket = io(import.meta.env.VITE_API_URL, { withCredentials: true });
        setSocket(newSocket);

        newSocket.on('connect', () => {
          // Create Lobby
          newSocket.emit('host-start-lobby', { quizId: data._id, batchId: data.batchId._id, title: data.title });
        });

        newSocket.on('lobby-created', (data) => {
          setPin(data.pin);
          setGameState('lobby');
        });

        newSocket.on('player-joined', (updatedPlayers) => {
          setPlayers(updatedPlayers);
        });

        newSocket.on('new-question', (data) => {
          setCurrentQuestion(data.question);
          setCurrentQuestionIndex(data.questionIndex);
          setTotalAnswers(0);
          setTimeLeft(data.question.timeLimit || 20);
          setGameState('active');
        });

        newSocket.on('player-answered', (data) => {
          setTotalAnswers(data.totalAnswers);
        });

        newSocket.on('show-leaderboard', (data) => {
          setLeaderboard(data.leaderboard);
          setGameState('leaderboard');
        });

        newSocket.on('game-finished', (data) => {
          setLeaderboard(data.leaderboard);
          setGameState('finished');
        });

        return () => newSocket.close();
      } catch (error) {
        console.error('Error starting host:', error);
      }
    };
    fetchQuiz();
  }, [id]);

  const handleStartGame = () => {
    socket.emit('host-start-game', { pin, questions: quiz.questions });
  };

  const handleShowLeaderboard = () => {
    socket.emit('host-show-leaderboard', { pin });
  };

  const handleNextQuestion = () => {
    socket.emit('host-next-question', { pin });
  };

  const handleEndQuiz = async () => {
    try {
      if (quiz) {
        await axios.put(`/quizzes/${quiz._id}`, { status: 'completed' });
      }
      socket.close();
    } catch (err) {
      console.error('Error ending quiz:', err);
    }
    navigate('/quizzes');
  };

  if (gameState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans overflow-hidden fixed inset-0 flex flex-col z-50">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full mix-blend-screen filter blur-[150px] opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600 rounded-full mix-blend-screen filter blur-[150px] opacity-30 animate-blob animation-delay-2000"></div>

      {/* Header */}
      <header className="p-6 flex justify-between items-center relative z-10 bg-slate-900/50 backdrop-blur-md border-b border-white/10 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
            {quiz?.title}
          </h1>
          <p className="text-slate-400 font-medium mt-1">Host Panel</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Tell Students To Click</p>
            <div className="text-2xl font-black text-white bg-emerald-500/20 px-6 py-2 rounded-2xl border border-emerald-500 shadow-2xl">
              "Take Quiz"
            </div>
          </div>
          <button 
             onClick={handleEndQuiz}
             className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 hover:text-rose-300 font-bold rounded-xl transition-all border border-rose-500/30 hover:border-rose-500 flex items-center gap-2"
          >
             <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div> End Quiz
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 relative z-10 flex flex-col p-8 overflow-y-auto">
        {gameState === 'lobby' && (
          <div className="flex-1 flex flex-col items-center justify-start py-6">
            {/* Prominent Game PIN display */}
            <div className="text-center mb-10 bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl border border-slate-700 shadow-2xl max-w-md w-full animate-bounce">
              <p className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-2">Join at student/join-quiz with Game PIN</p>
              <h1 className="text-7xl font-black text-white tracking-widest">{pin}</h1>
            </div>

            <h2 className="text-2xl font-bold mb-8 animate-pulse text-slate-400">Waiting for players...</h2>
            
            <div className="flex flex-wrap justify-center gap-4 max-w-5xl mb-12">
              {players.map((p, i) => (
                <div key={i} className="bg-slate-800/80 backdrop-blur-md border border-slate-700 px-6 py-3 rounded-full flex items-center gap-3 animate-in zoom-in duration-300 shadow-xl">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold">
                    {p.name.charAt(0)}
                  </div>
                  <span className="font-bold text-lg">{p.name}</span>
                </div>
              ))}
              {players.length === 0 && (
                <p className="text-slate-500 italic">No one has joined yet.</p>
              )}
            </div>

            <div className="flex items-center gap-4 bg-slate-800/50 px-8 py-4 rounded-3xl backdrop-blur-md border border-slate-700/50">
              <Users className="w-8 h-8 text-emerald-400" />
              <span className="text-3xl font-black">{players.length}</span>
              <span className="text-slate-400 font-medium">Players Joined</span>
            </div>

            {players.length > 0 && (
              <button 
                onClick={handleStartGame}
                className="mt-12 px-12 py-5 bg-white text-slate-900 text-2xl font-black rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-3"
              >
                <Play fill="currentColor" size={28} /> Start Game
              </button>
            )}
          </div>
        )}

        {gameState === 'active' && currentQuestion && (
          <div className="flex-1 flex flex-col">
            <div className="text-center mb-12">
              <span className="bg-slate-800 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase mb-6 inline-block">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight max-w-4xl mx-auto">
                {currentQuestion.text}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto w-full mt-auto mb-12">
              {currentQuestion.options.map((opt, idx) => {
                const colors = [
                  'bg-rose-500 shadow-rose-500/20', 
                  'bg-blue-500 shadow-blue-500/20', 
                  'bg-amber-500 shadow-amber-500/20', 
                  'bg-emerald-500 shadow-emerald-500/20'
                ];
                return (
                  <div key={idx} className={`${colors[idx]} p-8 rounded-3xl shadow-xl flex items-center text-2xl font-bold min-h-[120px]`}>
                    <span className="w-12 h-12 bg-black/20 rounded-full flex items-center justify-center mr-6 shrink-0">
                      {['A', 'B', 'C', 'D'][idx]}
                    </span>
                    {opt}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-auto bg-slate-800/80 p-6 rounded-3xl backdrop-blur-md border border-slate-700">
              <div className="text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-1">Time Left</p>
                <p className={`text-4xl font-black ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                  {timeLeft > 0 ? `${timeLeft}s` : "Time's Up!"}
                </p>
              </div>
              <div className="text-center border-l border-r border-slate-700 px-8 mx-8">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-1">Answers</p>
                <p className="text-4xl font-black text-emerald-400">{totalAnswers} <span className="text-2xl text-slate-500">/ {players.length}</span></p>
              </div>
              <button 
                onClick={handleShowLeaderboard}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black rounded-2xl transition-colors flex items-center gap-2"
              >
                Skip & Show Leaderboard <SkipForward fill="currentColor" size={20} />
              </button>
            </div>
          </div>
        )}

        {(gameState === 'leaderboard' || gameState === 'finished') && (
          <div className="flex-1 flex flex-col items-center justify-start w-full py-6">
            <Trophy className="w-20 h-20 text-amber-400 mb-4 drop-shadow-[0_0_30px_rgba(251,191,36,0.5)] shrink-0 animate-pulse" />
            <h2 className="text-5xl font-black mb-8 tracking-tight shrink-0 bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-500">
              {gameState === 'finished' ? 'Final Standings' : 'Current Leaderboard'}
            </h2>

            {/* Correct Answer Display for intermediate leaderboard */}
            {gameState === 'leaderboard' && currentQuestion && (
              <div className="bg-slate-800/80 p-6 rounded-3xl border border-emerald-500/30 max-w-2xl w-full mb-8 shadow-xl text-center">
                <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">Correct Answer Was</p>
                <p className="text-2xl font-black text-white">{currentQuestion.options[currentQuestion.correctOption]}</p>
              </div>
            )}

            {/* Podium Visual Layout on finished */}
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
              <h3 className="text-2xl font-black text-slate-400 mb-6 uppercase tracking-widest relative z-10">Scoreboard</h3>
            )}
            
            <div className="w-full max-w-3xl space-y-4">
              {leaderboard.map((p, i) => (
                <div key={i} className="bg-slate-800/80 backdrop-blur-md border border-slate-700 p-6 rounded-2xl flex items-center shadow-xl animate-in slide-in-from-bottom-8 duration-500" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl mr-6
                    ${i === 0 ? 'bg-amber-400 text-amber-900' : 
                      i === 1 ? 'bg-slate-300 text-slate-800' : 
                      i === 2 ? 'bg-amber-700 text-amber-100' : 
                      'bg-slate-700 text-white'}`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">{p.name}</h3>
                    <p className="text-slate-400 text-sm">{p.rollNumber}</p>
                  </div>
                  <div className="text-3xl font-black text-emerald-400">
                    {p.score} <span className="text-sm font-bold text-slate-500">pts</span>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <p className="text-center text-xl text-slate-500 italic">No scores yet.</p>
              )}
            </div>

            <div className="mt-12">
              {gameState === 'leaderboard' ? (
                <button 
                  onClick={handleNextQuestion}
                  className="px-10 py-4 bg-white text-slate-900 text-xl font-black rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-2"
                >
                  Next Question <Play fill="currentColor" size={20} />
                </button>
              ) : (
                <button 
                  onClick={handleEndQuiz}
                  className="px-10 py-4 bg-emerald-500 text-slate-900 text-xl font-black rounded-full hover:scale-105 transition-transform flex items-center gap-2"
                >
                  End Session & Exit
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LiveQuizHost;
