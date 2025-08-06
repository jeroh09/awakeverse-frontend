// src/components/ProfileSettings/ConnectedApps.js
import React, { useState, useEffect } from 'react';

const mockServices = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'twitter', label: 'Twitter' },
  { key: 'google', label: 'Google' },
];

const ConnectedApps = () => {
  const [connected, setConnected] = useState({});

  useEffect(() => {
    // TODO: fetch connected services status from API
    // setConnected({ facebook: true, twitter: false, google: true });
  }, []);

  const handleConnect = (key) => {
    // TODO: trigger OAuth flow for service `key`
    console.log(`Connect to ${key}`);
  };
  const handleDisconnect = (key) => {
    // TODO: call API to disconnect service `key`
    setConnected(prev => ({ ...prev, [key]: false }));
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Connected Apps</h2>
      <div className="space-y-3">
        {mockServices.map(svc => (
          <div key={svc.key} className="flex items-center justify-between p-3 border rounded">
            <span>{svc.label}</span>
            {connected[svc.key]
              ? <button
                  onClick={() => handleDisconnect(svc.key)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded"
                >
                  Disconnect
                </button>
              : <button
                  onClick={() => handleConnect(svc.key)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded"
                >
                  Connect
                </button>
            }
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectedApps;