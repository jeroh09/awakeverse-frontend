import React from 'react';
import SessionListItem from './SessionListItem';

export default function SessionList({ sessions = [], onSelect }) {
  return (
    <ul className="session-list">
      {sessions.map(session => (
        <SessionListItem
          key={session.id}
          session={session}
          onClick={() => onSelect(session.id)}
        />
      ))}
      {sessions.length === 0 && (
        <li className="no-sessions">No conversations yet</li>
      )}
    </ul>
  );
}