import React, { useEffect, useState } from 'react';
import '../styles/Profile.css'; 

const Profile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data', error);
      }
    }
  }, []);

  if (!user) {
    return (
      <div className="profile-page">
        <h2>User not logged in</h2>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <h1>👤 Profile Details</h1>
      <div className="profile-card">
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        {user.createdAt && (
          <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
