import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLogo from '../assets/trinity-logo.jpg';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      login(res.data);
      // After login, navigate to the main dashboard router, which will handle redirection.
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid d-flex vh-100 justify-content-center align-items-center bg-light" 
         style={{ 
           backgroundImage: `url(${AppLogo})`, 
           backgroundRepeat: 'no-repeat', 
           backgroundPosition: 'center', 
           backgroundSize: 'contain',
           backgroundBlendMode: 'overlay',
           backgroundColor: 'rgba(255, 255, 255, 0.85)'
         }}>
      <div className="card p-4 p-md-5 shadow-lg" style={{ maxWidth: '450px', width: '100%' }}>
        <div className="text-center mb-4">
          {/* <img src={AppLogo} alt="Logo" style={{ width: '80px' }} /> */}
          <h2 className="mt-2">Welcome Back</h2>
          <p className="text-muted">Sign in to manage your exeats</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="form-floating mb-3">
            <input 
              type="email" 
              className="form-control" 
              id="emailInput" 
              placeholder="name@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              required 
            />
            <label htmlFor="emailInput">Email address</label>
          </div>

          <div className="input-group mb-3">
            <span className="input-group-text"><FaLock /></span>
            <div className="form-floating flex-grow-1">
              <input 
                type={showPassword ? "text" : "password"}
                className="form-control" 
                id="passwordInput" 
                placeholder="Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                required
              />
              <label htmlFor="passwordInput">Password</label>
            </div>
            <button className="btn btn-outline-secondary" type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          
          <button className="btn btn-primary w-100 btn-lg" type="submit" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="mt-4 text-center">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;