import React from 'react';

const BackButton = ({ onClick }) => {
    return (
        <button className="back-button" onClick={onClick}>
            Return to Awakeverse
        </button>
    );
};

export default BackButton;