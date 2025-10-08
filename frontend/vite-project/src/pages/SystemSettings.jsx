import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Button, Form, Card, ListGroup, Alert } from 'react-bootstrap';

function SystemSettings() {
  const { user } = useAuth();
  const [blackoutDates, setBlackoutDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    reason: '',
    startDate: '',
    endDate: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/superadmin/blackout-dates`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setBlackoutDates(res.data);
    } catch (err) {
      setError("Failed to fetch settings.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
        fetchData();
    }
  }, [user]);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError("End date cannot be before the start date.");
      return;
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/superadmin/blackout-dates`,
        form,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setForm({ reason: '', startDate: '', endDate: '' });
      fetchData(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create blackout period.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this blackout period?")) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_BASE_URL}/api/superadmin/blackout-dates/${id}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        fetchData(); // Refresh list
      } catch (err) {
        setError("Failed to delete blackout period.");
      }
    }
  };

  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">System Settings</h2>
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="row">
        <div className="col-md-5">
          <Card className="shadow-sm">
            <Card.Header as="h5">Add New Blackout Period</Card.Header>
            <Card.Body>
              <Form onSubmit={handleCreate}>
                <Form.Group className="mb-3">
                  <Form.Label>Reason</Form.Label>
                  <Form.Control type="text" name="reason" placeholder="e.g., Final Exams" value={form.reason} onChange={handleFormChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control type="date" name="startDate" value={form.startDate} onChange={handleFormChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control type="date" name="endDate" value={form.endDate} onChange={handleFormChange} required />
                </Form.Group>
                <Button variant="primary" type="submit">Add Period</Button>
                </Form>
              </Card.Body>
          </Card>
        </div>

        <div className="col-md-7">
          <Card className="shadow-sm">
            <Card.Header as="h5">Existing Blackout Periods</Card.Header>
            {isLoading ? <p className="p-3">Loading...</p> : (
              <ListGroup variant="flush">
                {blackoutDates.length === 0 ? <ListGroup.Item>No blackout periods defined.</ListGroup.Item> :
                  blackoutDates.map(date => (
                    <ListGroup.Item key={date.id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{date.reason}</strong>
                        <br />
                        <small className="text-muted">
                          {new Date(date.startDate).toLocaleDateString()} - {new Date(date.endDate).toLocaleDateString()}
                        </small>
                      </div>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(date.id)}>Delete</Button>
                    </ListGroup.Item>
                  ))
                }
              </ListGroup>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SystemSettings;