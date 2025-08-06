// src/components/ProfileSettings/ProfileDetails.js
import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import AvatarUploader from '../AvatarUploader';  // Existing uploader component

const ProfileDetails = () => {
  const { user, setUser } = useUser();
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    // TODO: call API to delete account
    console.log('Deleting account for', user.username);
    // After deletion, redirect or logout
  };

  const handleUploadSuccess = (newAvatarUrl) => {
    // Update context with new avatar URL
    setUser(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Profile Details</h2>

      {/* Avatar Uploader */}
      <div className="mb-6">
        <AvatarUploader
          currentUrl={user.avatarUrl}
          onUploadSuccess={handleUploadSuccess}
        />
      </div>

      <div className="space-y-2">
        <div>
          <span className="font-medium">Username:</span> {user.username}
        </div>
        <div>
          <span className="font-medium">Email:</span> {user.email}
        </div>
      </div>

      <div className="mt-6">
        {confirming ? (
          <div className="space-x-2">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Confirm Delete
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Delete Account
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileDetails;
