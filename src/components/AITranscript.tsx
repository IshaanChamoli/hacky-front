import React from 'react';
import '../styles/AITranscript.css';

interface AITranscriptProps {
  transcript: string;
}

const AITranscript: React.FC<AITranscriptProps> = ({ transcript }) => {
  return (
    <aside className="ai-transcript">
      <h3>Transcript</h3>
      <div className="transcript-content">
        <div className="message">
          {transcript}
        </div>
      </div>
    </aside>
  );
};

export default AITranscript; 