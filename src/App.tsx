import React, { useState, useEffect } from 'react';
import AITranscript from './components/AITranscript';
import './styles/App.css';

interface LogEvent {
  type: string;
  response?: {
    output?: Array<{
      content?: Array<{
        type: string;
        transcript: string;
      }>;
    }>;
  };
}

function App() {
  const [transcript, setTranscript] = useState<string>('');

  const handleLogEvent = (event: LogEvent) => {
    if (event.type === 'response.done' && 
        event.response?.output?.[0]?.content?.[0]?.transcript) {
      setTranscript(event.response.output[0].content[0].transcript);
    }
  };

  // For demo purposes, set initial transcript
  useEffect(() => {
    setTranscript("Oh, hey there! What's on your mind?");
  }, []);

  useEffect(() => {
    console.log('App component mounted');
  }, []);

  return (
    <div className="app-container">
      <main className="main-content">
        <h1>Ishaan's Realtime Console</h1>
        {/* Your main content here */}
      </main>
      <AITranscript transcript={transcript} />
    </div>
  );
}

export default App; 