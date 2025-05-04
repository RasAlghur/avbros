import React, { useState, useEffect } from "react";
// Import the improved CSS
import "./App.css";

// Password authentication component
interface PasswordAuthProps {
  onAuthenticate: (isAuthenticated: boolean) => void;
}

const PasswordAuth: React.FC<PasswordAuthProps> = ({ onAuthenticate }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    
    // Check against environment variable
    const correctPassword = import.meta.env.VITE_SEV;
    
    if (password === correctPassword) {
      // Store authentication in session storage
      sessionStorage.setItem("isAuthenticated", "true");
      onAuthenticate(true);
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Password Required</h2>
        <p>Please enter the password to access the rotation schedule.</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="password-input"
              autoFocus
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="submit-button">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check if user is already authenticated (from session storage)
  useEffect(() => {
    const authStatus = sessionStorage.getItem("isAuthenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Date formatting and manipulation functions
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    };
    return date.toLocaleDateString('en-US', options);
  };
  
  const addDays = (date: string | number | Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };
  
  const isSunday = (date: Date) => date.getDay() === 0;
  const isMonday = (date: Date) => date.getDay() === 1;
  
  const startOfWeek = (date: string | number | Date) => {
    const result = new Date(date);
    const day = result.getDay();
    result.setDate(result.getDate() - day); // Go to Sunday
    return result;
  };
  
  const addWeeks = (date: string | number | Date, weeks: number) => {
    return addDays(date, weeks * 7);
  };

  // Define workers with full names
  const workers = [
    { id: "A", name: "Adenle Jeptha" },
    { id: "B", name: "Bakare Toyosi" },
    { id: "C", name: "Dauda Hammed" },
    { id: "D", name: "Fatope Daniel" },
    { id: "E", name: "Oloyede Dare" },
    { id: "F", name: "Orishile Gideon" },
    { id: "G", name: "Shomulu Kehinde" }
  ];

  // Helper function to convert IDs to full worker objects
  const getWorkersByIds = (idArray: any[]) => {
    return idArray.map(id => workers.find(worker => worker.id === id));
  };

  // Define the rotating schedule (7 teams rotating)
  const schedule = [
    { frontline: ["A", "B"], backline: ["C", "D", "E"], off: ["F", "G"] },
    { frontline: ["C", "D"], backline: ["E", "F", "G"], off: ["A", "B"] },
    { frontline: ["E", "F"], backline: ["G", "A", "B"], off: ["C", "D"] },
    { frontline: ["G", "A"], backline: ["B", "C", "D"], off: ["E", "F"] },
    { frontline: ["B", "C"], backline: ["D", "E", "F"], off: ["G", "A"] },
    { frontline: ["D", "E"], backline: ["F", "G", "A"], off: ["B", "C"] },
    { frontline: ["F", "G"], backline: ["A", "B", "C"], off: ["D", "E"] },
  ];

  // Convert the schedule to use full worker objects
  const fullSchedule = schedule.map(rotation => ({
    frontline: getWorkersByIds(rotation.frontline),
    backline: getWorkersByIds(rotation.backline),
    off: getWorkersByIds(rotation.off)
  }));

  // Starting date (today)
  const today = new Date();
  
  // Build schedule for Sundays and Mondays until Jan 4, 2026
  const generateWorkDays = () => {
    const endDate = new Date(2026, 0, 4);
    const workDays = [];
    
    let currentWeek = startOfWeek(today);
    let rotationIndex = 0;
    
    while (currentWeek <= endDate) {
      const sunday = new Date(currentWeek);
      const monday = addDays(sunday, 1);
      
      // Same rotation applies to both Sunday and Monday of the week
      const weekRotation = fullSchedule[rotationIndex % fullSchedule.length];
      
      workDays.push({ 
        date: sunday, 
        rotations: weekRotation,
        isWorkDay: true
      });
      
      workDays.push({ 
        date: monday, 
        rotations: weekRotation,
        isWorkDay: true
      });
      
      // Move to next week and next rotation
      currentWeek = addWeeks(currentWeek, 1);
      rotationIndex++;
    }
    
    // Sort dates chronologically
    workDays.sort((a, b) => a.date.getTime() - b.date.getTime());
    return workDays;
  };
  
  const workDays = generateWorkDays();
  
  // Find today's index or closest future date
  const getDefaultIndex = () => {
    const todayTime = today.getTime();
    return Math.max(0, workDays.findIndex(d => d.date.getTime() >= todayTime));
  };
  
  const [selectedIndex, setSelectedIndex] = useState(getDefaultIndex());
  const [displayMode, setDisplayMode] = useState("full"); // "full", "first", "last", "initials"

  const prev = () => setSelectedIndex(i => Math.max(0, i - 1));
  const next = () => setSelectedIndex(i => Math.min(workDays.length - 1, i + 1));
  
  const currentDay = workDays[selectedIndex];
  
  // Jump to today or closest future date
  const jumpToToday = () => {
    setSelectedIndex(getDefaultIndex());
  };
  
  // Jump to next week
  const nextWeek = () => {
    const currentDate = workDays[selectedIndex].date;
    const nextWeekDate = addWeeks(currentDate, 1);
    const nextWeekTime = nextWeekDate.getTime();
    
    const nextWeekIndex = workDays.findIndex(d => d.date.getTime() >= nextWeekTime);
    
    if (nextWeekIndex !== -1) {
      setSelectedIndex(nextWeekIndex);
    }
  };
  
  // Jump to previous week
  const prevWeek = () => {
    const currentDate = workDays[selectedIndex].date;
    const prevWeekDate = addWeeks(currentDate, -1);
    const prevWeekTime = prevWeekDate.getTime();
    
    // Find the closest date before or equal to the previous week
    let prevWeekIndex = -1;
    for (let i = workDays.length - 1; i >= 0; i--) {
      if (workDays[i].date.getTime() <= prevWeekTime) {
        prevWeekIndex = i;
        break;
      }
    }
    
    if (prevWeekIndex !== -1) {
      setSelectedIndex(prevWeekIndex);
    }
  };

  // Format worker names based on display mode
  const formatWorkerName = (worker: { id?: string; name: any; }) => {
    if (!worker) return "";
    
    const [firstName, lastName] = worker.name.split(" ");
    
    switch (displayMode) {
      case "first":
        return firstName;
      case "last":
        return lastName;
      case "initials":
        return `${firstName[0]}${lastName[0]}`;
      case "full":
      default:
        return worker.name;
    }
  };

  const toggleDisplayMode = () => {
    const modes = ["full", "first", "last", "initials"];
    const currentIndex = modes.indexOf(displayMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setDisplayMode(modes[nextIndex]);
  };

  const getDisplayModeLabel = () => {
    switch (displayMode) {
      case "first": return "First Names";
      case "last": return "Last Names";
      case "initials": return "Initials";
      case "full": return "Full Names";
      default: return "Full Names";
    }
  };

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
  };

  // If not authenticated, show the password auth component
  if (!isAuthenticated) {
    return <PasswordAuth onAuthenticate={setIsAuthenticated} />;
  }

  // Otherwise show the schedule app
  return (
    <div className="app-container">
      <div className="content-container">
        <div className="header-container">
          <h1 className="app-title">Worker Rotation Schedule</h1>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
        
        <div className="display-controls">
          <span>Display: </span>
          <button onClick={toggleDisplayMode} className="display-mode-button">
            {getDisplayModeLabel()}
          </button>
        </div>
        
        <div className="schedule-card">
          <div className="date-display">
            {formatDate(currentDay.date)}
          </div>
          
          <div className="teams-grid">
            <div className="team-section frontline-section">
              <h2 className="section-title frontline-title">Frontline</h2>
              <div className="team-members">
                {currentDay.rotations.frontline
                  .filter(worker => worker !== undefined)
                  .map(worker => (
                    <div key={worker.id} className="team-member frontline-member">
                      <span className="worker-id">{worker.id}</span>
                      <span className="worker-name">{formatWorkerName(worker)}</span>
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="team-section backline-section">
              <h2 className="section-title backline-title">Backline</h2>
              <div className="team-members">
                {currentDay.rotations.backline
                  .filter(worker => worker !== undefined)
                  .map(worker => (
                    <div key={worker.id} className="team-member backline-member">
                      <span className="worker-id">{worker.id}</span>
                      <span className="worker-name">{formatWorkerName(worker)}</span>
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="team-section off-section">
              <h2 className="section-title off-title">Off</h2>
              <div className="team-members">
                {currentDay.rotations.off
                  .filter(worker => worker !== undefined)
                  .map(worker => (
                    <div key={worker.id} className="team-member off-member">
                      <span className="worker-id">{worker.id}</span>
                      <span className="worker-name">{formatWorkerName(worker)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          
          <div className="schedule-note">
            {isSunday(currentDay.date) ? "Same team works on Monday" : 
             isMonday(currentDay.date) ? "Same team worked on Sunday" : ""}
          </div>
        </div>
        
        <div className="nav-container">
          <button 
            onClick={prevWeek} 
            className="week-button"
          >
            Previous Week
          </button>
          
          <div className="day-nav">
            <button 
              onClick={prev} 
              disabled={selectedIndex === 0} 
              className="day-button"
            >
              Previous Day
            </button>
            
            <button 
              onClick={jumpToToday} 
              className="today-button"
            >
              Today
            </button>
            
            <button 
              onClick={next} 
              disabled={selectedIndex === workDays.length - 1} 
              className="day-button"
            >
              Next Day
            </button>
          </div>
          
          <button 
            onClick={nextWeek} 
            className="week-button"
          >
            Next Week
          </button>
        </div>
        
        <div className="legend-card">
          <h2 className="legend-title">Worker Legend</h2>
          <div className="worker-legend">
            {workers.map(worker => (
              <div key={worker.id} className="worker-legend-item">
                <span className="worker-legend-id">{worker.id}</span>
                <span className="worker-legend-name">{worker.name}</span>
              </div>
            ))}
          </div>
          <div className="legend-info">
            <p>Work days are Sundays and Mondays only</p>
            <p>The same team works on both Sunday and Monday each week</p>
            <p>Teams rotate weekly following a 7-week cycle</p>
          </div>
        </div>
      </div>
    </div>
  );
}