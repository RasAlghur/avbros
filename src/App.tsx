import React, { useState, useEffect } from "react";
// Import the improved CSS
import { format } from "date-fns"; // Add parseISO to imports
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

    // Check against environment variables
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

interface SpecialEvent {
  id: string;
  workerId: string;
  date: string; // ISO string
  event: string;
  note?: string;
}

export default function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [specialEvents, setSpecialEvents] = useState<SpecialEvent[]>([]);
  const [currentPage, setCurrentPage] = useState<"schedule" | "events">("schedule");

  useEffect(() => {
    const savedEvents = localStorage.getItem("specialEvents");
    if (savedEvents) {
      try {
        // Simply parse the events without modifying dates
        setSpecialEvents(JSON.parse(savedEvents));
      } catch (e) {
        console.error("Failed to parse saved events", e);
      }
    }
  }, []);

  // Save events to localStorage
  useEffect(() => {
    localStorage.setItem("specialEvents", JSON.stringify(specialEvents));
  }, [specialEvents]);


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
    { id: "B", name: "Adenle Iyewunmi" },
    { id: "C", name: "Adegbola Olamilekan" },
    { id: "D", name: "Bakare Toyosi" },
    { id: "E", name: "Dauda Hammed" },
    { id: "F", name: "Fatope Daniel" },
    { id: "G", name: "Oloyede Dare" },
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

  // Reference date: use a known date with a known rotation to establish the pattern
  // May 4, 2025 was when rotation index 0 was correct
  const referenceDate = new Date(2025, 4, 4); // May 4, 2025
  const referenceRotationIndex = 0; // rotation index on the reference date

  // Build schedule for Sundays and Mondays until Jan 4, 2026
  const generateWorkDays = () => {
    const endDate = new Date(2026, 0, 4);
    const workDays = [];

    // Calculate how many weeks have passed since the reference date
    // This will ensure the rotation is synchronized with actual dates
    const referenceSunday = startOfWeek(referenceDate);
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let currentWeek = startOfWeek(todayLocal);

    // Calculate how many weeks between reference week and current week
    const weeksDiff = Math.floor((currentWeek.getTime() - referenceSunday.getTime()) / (7 * 24 * 60 * 60 * 1000));

    // Calculate the current rotation index based on the reference index plus weeks passed
    // Use modulo to wrap around the schedule array
    let rotationIndex = (referenceRotationIndex + weeksDiff) % fullSchedule.length;
    // Handle negative indices (if today is before reference date)
    if (rotationIndex < 0) rotationIndex += fullSchedule.length;

    // Go back to the beginning of the year 2025 to populate past dates too
    const startDate = new Date(2025, 0, 5); // Jan 5, 2025 (first Sunday of 2025)
    currentWeek = startOfWeek(startDate);

    // Recalculate rotation index for this start date
    const weeksFromReferenceToStart = Math.floor((currentWeek.getTime() - referenceSunday.getTime()) / (7 * 24 * 60 * 60 * 1000));
    rotationIndex = (referenceRotationIndex + weeksFromReferenceToStart) % fullSchedule.length;
    if (rotationIndex < 0) rotationIndex += fullSchedule.length;

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
      rotationIndex = (rotationIndex + 1) % fullSchedule.length;
    }

    // Sort dates chronologically
    workDays.sort((a, b) => a.date.getTime() - b.date.getTime());
    return workDays;
  };

  const workDays = generateWorkDays();

  // Find today's index or closest future date
  const getDefaultIndex = () => {
    // Create today in local timezone
    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayTime = todayLocal.getTime();

    return Math.max(0, workDays.findIndex(d => {
      // Compare date components only (ignore time)
      const dDate = new Date(d.date.getFullYear(), d.date.getMonth(), d.date.getDate());
      return dDate.getTime() >= todayTime;
    }));
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

  const renderSpecialEventsPage = () => {
    // Get monday events
    const mondayEvents = [
      "TREASURES FROM GOD’S WORD",
      "Spiritual Gems",
      "Bible Reading",
      "APPLY YOURSELF TO THE FIELD MINISTRY",
      "APPLY YOURSELF TO THE FIELD MINISTRY: Starting a Conversation",
      "APPLY YOURSELF TO THE FIELD MINISTRY: Following Up",
      "APPLY YOURSELF TO THE FIELD MINISTRY: Explaining Your Beliefs",
      "LIVING AS CHRISTIANS",
      "LIVING AS CHRISTIANS: Presentation or Congregation Needs",
      "LIVING AS CHRISTIANS: Congregation Bible Study",
      "Chairman of the day",
      "Others"
    ];

    // Get sunday events
    const sundayEvents = [
      "Congregation Talk",
      "Chairman of the Day",
      "Congregation watch tower",
      "Others"
    ];

    // Add event handler
    const handleAddEvent = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);

      const newEvent: SpecialEvent = {
        id: Date.now().toString(),
        workerId: formData.get("worker") as string,
        date: formData.get("date") as string,
        event: formData.get("event") as string,
        note: formData.get("note") as string || undefined,
      };

      setSpecialEvents(prev => [...prev, newEvent]);
      e.currentTarget.reset();
    };

    // Delete event handler
    const handleDeleteEvent = (id: string) => {
      setSpecialEvents(prev => prev.filter(event => event.id !== id));
    };

    return (
      <div className="events-page">
        <h1 className="app-title">Special Event Registration</h1>

        <div className="events-container">
          <div className="events-form">
            <h2>Register Unavailability</h2>
            <form onSubmit={handleAddEvent}>
              <div className="form-group">
                <label>Worker:</label>
                <select name="worker" required>
                  {workers.map(worker => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  name="date"
                  required
                  onChange={(e) => {
                    const date = e.target.valueAsDate;
                    if (date) {
                      // Use local day of week (0 = Sunday, 1 = Monday)
                      const day = date.getDay();
                      if (day !== 0 && day !== 1) {
                        alert("Only Sundays and Mondays can have special events");
                        e.target.value = "";
                      }
                    }
                  }}
                />
              </div>

              <div className="form-group">
                <label>Event:</label>
                <select name="event" required>
                  <option value="">Select an event</option>
                  <option disabled>--- Sunday Events ---</option>
                  {sundayEvents.map(event => (
                    <option key={event} value={event}>{event}</option>
                  ))}
                  <option disabled>--- Monday Events ---</option>
                  {mondayEvents.map(event => (
                    <option key={event} value={event}>{event}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Note (if Others):</label>
                <input
                  type="text"
                  name="note"
                  placeholder="Additional details..."
                />
              </div>

              <button type="submit" className="submit-button">
                Register Event
              </button>
            </form>
          </div>

          <div className="events-list">
            <h2>Registered Events</h2>
            {specialEvents.map(event => {
              const worker = workers.find(w => w.id === event.workerId);
              return (
                <li key={event.id} className="event-item">
                  <div>
                    <strong>{worker?.name || "Unknown"}</strong>
                    {/* Replace parseISO with new Date() */}
                    <div>{format(new Date(event.date), "EEE, MMM d, yyyy")}</div>
                    <div>{event.event}</div>
                    {event.note && <div>Note: {event.note}</div>}
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setCurrentPage("schedule")}
          className="back-button"
        >
          Back to Schedule
        </button>
      </div>
    );
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
          <h1 className="app-title">
            {currentPage === "schedule"
              ? "Worker Rotation Schedule"
              : "Special Event Registration"}
          </h1>
          <div className="nav-buttons">
            {currentPage === "schedule" && (
              <button
                onClick={() => setCurrentPage("events")}
                className="events-button"
              >
                Special Events
              </button>
            )}
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>

        {currentPage === "schedule" ? (
          // Wrap schedule content in a fragment
          <>
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
          </>
        ) : (
          renderSpecialEventsPage()
        )}
      </div>
    </div>
  );
}