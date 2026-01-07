import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = 'http://10.14.57.32:3001';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
}

interface Conversation {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    isOnline: boolean;
  };
  lastMessage: Message;
  unreadCount: number;
}

interface ChatProps {
  token: string;
  currentUserId: string;
}

export function Chat({ token, currentUserId }: ChatProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io(`${API_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat');
    });

    newSocket.on('message:receive', (message: Message) => {
      setMessages((prev) => [message, ...prev]);
      // Update conversation list
      loadConversations();
    });

    newSocket.on('message:read', ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    });

    newSocket.on('typing:start', ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => new Set(prev).add(userId));
    });

    newSocket.on('typing:stop', ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    newSocket.on('friend:status', ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.user.id === userId
            ? { ...conv, user: { ...conv.user, isOnline } }
            : conv
        )
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  // Load conversations
  const loadConversations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  // Load messages for selected friend
  const loadMessages = async (friendId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/chat/messages/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMessages(data.reverse());
      
      // Mark messages as read
      await fetch(`${API_URL}/api/chat/messages/${friendId}/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedFriend) {
      loadMessages(selectedFriend);
    }
  }, [selectedFriend]);

  const sendMessage = () => {
    if (!socket || !selectedFriend || !messageInput.trim()) return;

    socket.emit('message:send', {
      receiverId: selectedFriend,
      content: messageInput.trim(),
    });

    setMessageInput('');
    
    // Stop typing indicator
    socket.emit('typing:stop', { receiverId: selectedFriend });
  };

  const handleTyping = () => {
    if (!socket || !selectedFriend) return;

    socket.emit('typing:start', { receiverId: selectedFriend });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { receiverId: selectedFriend });
    }, 1000);
  };

  const selectedConversation = conversations.find(
    (conv) => conv.user.id === selectedFriend
  );

  return (
    <div style={{ display: 'flex', height: '600px', border: '1px solid #ccc' }}>
      {/* Conversations List */}
      <div style={{ width: '300px', borderRight: '1px solid #ccc', overflow: 'auto' }}>
        <h3 style={{ padding: '1rem' }}>Messages</h3>
        {conversations.map((conv) => (
          <div
            key={conv.user.id}
            onClick={() => setSelectedFriend(conv.user.id)}
            style={{
              padding: '1rem',
              cursor: 'pointer',
              backgroundColor: selectedFriend === conv.user.id ? '#f0f0f0' : 'white',
              borderBottom: '1px solid #eee',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={conv.user.avatar || '/default-avatar.png'}
                  alt={conv.user.username}
                  style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                />
                {conv.user.isOnline && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '12px',
                      height: '12px',
                      backgroundColor: '#4caf50',
                      borderRadius: '50%',
                      border: '2px solid white',
                    }}
                  />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>
                  {conv.user.displayName || conv.user.username}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  {conv.lastMessage 
                    ? conv.lastMessage.content.substring(0, 30) + '...'
                    : 'No messages yet'}
                </div>
              </div>
              {conv.unreadCount > 0 && (
                <div
                  style={{
                    backgroundColor: '#2196f3',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                  }}
                >
                  {conv.unreadCount}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chat Window */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedFriend ? (
          <>
            {/* Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
              <div style={{ fontWeight: 'bold' }}>
                {selectedConversation?.user.displayName || 
                 selectedConversation?.user.username}
              </div>
              {selectedConversation?.user.isOnline && (
                <div style={{ fontSize: '0.875rem', color: '#4caf50' }}>Online</div>
              )}
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column-reverse',
              }}
            >
              {typingUsers.has(selectedFriend) && (
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                  Typing...
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent:
                      msg.senderId === currentUserId ? 'flex-end' : 'flex-start',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '0.5rem 1rem',
                      borderRadius: '1rem',
                      backgroundColor:
                        msg.senderId === currentUserId ? '#2196f3' : '#f0f0f0',
                      color: msg.senderId === currentUserId ? 'white' : 'black',
                    }}
                  >
                    <div>{msg.content}</div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        opacity: 0.7,
                        marginTop: '0.25rem',
                      }}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString()}
                      {msg.senderId === currentUserId && msg.isRead && ' ✓✓'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: '1rem', borderTop: '1px solid #ccc' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '0.25rem',
                  }}
                />
                <button
                  onClick={sendMessage}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
            }}
          >
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
