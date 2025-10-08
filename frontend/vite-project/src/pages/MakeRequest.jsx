import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert } from "react-bootstrap";

function MakeRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    reason: "",
    destination: "",
    startDate: "",
    endDate: "",
    type: "OVERNIGHT",
  });
  
  const [blackoutDates, setBlackoutDates] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch active blackout dates when the component loads to inform the user.
  useEffect(() => {
    const fetchBlackoutDates = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/users/blackout-dates",
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        setBlackoutDates(res.data);
      } catch (err) {
        console.error("Could not fetch blackout dates", err);
      }
    };
    if (user?.token) {
      fetchBlackoutDates();
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    const userStartDate = new Date(form.startDate);
    const userEndDate = new Date(form.endDate);
    
    // Client-side validation against blackout periods.
    for (const blackout of blackoutDates) {
      const blackoutStart = new Date(blackout.startDate);
      const blackoutEnd = new Date(blackout.endDate);
      
      // Check if the user's selected date range overlaps with any blackout period.
      if (userStartDate <= blackoutEnd && userEndDate >= blackoutStart) {
        setError(`Cannot submit request. It conflicts with a blackout period: "${blackout.reason}".`);
        return;
      }
    }
    
    if (userEndDate < userStartDate) {
      setError("End date cannot be before the start date.");
      return;
    }
    
    setIsLoading(true);
    try {
      await axios.post(
        "http://localhost:5000/api/requests",
        form,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      setSuccess("Request submitted successfully! Redirecting...");
      
      setTimeout(() => {
        navigate("/my-requests");
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: '700px' }}>
      <div className="card p-4 shadow-sm">
        <h2 className="mb-3">Submit a New Exeat Request</h2>
        <p className="text-muted mb-4">Please fill out the details below. All fields are required.</p>
        
        {blackoutDates.length > 0 && (
            <Alert variant="warning">
                <strong>Notice:</strong> Please be aware of the following restricted periods for exeat requests:
                <ul>
                    {blackoutDates.map(d => <li key={d.id}>{d.reason} ({new Date(d.startDate).toLocaleDateString()} - {new Date(d.endDate).toLocaleDateString()})</li>)}
                </ul>
            </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <div className="row g-3">
            <div className="col-md-6 form-floating mb-3">
              <select className="form-select" id="type" name="type" value={form.type} onChange={handleChange} required>
                <option value="OVERNIGHT">Overnight</option>
                <option value="SINGLE_DAY">Single Day</option>
                <option value="WEEKEND">Weekend</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
              <label htmlFor="type">Type of Exeat</label>
            </div>
            <div className="col-md-6 form-floating mb-3">
              <input type="text" className="form-control" id="destination" name="destination" placeholder="Destination" value={form.destination} onChange={handleChange} required />
              <label htmlFor="destination">Destination</label>
            </div>
            <div className="col-12 form-floating mb-3">
              <textarea className="form-control" id="reason" name="reason" placeholder="Reason for request" value={form.reason} onChange={handleChange} required style={{ height: '100px' }}></textarea>
              <label htmlFor="reason">Reason for Request (e.g., "Family event")</label>
            </div>
            <div className="col-md-6 form-floating mb-3">
              <input type="date" className="form-control" id="startDate" name="startDate" value={form.startDate} onChange={handleChange} required />
              <label htmlFor="startDate">Start Date</label>
            </div>
            <div className="col-md-6 form-floating mb-3">
              <input type="date" className="form-control" id="endDate" name="endDate" value={form.endDate} onChange={handleChange} required />
              <label htmlFor="endDate">End Date</label>
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary w-100 btn-lg mt-3" disabled={isLoading || success}>
            {isLoading ? "Submitting..." : (success ? "Submitted!" : "Submit Request")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MakeRequest;