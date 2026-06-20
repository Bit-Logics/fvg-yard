import React, { useState, useEffect, useRef } from 'react';
import './ChatWindow.css';

function ChatWindow({ socket }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
    };
    
    socket.on('chatMessage', handleNewMessage);
    
    return () => {
      socket.off('chatMessage', handleNewMessage);
    };
  }, [socket]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;
    socket.emit('sendChatMessage', inputValue);
    setInputValue('');
  };

  return (
    <>
      {/* Toggle Button */}
      <button 
        className={`chat-toggle-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Chat di Partita"
      >
        💬
      </button>

      {/* Chat Box */}
      <div className={`chat-window glass-panel ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          Chat di Partita
          <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
        </div>
        
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">Nessun messaggio. Scrivi per primo!</div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`chat-msg ${msg.playerId === socket.id ? 'my-msg' : ''}`}>
                <span className="chat-msg-author" style={{ color: msg.playerColor }}>
                  {msg.playerName}:
                </span>
                <span className="chat-msg-text">{msg.text}</span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form className="chat-input-area" onSubmit={sendMessage}>
          <input 
            type="text" 
            placeholder="Scrivi un messaggio..." 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            maxLength={200}
          />
          <button type="submit" disabled={!inputValue.trim()}>➤</button>
        </form>
      </div>
    </>
  );
}

export default ChatWindow;
