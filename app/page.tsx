'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Subject {
  id: string;
  name: string;
  color: string;
}

export default function TimerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Timer state
  const [totalSeconds, setTotalSeconds] = useState(25 * 60); // Default 25 min
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [inputMinutes, setInputMinutes] = useState('25');

  const startTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auth check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch subjects
  useEffect(() => {
    if (session) {
      fetch('/api/subjects')
        .then(res => res.json())
        .then(data => {
          setSubjects(data);
          if (data.length > 0 && !selectedSubjectId) {
            setSelectedSubjectId(data[0].id);
          }
        })
        .catch(console.error);
    }
  }, [session, selectedSubjectId]);

  // Timer logic
  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, remainingSeconds]);

  const playChime = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5); // A4

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error('Failed to play sound:', e);
    }
  }, []);

  const handleComplete = useCallback(async () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Play sound
    playChime();

    // Notify user
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏱️ フォーカスタイマー完了！', {
        body: '設定した時間が経過しました。お疲れ様でした！',
        icon: '/favicon.ico'
      });
    }

    // Record session
    if (startTimeRef.current && selectedSubjectId) {
      const endTime = new Date();
      const duration = totalSeconds;

      try {
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectId: selectedSubjectId,
            startTime: startTimeRef.current.toISOString(),
            endTime: endTime.toISOString(),
            duration,
          }),
        });
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }

    // Reset
    startTimeRef.current = null;
  }, [selectedSubjectId, totalSeconds]);

  const handleStart = () => {
    if (!isRunning) {
      // Resume AudioContext on user interaction if needed
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const dummyCtx = new AudioContextClass();
        if (dummyCtx.state === 'suspended') {
          dummyCtx.resume();
        }
      }

      startTimeRef.current = new Date();
      setIsRunning(true);

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
    startTimeRef.current = null;
  };

  const handleSetTime = () => {
    const mins = parseInt(inputMinutes) || 25;
    const secs = mins * 60;
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;

  if (status === 'loading') {
    return (
      <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-muted">読み込み中...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="container" style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      <header style={{ textAlign: 'center', paddingTop: 'var(--space-xl)' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>⏱️ Focus Timer</h1>
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>
          こんにちは、{session.user?.name || session.user?.email}さん
        </p>
      </header>

      {/* Timer Display */}
      <div className="glass-card mt-xl" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Progress ring background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `conic-gradient(var(--color-primary) ${progress}%, transparent ${progress}%)`,
          opacity: 0.1,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="timer-display">
            {formatTime(remainingSeconds)}
          </div>

          {/* Subject selector */}
          <div className="mt-lg">
            <select
              className="select"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={isRunning}
            >
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-md mt-lg">
            {!isRunning ? (
              <button
                className="btn btn-primary btn-icon btn-large"
                onClick={handleStart}
                disabled={!selectedSubjectId}
              >
                ▶
              </button>
            ) : (
              <button
                className="btn btn-secondary btn-icon btn-large"
                onClick={handlePause}
              >
                ⏸
              </button>
            )}
            <button
              className="btn btn-ghost btn-icon btn-large"
              onClick={handleReset}
            >
              ↺
            </button>
          </div>
        </div>
      </div>

      {/* Time presets */}
      <div className="glass-card mt-lg">
        <p className="label">時間設定</p>
        <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
          {[15, 25, 45, 60, 90].map(mins => (
            <button
              key={mins}
              className={`btn ${totalSeconds === mins * 60 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setTotalSeconds(mins * 60);
                setRemainingSeconds(mins * 60);
                setInputMinutes(mins.toString());
              }}
              disabled={isRunning}
              style={{ flex: '1', minWidth: '60px' }}
            >
              {mins}分
            </button>
          ))}
        </div>
        <div className="flex gap-sm mt-md">
          <input
            type="number"
            className="input"
            value={inputMinutes}
            onChange={(e) => setInputMinutes(e.target.value)}
            min={1}
            max={180}
            disabled={isRunning}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-secondary"
            onClick={handleSetTime}
            disabled={isRunning}
          >
            設定
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="nav">
        <Link href="/" className="nav-item active">
          <span className="nav-icon">⏱️</span>
          <span>タイマー</span>
        </Link>
        <Link href="/subjects" className="nav-item">
          <span className="nav-icon">📚</span>
          <span>科目</span>
        </Link>
        <Link href="/analytics" className="nav-item">
          <span className="nav-icon">📊</span>
          <span>分析</span>
        </Link>
      </nav>
    </div>
  );
}
