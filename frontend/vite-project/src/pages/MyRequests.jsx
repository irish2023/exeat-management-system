import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

// A dedicated component for displaying a single request card.
// Keeping this as a separate component improves readability.
const RequestCard = ({ request, onCancel }) => {
  const getStatusInfo = (status) => {
    const map = {
      APPROVED: { variant: 'success', text: 'Approved' },
      REJECTED: { variant: 'danger', text: 'Rejected' },
      PENDING: { variant: 'warning', text: 'Pending' },
      AWAITING_INFO: { variant: 'info', text: 'Awaiting Info' },
      CANCELED: { variant: 'secondary', text: 'Canceled' },
    };
    return map[status] || { variant: 'light', text: 'Unknown' };
  };

  const { variant, text } = getStatusInfo(request.status);

  return (
    <div className="card mb-3 shadow-sm">
      <div className="card-header d-flex justify-content-between align-items-center bg-light">
        <h5 className="mb-0">{request.reason}</h5>
        <span className={`badge text-bg-${variant}`}>{text}</span>
      </div>
      <div className="card-body">
        <p className="card-text mb-1"><strong>Destination:</strong> {request.destination || 'N/A'}</p>
        <p className="card-text">
          <strong>From:</strong> {new Date(request.startDate).toLocaleDateString()}
          <strong className="ms-3">To:</strong> {new Date(request.endDate).toLocaleDateString()}
        </p>
        {request.adminComment && (
          <p className="card-text fst-italic bg-light p-2 rounded border-start border-3">
            <strong>Admin Comment:</strong> "{request.adminComment}"
          </p>
        )}
      </div>
      {request.status === 'PENDING' && (
        <div className="card-footer text-end">
          <button className="btn btn-outline-danger btn-sm" onClick={() => onCancel(request.id)}>
            Cancel Request
          </button>
        </div>
      )}
    </div>
  );
};

function MyRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('requests');
  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchData = async () => {
    if (!user?.token) return;
    setIsLoading(true);
    setError('');
    try {
      const reqPromise = axios.get("http://localhost:5000/api/requests/my", { headers: { Authorization: `Bearer ${user.token}` } });
      const notifPromise = axios.get("http://localhost:5000/api/requests/notifications", { headers: { Authorization: `Bearer ${user.token}` } });
      const [reqRes, notifRes] = await Promise.all([reqPromise, notifPromise]);
      setRequests(reqRes.data);
      setNotifications(notifRes.data);
    } catch (err) {
      setError("Failed to load your data. Please try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleCancelRequest = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/requests/${id}/cancel`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchData(); // Refresh all data
    } catch (err) {
      alert(err.response?.data?.error || "Failed to cancel request.");
    }
  };
  
  const handleMarkAllRead = async () => {
    try {
      await axios.post(`http://localhost:5000/api/requests/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchData(); // Refresh all data
    } catch (err) {
      alert("Failed to mark notifications as read.");
    }
  };

  if (isLoading) return <div className="text-center p-5">Loading your data...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
            Request History
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            Notifications {unreadCount > 0 && <span className="badge rounded-pill bg-danger ms-2">{unreadCount}</span>}
          </button>
        </li>
      </ul>

      {activeTab === 'requests' && (
        <div>
          {requests.length === 0 ? (
            <div className="text-center p-5 card shadow-sm">
              <h4>You haven't made any requests yet.</h4>
              <Link to="/make-request" className="btn btn-primary mt-3 mx-auto" style={{maxWidth: '250px'}}>Make Your First Request</Link>
            </div>
          ) : (
            requests.map((r) => <RequestCard key={r.id} request={r} onCancel={handleCancelRequest} />)
          )}
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Your Notifications</h5>
            {unreadCount > 0 && <button className="btn btn-sm btn-primary" onClick={handleMarkAllRead}>Mark All as Read</button>}
          </div>
          <div className="list-group list-group-flush">
            {notifications.length === 0 ? (
              <p className="p-3 text-center text-muted">You have no notifications.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`list-group-item ${!n.read ? 'fw-bold' : 'text-muted'}`}>
                  <p className="mb-1">{n.message}</p>
                  <small>{new Date(n.createdAt).toLocaleString()}</small>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MyRequests;