import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  BrainCircuit,
  FileText,
  LayoutDashboard,
  LogOut,
  Upload,
  Trash2,
  Target,
  MessageSquareText,
  ArrowLeft,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import api from "./services/api";
import { AuthProvider, useAuth } from "./context/AuthContext";

function getError(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-icon"><BrainCircuit size={23} /></span>
        Career<span>AI</span>
      </Link>

      <nav>
        <Link to="/" className="nav-link">
          <LayoutDashboard size={17} /> Dashboard
        </Link>
        <Link to="/upload" className="nav-link">
          <Upload size={17} /> Upload Resume
        </Link>
      </nav>

      <div className="nav-user">
        <span>{user?.name || user?.email || "User"}</span>
        <button className="icon-button" onClick={logout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

function AuthLayout({ children, title, subtitle }) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/login" className="brand auth-brand">
          <span className="brand-icon"><BrainCircuit size={23} /></span>
          Career<span>AI</span>
        </Link>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
      </section>
    </main>
  );
}

function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your CareerAI account">
      <form onSubmit={handleSubmit} className="form">
        <label>Email address</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="error-message">{error}</p>}

        <button className="primary-button full-button" disabled={loading}>
          {loading ? <LoaderCircle className="spin" size={18} /> : "Login"}
        </button>
      </form>

      <p className="auth-switch">
        Don't have an account? <Link to="/register">Create account</Link>
      </p>
    </AuthLayout>
  );
}

function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(name, email, password);
      navigate("/");
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Start improving your resume with AI">
      <form onSubmit={handleSubmit} className="form">
        <label>Full name</label>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label>Email address</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        {error && <p className="error-message">{error}</p>}

        <button className="primary-button full-button" disabled={loading}>
          {loading ? <LoaderCircle className="spin" size={18} /> : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        Already registered? <Link to="/login">Login</Link>
      </p>
    </AuthLayout>
  );
}

