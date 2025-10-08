import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Form } from 'react-bootstrap';

// Helper component for colored status badges
const StatusBadge = ({ status }) => {
  const statusMap = {
    PENDING: { variant: 'warning', text: 'Pending' },
    APPROVED: { variant: 'success', text: 'Approved' },
    REJECTED: { variant: 'danger', text: 'Rejected' },
    CANCELED: { variant: 'secondary', text: 'Canceled' },
    AWAITING_INFO: { variant: 'info', text: 'Awaiting Info' },
  };
  const { variant, text } = statusMap[status] || { variant: 'light', text: 'Unknown' };
  return <span className={`badge bg-${variant}`}>{text}</span>;
};

// Component for the KPI cards
const StatCard = ({ title, value, variant }) => (
  <div className="col-md-4">
    <div className={`card text-white bg-${variant} mb-3 shadow-sm`}>
      <div className="card-body text-center">
        <h5 className="card-title">{value}</h5>
        <p className="card-text">{title}</p>
      </div>
    </div>
  </div>
);

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approvedToday: 0, flaggedEmergency: 0 });
  const [filter, setFilter] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionComment, setRejectionComment] = useState("");

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsRequest, setDetailsRequest] = useState(null);

  // --- Data Fetching Function ---
  const fetchData = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const statsPromise = axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const requestsPromise = axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/requests`, {
        headers: { Authorization: `Bearer ${user.token}` },
        params: { status: filter === 'ALL' ? '' : filter, search },
      });
      const [statsRes, requestsRes] = await Promise.all([statsPromise, requestsPromise]);
      setStats(statsRes.data);
      setRequests(requestsRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  // --- useEffect Hooks ---
  useEffect(() => {
    if (user?.token) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (user?.token) {
      fetchData();
    }
  }, [filter, search]);

  // --- Action Handlers ---
  const handleDecision = async (id, action, comment = '') => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/requests/${id}/decision`,
        { action, comment },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      fetchData();
    } catch (err) {
      console.error("Failed to update request", err);
      alert(err.response?.data?.error || 'Action failed.');
    }
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setRejectionComment("");
    setShowRejectModal(true);
  };
  const handleRejectSubmit = () => {
    if (!rejectionComment) {
      alert("A reason for rejection is required.");
      return;
    }
    handleDecision(selectedRequest.id, 'reject', rejectionComment);
    setShowRejectModal(false);
  };

  const openDetailsModal = (request) => {
    setDetailsRequest(request);
    setShowDetailsModal(true);
  };
  
  const handleExport = () => {
    const params = new URLSearchParams({
      status: filter === 'ALL' ? '' : filter,
      search: search,
      format: 'csv'
    }).toString();
    
    const url = `${import.meta.env.VITE_API_BASE_URL}/api/admin/requests?${params}`;
    
    fetch(url, {
        headers: { 'Authorization': `Bearer ${user.token}` }
    })
    .then(response => response.blob())
    .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `exeat-requests-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
    })
    .catch(e => console.error('Export failed:', e));
  };
  
  // --- JSX Render ---
  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">Admin Command Center</h2>

      <div className="row">
        <StatCard title="Pending Requests" value={stats.pending} variant="warning" />
        <StatCard title="Approved Today" value={stats.approvedToday} variant="success" />
        <StatCard title="Flagged Emergency" value={stats.flaggedEmergency} variant="danger" />
      </div>

      <div className="card shadow-sm mt-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <ul className="nav nav-pills">
              {["PENDING", "APPROVED", "REJECTED", "ALL"].map((status) => (
                <li className="nav-item" key={status}>
                  <button className={`nav-link ${filter === status ? "active" : ""}`} onClick={() => setFilter(status)}>
                    {status}
                  </button>
                </li>
              ))}
            </ul>
            {/* for search and export */}
            <div className="d-flex gap-2">
              <input type="text" className="form-control" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
              <button className="btn btn-outline-success" onClick={handleExport}>
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card shadow-sm mt-4">
        <div className="card-body">
          {loading ? ( <p>Loading requests...</p> ) : requests.length === 0 ? ( <p>No requests found for this filter.</p> ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Student</th>
                    <th>Reason</th>
                    <th>Dates</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.student?.name}</strong><br/>
                        <small className="text-muted">{r.student?.matricNo}</small>
                      </td>
                      <td>{r.reason}</td>
                      <td>
                        {new Date(r.startDate).toLocaleDateString()} -<br/>
                        {new Date(r.endDate).toLocaleDateString()}
                      </td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-outline-secondary btn-sm" onClick={() => openDetailsModal(r)}>Details</button>
                          {r.status === "PENDING" && (
                            <>
                              <button className="btn btn-success btn-sm" onClick={() => handleDecision(r.id, "approve")}>Approve</button>
                              <button className="btn btn-danger btn-sm" onClick={() => openRejectModal(r)}>Reject</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reason for Rejection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please provide a comment for rejecting the request from <strong>{selectedRequest?.student.name}</strong>.</p>
          <Form.Control as="textarea" rows={3} value={rejectionComment} onChange={e => setRejectionComment(e.target.value)} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleRejectSubmit}>Confirm Rejection</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Request Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsRequest && (
            <div>
              <h4>Student Information</h4>
              <p><strong>Name:</strong> {detailsRequest.student?.name}</p>
              <p><strong>Matric No:</strong> {detailsRequest.student?.matricNo}</p>
              <p><strong>Email:</strong> {detailsRequest.student?.email}</p>
              <hr />
              <h4>Exeat Information</h4>
              <p><strong>Reason:</strong> {detailsRequest.reason}</p>
              <p><strong>Destination:</strong> {detailsRequest.destination}</p>
              <p><strong>Type:</strong> <span className="badge bg-info">{detailsRequest.type}</span></p>
              <p><strong>Dates:</strong> {new Date(detailsRequest.startDate).toLocaleString()} to {new Date(detailsRequest.endDate).toLocaleString()}</p>
              <p><strong>Submitted At:</strong> {new Date(detailsRequest.createdAt).toLocaleString()}</p>
              <hr />
              <h4>Decision Information</h4>
              <p><strong>Status:</strong> <StatusBadge status={detailsRequest.status} /></p>
              {detailsRequest.actionedBy ? (
                <>
                  <p><strong>Actioned By:</strong> {detailsRequest.actionedBy.name}</p>
                  <p><strong>Actioned At:</strong> {new Date(detailsRequest.actionedAt).toLocaleString()}</p>
                  <p><strong>Admin Comment:</strong> {detailsRequest.adminComment || 'N/A'}</p>
                </>
              ) : (
                <p>This request has not been actioned yet.</p>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AdminDashboard;