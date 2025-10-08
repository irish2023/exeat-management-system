import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import AppLogo from '../assets/trinity-logo.jpg';
//import AppLogo from '../assets/tu-logo.jpg';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // State for the form inputs
  const [form, setForm] = useState({
    name: "",
    email: "",
    matricNo: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State for password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handles changes for name, email, matricNo, and password fields
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Handles the form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register`, form);
      // Automatically log the user in after successful registration
      login(res.data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
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
           backgroundColor: 'rgba(255, 255, 255, 0.65)'
         }}>
      <div className="card p-4 p-md-5 shadow-lg" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="text-center mt-4">
           <img src={AppLogo} alt="Trinity University Logo" style={{ width: '180px', marginTop: '5rem' }} />
          <h2 className="mt-2">Create Your Account</h2>
          <p className="text-muted">Get started with  Exeat</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger">{error}</div>}
          
          <div className="form-floating mb-3">
            <input type="text" className="form-control" id="name" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
            <label htmlFor="name">Full Name</label>
          </div>
          <div className="form-floating mb-3">
            <input type="email" className="form-control" id="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <label htmlFor="email">Email Address</label>
          </div>
          <div className="form-floating mb-3">
            <input type="text" className="form-control" id="matricNo" name="matricNo" placeholder="Matriculation Number" value={form.matricNo} onChange={handleChange} required />
            <label htmlFor="matricNo">Matriculation Number</label>
          </div>

          <div className="input-group mb-3">
            <span className="input-group-text"><FaLock /></span>
            <div className="form-floating flex-grow-1">
              <input type={showPassword ? "text" : "password"} className="form-control" id="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
              <label htmlFor="password">Password</label>
            </div>
            <button className="btn btn-outline-secondary" type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="input-group mb-3">
            <span className="input-group-text"><FaLock /></span>
            <div className="form-floating flex-grow-1">
              <input type={showConfirmPassword ? "text" : "password"} className="form-control" id="confirmPassword" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              <label htmlFor="confirmPassword">Confirm Password</label>
            </div>
            <button className="btn btn-outline-secondary" type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          
          <button className="btn btn-primary w-100 btn-lg" type="submit" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-center">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;