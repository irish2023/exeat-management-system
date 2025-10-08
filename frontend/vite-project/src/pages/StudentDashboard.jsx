import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

// Note: The StatusCard component that was here has been temporarily removed for simplicity.
// If you want to add it back, it would be defined here.

function StudentDashboard() {
  const { user } = useAuth();
  const [latestRequest, setLatestRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLatestRequest = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get("http://localhost:5000/api/requests/my", {
          headers: { Authorization: `Bearer ${user.token}` },
          params: { limit: 1 }
        });
        if (res.data.length > 0) {
          setLatestRequest(res.data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch latest request", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (user) {
        fetchLatestRequest();
    }
  }, [user]);

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Welcome, {user?.name}</h2>
      
      {/* A placeholder for the status card can go here */}
      {/* For example: <StatusCard request={latestRequest} isLoading={isLoading} /> */}

      <div className="card shadow-sm p-4 text-center">
        <h4 className="card-title">What would you like to do?</h4>
        <div className="d-grid gap-3 d-sm-flex justify-content-center mt-3">
          <Link to="/make-request" className="btn btn-primary btn-lg flex-grow-1">
            + Request New Exeat
          </Link>
          <Link to="/my-requests" className="btn btn-outline-secondary btn-lg flex-grow-1">
            View My Request History
          </Link>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;