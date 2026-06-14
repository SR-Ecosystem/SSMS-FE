import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { Loader2, CheckCircle2, XCircle, Trophy, Clock } from 'lucide-react';
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
  
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const newSocket = io('http://localhost:5000', { withCredentials: true });
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
      setGameState('active');
    });

    newSocket.on('answer-acknowledged', () => {
      setHasAnswered(true);
    });

    newSocket.on('answer-result', (data) => {
      setAnswerResult({
        isCorrect: data.isCorrect,
        pointsEarned: data.pointsEarned,
        currentRank: data.currentRank,
        correctAnswerText: data.correctAnswerText
      });
      setTotalScore(prev => prev + data.pointsEarned);
      if (data.isCorrect) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#ffffff']
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
      
      // Save attempt to database
      try {
        await axios.post(`/quizzes/${data.quizId}/attempts`, {
          studentId: user._id,
          score: totalScore
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
  }, [pin, user, navigate, totalScore]);

  // Timer Effect (Visual only, backend and host handle the real timing)
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
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-slate-900 fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-8 animate-pulse shadow-[0_0_50px_rgba(16,185,129,0.3)]">
          <span className="text-4xl">👋</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">You're in!</h1>
        <h2 className="text-xl md:text-2xl text-emerald-400 font-bold mb-12">{quizTitle}</h2>
        <p className="text-slate-400 text-lg font-medium animate-pulse">See your nickname on the screen?</p>
      </div>
    );
  }

  if (gameState === 'leaderboard' || gameState === 'finished') {
    const myRank = leaderboard.findIndex(p => p.rollNumber === user.rollNumber) + 1;
    
    // Fire huge confetti if finished and in top 3
    if (gameState === 'finished' && myRank > 0 && myRank <= 3) {
      setTimeout(() => {
        const duration = 3 * 1000;
        const end = Date.now() + duration;
        (function frame() {
          confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#fbbf24'] });
          confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#fbbf24'] });
          if (Date.now() < end) requestAnimationFrame(frame);
        }());
      }, 500);
    }

    return (
      <div className="min-h-screen bg-slate-900 fixed inset-0 z-50 flex flex-col items-center p-6 pt-20 text-white overflow-y-auto">
        <Trophy className="w-20 h-20 text-amber-400 mb-6 drop-shadow-[0_0_30px_rgba(251,191,36,0.4)]" />
        <h1 className="text-4xl font-black mb-2 tracking-tight">
          {gameState === 'finished' ? 'Game Over!' : 'Leaderboard'}
        </h1>
        <p className="text-emerald-400 text-xl font-bold mb-12">Your Score: {totalScore}</p>
        
        <div className="w-full max-w-lg space-y-3">
          {leaderboard.map((p, i) => (
            <div key={i} className={`flex items-center p-4 rounded-2xl border ${p.rollNumber === user.rollNumber ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-slate-800 border-slate-700'}`}>
              <div className="w-10 h-10 flex items-center justify-center font-black rounded-full bg-slate-700 mr-4">{i + 1}</div>
              <div className="flex-1 font-bold text-lg">{p.name} {p.rollNumber === user.rollNumber && '(You)'}</div>
              <div className="font-black text-emerald-400">{p.score}</div>
            </div>
          ))}
        </div>

        {gameState === 'finished' && (
          <button onClick={() => navigate('/student')} className="mt-12 px-8 py-4 bg-white text-slate-900 font-black rounded-full hover:scale-105 transition-transform">
            Return to Dashboard
          </button>
        )}
      </div>
    );
  }

  // Active state
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 fixed inset-0 z-50 flex flex-col">
      {/* Header Info */}
      <div className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <div className="font-bold text-slate-500">
          {currentQuestion ? `Q ${currentQuestion.questionIndex + 1} / ${currentQuestion.totalQuestions}` : 'Loading...'}
        </div>
        
        {/* Timer Text */}
        {gameState === 'active' && (
          <div className={`text-2xl font-black ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-800 dark:text-white'}`}>
            {timeLeft}s
          </div>
        )}

        <div className="font-black text-emerald-500 text-xl">{totalScore} <span className="text-sm text-slate-400 font-bold">PTS</span></div>
      </div>

      {/* Timer Bar */}
      <div className="h-2 bg-slate-200 dark:bg-slate-700 w-full shrink-0">
        <div 
          className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / (currentQuestion?.timeLimit || 20)) * 100}%` }}
        />
      </div>

      {!hasAnswered ? (
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex-1 flex items-center justify-center text-center p-6">
            <h2 className="text-2xl md:text-4xl font-extrabold text-slate-800 dark:text-white leading-tight">
              {currentQuestion?.text || 'Get Ready!'}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[50vh] md:h-[40vh]">
            {['bg-rose-500 hover:bg-rose-400', 'bg-blue-500 hover:bg-blue-400', 'bg-amber-500 hover:bg-amber-400', 'bg-emerald-500 hover:bg-emerald-400'].map((color, idx) => (
              <button 
                key={idx}
                onClick={() => handleAnswerSubmit(idx)}
                className={`${color} p-4 rounded-3xl shadow-[0_10px_0_rgba(0,0,0,0.2)] active:translate-y-2 active:shadow-none transition-all flex items-center gap-4`}
              >
                <div className="w-12 h-12 shrink-0 bg-black/20 rounded-full flex items-center justify-center text-white text-2xl font-black">
                  {['A', 'B', 'C', 'D'][idx]}
                </div>
                <span className="text-white font-bold text-lg md:text-xl text-left line-clamp-3">
                  {currentQuestion?.options[idx] || ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={`flex-1 flex flex-col items-center justify-center text-white ${!answerResult ? 'bg-indigo-600' : answerResult?.isCorrect ? 'bg-emerald-500' : answerResult?.pointsEarned === 0 && timeLeft === 0 ? 'bg-slate-700' : 'bg-rose-500'} relative overflow-hidden`}>
          {answerResult?.currentRank && (
            <div className="absolute top-8 right-8 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/30 shadow-2xl animate-bounce">
              <span className="text-xl font-bold uppercase tracking-wider opacity-80">Current Rank</span>
              <div className="text-4xl font-black text-white text-center">#{answerResult.currentRank}</div>
            </div>
          )}
          
          {!answerResult ? (
            <>
              <Clock className="w-32 h-32 mb-8 animate-pulse text-indigo-200" />
              <h1 className="text-4xl md:text-5xl font-black mb-4 drop-shadow-md text-center px-4">Answer Submitted!</h1>
              <p className="text-xl font-bold opacity-80 mt-4 text-center">Waiting for others to finish...</p>
            </>
          ) : answerResult?.isCorrect ? (
            <>
              <CheckCircle2 className="w-32 h-32 mb-8 animate-bounce text-emerald-100" />
              <h1 className="text-5xl font-black mb-4 drop-shadow-md">Correct!</h1>
              <p className="text-3xl font-black bg-white/20 px-6 py-2 rounded-full border border-white/30">+{answerResult.pointsEarned} Points</p>
            </>
          ) : (
            <>
              <XCircle className="w-32 h-32 mb-8 text-rose-200" />
              <h1 className="text-5xl font-black mb-4">{timeLeft === 0 ? 'Time Up!' : 'Incorrect'}</h1>
              {answerResult.correctAnswerText && (
                <div className="bg-black/20 px-8 py-4 rounded-3xl border border-white/20 mt-2 mb-6 max-w-xl mx-4 shadow-xl">
                  <p className="text-sm font-bold uppercase tracking-widest text-rose-200 mb-2">Correct Answer</p>
                  <p className="text-2xl font-black text-white">{answerResult.correctAnswerText}</p>
                </div>
              )}
              <p className="text-xl font-bold opacity-80">Better luck next time!</p>
            </>
          )}
          
          {answerResult && (
            <p className="mt-16 text-xl font-bold opacity-70 animate-pulse">Waiting for next question...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizPlayer;
