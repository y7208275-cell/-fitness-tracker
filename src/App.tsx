import { useState, useEffect } from 'react';
import { initDB } from './db';
import { HomePage } from './pages/HomePage';
import { WorkoutPage } from './pages/WorkoutPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import type { BodyPart } from './types';

type Page = 'home' | 'workout' | 'history' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [ready, setReady] = useState(false);
  const [workoutBodyPart, setWorkoutBodyPart] = useState<BodyPart | null>(null);

  useEffect(() => {
    initDB().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="text-center" style={{ paddingTop: '40vh' }}>
        🏋️ 加载中...
      </div>
    );
  }

  function navigateTo(page: Page) {
    setCurrentPage(page);
  }

  function startWorkout(bodyPart: BodyPart) {
    setWorkoutBodyPart(bodyPart);
    setCurrentPage('workout');
  }

  function renderPage() {
    switch (currentPage) {
      case 'home':
        return <HomePage onStartWorkout={startWorkout} />;
      case 'workout':
        return <WorkoutPage bodyPart={workoutBodyPart} />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
    }
  }

  return (
    <>
      {renderPage()}

      <nav className="bottom-nav">
        <button
          className={`nav-item ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => navigateTo('home')}
        >
          <span className="nav-icon">🏠</span>
          今天
        </button>
        <button
          className={`nav-item ${currentPage === 'workout' ? 'active' : ''}`}
          onClick={() => navigateTo('workout')}
        >
          <span className="nav-icon">🏋️</span>
          训练
        </button>
        <button
          className={`nav-item ${currentPage === 'history' ? 'active' : ''}`}
          onClick={() => navigateTo('history')}
        >
          <span className="nav-icon">📊</span>
          记录
        </button>
        <button
          className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
          onClick={() => navigateTo('settings')}
        >
          <span className="nav-icon">⚙️</span>
          设置
        </button>
      </nav>
    </>
  );
}

export default App;