function Dashboard() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadResumes = async () => {
    try {
      setError("");
      const response = await api.get("/resumes");
      const data = response.data;
      setResumes(Array.isArray(data) ? data : data.resumes || []);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const deleteResume = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;

    try {
      await api.delete(`/resumes/${id}`);
      setResumes((current) => current.filter((resume) => resume._id !== id));
    } catch (err) {
      setError(getError(err));
    }
  };

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>Dashboard</h1>
          <p className="muted">Analyze your resume and get closer to your dream job.</p>
        </div>
        <Link to="/upload" className="primary-button">
          <Upload size={18} /> Upload Resume
        </Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <FileText size={22} />
          <p>Total resumes</p>
          <h2>{resumes.length}</h2>
        </div>
        <div className="stat-card">
          <Target size={22} />
          <p>Average resume score</p>
          <h2>
            {resumes.length
              ? Math.round(
                  resumes.reduce((sum, item) => sum + (item.score || 0), 0) /
                    resumes.length
                )
              : 0}
            <small>/100</small>
          </h2>
        </div>
        <div className="stat-card">
          <BrainCircuit size={22} />
          <p>AI tools</p>
          <h2>2</h2>
        </div>
      </div>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <h2>Your resumes</h2>
            <p className="muted">Manage and analyze your uploaded resumes.</p>
          </div>
        </div>

        {loading ? (
          <div className="center-state"><LoaderCircle className="spin" /></div>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : resumes.length === 0 ? (
          <div className="empty-state">
            <FileText size={38} />
            <h3>No resumes uploaded yet</h3>
            <p className="muted">Upload your first PDF resume to begin.</p>
            <Link to="/upload" className="primary-button">Upload Resume</Link>
          </div>
        ) : (
          <div className="resume-list">
            {resumes.map((resume) => (
              <div className="resume-row" key={resume._id}>
                <div className="resume-file-icon"><FileText size={22} /></div>
                <div className="resume-info">
                  <h3>{resume.originalName || "Resume.pdf"}</h3>
                  <p className="muted">
                    {resume.skills?.length || 0} skills detected
                  </p>
                </div>
                <div className="score-pill">{resume.score ?? 0}/100</div>
                <Link to={`/resumes/${resume._id}`} className="secondary-button">
                  View
                </Link>
                <button
                  className="icon-button danger"
                  onClick={() => deleteResume(resume._id)}
                  title="Delete resume"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function UploadPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Please select a PDF resume.");
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const resume = response.data.resume || response.data;
      navigate(`/resumes/${resume._id || resume.id}`);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page narrow-page">
      <Link to="/" className="back-link"><ArrowLeft size={17} /> Back to dashboard</Link>

      <div className="page-heading">
        <div>
          <p className="eyebrow">RESUME ANALYSIS</p>
          <h1>Upload your resume</h1>
          <p className="muted">Upload a PDF file to analyze your skills and resume score.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="section-card upload-card">
        <label className="drop-zone">
          <Upload size={38} />
          <h3>{file ? file.name : "Choose your resume"}</h3>
          <p className="muted">
            {file ? "PDF selected. You can choose another file." : "PDF format only · Maximum file size 5 MB"}
          </p>
          <span className="secondary-button">Browse files</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            hidden
          />
        </label>

        {error && <p className="error-message">{error}</p>}

        <button className="primary-button full-button" disabled={loading || !file}>
          {loading ? <><LoaderCircle className="spin" size={18} /> Uploading...</> : "Upload and analyze"}
        </button>
      </form>
    </div>
  );
}

function ScoreCircle({ score = 0 }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));

  return (
    <div
      className="score-circle"
      style={{ "--score": `${safeScore * 3.6}deg` }}
    >
      <div>
        <strong>{safeScore}</strong>
        <span>/100</span>
      </div>
    </div>
  );
}

function ResumeDetails() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [match, setMatch] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResume = async () => {
      try {
        const response = await api.get(`/resumes/${id}`);
        setResume(response.data.resume || response.data);
      } catch (err) {
        setError(getError(err));
      } finally {
        setLoading(false);
      }
    };

    loadResume();
  }, [id]);

  const getFeedback = async () => {
    setActionLoading("feedback");
    setError("");

    try {
      const response = await api.post(`/resumes/${id}/feedback`);
      setFeedback(response.data.feedback || response.data);
    } catch (err) {
      setError(getError(err));
    } finally {
      setActionLoading("");
    }
  };

  const matchJob = async (event) => {
    event.preventDefault();
    setActionLoading("match");
    setError("");
    setMatch(null);

    try {
      const response = await api.post(`/resumes/${id}/match`, {
        jobDescription,
      });
      setMatch(response.data.match || response.data);
    } catch (err) {
      setError(getError(err));
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return <div className="center-state"><LoaderCircle className="spin" /></div>;
  }

  if (error && !resume) {
    return <div className="page"><p className="error-message">{error}</p></div>;
  }

  if (!resume) return <div className="page">Resume not found.</div>;

  const renderList = (items) => {
    if (!Array.isArray(items)) return null;
    return items.map((item, index) => (
      <li key={index}>{typeof item === "string" ? item : JSON.stringify(item)}</li>
    ));
  };

  return (
    <div className="page">
      <Link to="/" className="back-link"><ArrowLeft size={17} /> Back to dashboard</Link>

      <div className="page-heading">
        <div>
          <p className="eyebrow">RESUME REPORT</p>
          <h1>{resume.originalName || "Resume details"}</h1>
          <p className="muted">Review your resume analysis and AI recommendations.</p>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="details-grid">
        <section className="section-card score-card">
          <h2>Resume score</h2>
          <ScoreCircle score={resume.score} />
          <p className="muted">Your current resume score</p>
        </section>

        <section className="section-card">
          <h2>Detected skills</h2>
          {resume.skills?.length ? (
            <div className="skill-list">
              {resume.skills.map((skill, index) => (
                <span className="skill-tag" key={index}>{skill}</span>
              ))}
            </div>
          ) : (
            <p className="muted">No skills detected.</p>
          )}
        </section>
      </div>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <h2><MessageSquareText size={20} /> AI resume feedback</h2>
            <p className="muted">Get strengths, weaknesses and improvement suggestions.</p>
          </div>
          <button
            className="primary-button"
            onClick={getFeedback}
            disabled={!!actionLoading}
          >
            {actionLoading === "feedback" ? <LoaderCircle className="spin" size={18} /> : "Generate feedback"}
          </button>
        </div>

        {feedback && (
          <div className="feedback-grid">
            {[
              ["Strengths", feedback.strengths],
              ["Weaknesses", feedback.weaknesses],
              ["Missing sections", feedback.missingSections || feedback.missing_sections],
              ["Suggestions", feedback.suggestions],
            ].map(([heading, items]) => (
              <div className="feedback-item" key={heading}>
                <h3>{heading}</h3>
                {Array.isArray(items) && items.length ? (
                  <ul>{renderList(items)}</ul>
                ) : (
                  <p className="muted">No items returned.</p>
                )}
              </div>
            ))}
            {feedback.feedbackScore !== undefined && (
              <p className="muted">Feedback score: {feedback.feedbackScore}</p>
            )}
          </div>
        )}
      </section>

      <section className="section-card">
        <h2><Target size={20} /> Job description matching</h2>
        <p className="muted">Paste a job description to compare it with your resume.</p>

        <form onSubmit={matchJob} className="form">
          <textarea
            rows="7"
            placeholder="Paste the job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            required
          />
          <button
            className="primary-button"
            disabled={!!actionLoading || !jobDescription.trim()}
          >
            {actionLoading === "match" ? <LoaderCircle className="spin" size={18} /> : "Analyze job match"}
          </button>
        </form>

        {match && (
          <div className="match-result">
            <h3>Job match result</h3>
            {match.matchScore !== undefined || match.score !== undefined ? (
              <h2>{match.matchScore ?? match.score}% match</h2>
            ) : null}
            {match.verdict && <p>{match.verdict}</p>}
            {match.matchedSkills && (
              <>
                <h4>Matched skills</h4>
                <div className="skill-list">
                  {match.matchedSkills.map((skill, index) => (
                    <span className="skill-tag" key={index}>{skill}</span>
                  ))}
                </div>
              </>
            )}
            {(match.missingSkills || match.missing_skills) && (
              <>
                <h4>Missing skills</h4>
                <div className="skill-list">
                  {(match.missingSkills || match.missing_skills).map((skill, index) => (
                    <span className="skill-tag missing-tag" key={index}>{skill}</span>
                  ))}
                </div>
              </>
            )}
            {match.similarity !== undefined && (
              <p className="muted">Similarity: {match.similarity}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
        <Route path="/resumes/:id" element={<ProtectedRoute><ResumeDetails /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}