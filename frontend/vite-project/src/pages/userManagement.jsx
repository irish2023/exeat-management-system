import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Modal, Button, Form } from 'react-bootstrap';

function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '', email: '', password: '', matricNo: '', role: 'STUDENT',
  });
  const [createError, setCreateError] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/superadmin/users`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setUsers(res.data);
    } catch (err) {
      setError("Failed to fetch users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchData();
    }
  }, [user]);

  const openRoleModal = (userToEdit) => {
    setSelectedUser(userToEdit);
    setNewRole(userToEdit.role);
    setShowRoleModal(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/superadmin/users/${selectedUser.id}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setShowRoleModal(false);
      fetchData(); // Refresh list after update
    } catch (err) {
      alert("Failed to update role.");
    }
  };

  const handleFormChange = (e) => {
    setNewUserForm({ ...newUserForm, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async () => {
    setCreateError('');
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
      setCreateError("Name, Email, and Password are required.");
      return;
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/superadmin/users`,
        newUserForm,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setShowCreateModal(false);
      fetchData(); // Refresh list after creation
      setNewUserForm({ name: '', email: '', password: '', matricNo: '', role: 'STUDENT' });
    } catch (err) {
      setCreateError(err.response?.data?.error || "Failed to create user.");
    }
  };

  if (isLoading) return <p>Loading users...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>User Management</h2>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          + Create New User
        </Button>
      </div>
      
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Matric No</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>{u.matricNo || 'N/A'}</td>
                    <td><span className="badge bg-primary">{u.role}</span></td>
                    <td>
                      <Button variant="outline-primary" size="sm" onClick={() => openRoleModal(u)}>
                        Change Role
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change Role for {selectedUser?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>New Role</Form.Label>
            <Form.Select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="STUDENT">Student</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleRoleChange}>Save Changes</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {createError && <div className="alert alert-danger">{createError}</div>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control type="text" name="name" value={newUserForm.name} onChange={handleFormChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control type="email" name="email" value={newUserForm.email} onChange={handleFormChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" name="password" value={newUserForm.password} onChange={handleFormChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Matric Number (Optional)</Form.Label>
              <Form.Control type="text" name="matricNo" value={newUserForm.matricNo} onChange={handleFormChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Role</Form.Label>
              <Form.Select name="role" value={newUserForm.role} onChange={handleFormChange}>
                <option value="STUDENT">Student</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateUser}>Create User</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default UserManagement;