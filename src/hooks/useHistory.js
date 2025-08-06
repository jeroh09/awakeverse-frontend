// src/hooks/useHistory.js

/**
 * Persistent storage for chat sessions per character.
 * Provides helpers to save, retrieve, clear, and archive sessions.
 */
export default function useHistory() {
  /**
   * Persist an array of session objects for a character.
   * @param {string} character
   * @param {Array} sessions
   */
  const saveSessions = (character, sessions) => {
    localStorage.setItem(`history_${character}`, JSON.stringify(sessions));
  };

  /**
   * Retrieve the array of session objects for a character.
   * @param {string} character
   * @returns {Array}
   */
  const getSessions = (character) => {
    return JSON.parse(localStorage.getItem(`history_${character}`) || '[]');
  };

  /**
   * Clear the messages of a specific session (keeps the session open but empty).
   * @param {string} character
   * @param {string} sessionId
   */
  const clearSession = (character, sessionId) => {
    const sessions = getSessions(character);
    const updated = sessions.map(s =>
      s.id === sessionId
        ? { ...s, messages: [], started: Date.now() }
        : s
    );
    saveSessions(character, updated);
  };

  /**
   * Archive (remove) a session from active history.
   * @param {string} character
   * @param {string} sessionId
   */
  const archiveSession = (character, sessionId) => {
    const sessions = getSessions(character);
    const updated = sessions.filter(s => s.id !== sessionId);
    saveSessions(character, updated);
  };

  return { saveSessions, getSessions, clearSession, archiveSession };
}
