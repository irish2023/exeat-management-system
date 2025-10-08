import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Alert } from 'react-bootstrap';

function ProfilePage() {
  const { user, login } = useAuth();
  
  const [name, setName] = useState(user.name);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleNameChange = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await axios.put(
        'http://localhost:5000/api/users/profile/name',
        { name },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      // After a successful update, we must update the user object in the AuthContext
      // so the change is reflected immediately across the app (e.g., in the navbar).
      login({ user: res.data, token: user.token });
      setMessage('Name updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update name.');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/profile/password`,
        passwords,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setMessage('Password updated successfully!');
      setPasswords({ currentPassword: '', newPassword: '' }); // Clear fields on success
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password.');
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: '800px' }}>
      <h2>My Profile</h2>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="row mt-4 g-4">
        {/* Update Name Form */}
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Update Your Name</h5>
              <form onSubmit={handleNameChange}>
                <div className="form-floating mb-3">
                  <input type="text" className="form-control" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  <label htmlFor="name">Full Name</label>
                </div>
                <button type="submit" className="btn btn-primary">Save Name</button>
              </form>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Change Password</h5>
              <form onSubmit={handlePasswordChange}>
                <div className="form-floating mb-3">
                  <input type="password" className="form-control" id="currentPassword" value={passwords.currentPassword} onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})} required />
                  <label htmlFor="currentPassword">Current Password</label>
                </div>
                <div className="form-floating mb-3">
                  <input type="password" className="form-control" id="newPassword" value={passwords.newPassword} onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} required />
                  <label htmlFor="newPassword">New Password</label>
                </div>
                <button type="submit" className="btn btn-primary">Change Password</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;