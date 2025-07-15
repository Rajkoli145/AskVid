import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Video, Clock, User, Bot, Sparkles, ExternalLink, Zap, AlertCircle, MessageCircle, Trash2, MoreVertical, Plus, History } from 'lucide-react';
import { VideoData, ChatMessage } from '../types';
import { aiService } from '../services/aiService';
import ThemeToggle from './ThemeToggle';

interface ChatInterfaceProps {
  videoData: VideoData;
  onBack: () => void;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  videoId: string;
  videoTitle: string;
}

// Global storage for all video chat histories
const VIDEO_CHAT_STORAGE_KEY = 'askvid_video_chats';

class VideoChatStorage {
  static getAllVideoChats(): { [videoId: string]: ChatSession[] } {
    try {
      const stored = localStorage.getItem(VIDEO_CHAT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading video chats:', error);
      return {};
    }
  }

  static getVideoChats(videoId: string): ChatSession[] {
    const allChats = this.getAllVideoChats();
    const videoChats = allChats[videoId] || [];
    
    // Convert date strings back to Date objects
    return videoChats.map(session => ({
      ...session,
      createdAt: new Date(session.createdAt),
      messages: session.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }));
  }

  static saveVideoChats(videoId: string, sessions: ChatSession[]): void {
    try {
      const allChats = this.getAllVideoChats();
      allChats[videoId] = sessions;
      localStorage.setItem(VIDEO_CHAT_STORAGE_KEY, JSON.stringify(allChats));
    } catch (error) {
      console.error('Error saving video chats:', error);
    }
  }

  static deleteVideoChat(videoId: string, sessionId: string): void {
    const allChats = this.getAllVideoChats();
    if (allChats[videoId]) {
      allChats[videoId] = allChats[videoId].filter(session => session.id !== sessionId);
      if (allChats[videoId].length === 0) {
        delete allChats[videoId];
      }
      localStorage.setItem(VIDEO_CHAT_STORAGE_KEY, JSON.stringify(allChats));
    }
  }

  static clearVideoChats(videoId: string): void {
    const allChats = this.getAllVideoChats();
    delete allChats[videoId];
    localStorage.setItem(VIDEO_CHAT_STORAGE_KEY, JSON.stringify(allChats));
  }

  static getAllVideosWithChats(): Array<{ videoId: string; videoTitle: string; chatCount: number; lastActivity: Date }> {
    const allChats = this.getAllVideoChats();
    return Object.entries(allChats).map(([videoId, sessions]) => {
      const lastActivity = sessions.reduce((latest, session) => {
        const sessionDate = new Date(session.createdAt);
        return sessionDate > latest ? sessionDate : latest;
      }, new Date(0));

      return {
        videoId,
        videoTitle: sessions[0]?.videoTitle || 'Unknown Video',
        chatCount: sessions.length,
        lastActivity
      };
    }).sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ videoData, onBack }) => {
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [aiStatus, setAiStatus] = useState({ gemini: false });
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showAllVideosHistory, setShowAllVideosHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  // Initialize chat sessions for this video
  useEffect(() => {
    const existingSessions = VideoChatStorage.getVideoChats(videoData.id);
    
    if (existingSessions.length > 0) {
      setChatSessions(existingSessions);
      setCurrentSessionId(existingSessions[0].id);
    } else {
      // Create initial session for new video
      const initialSession: ChatSession = {
        id: 'default',
        title: 'Main Chat',
        messages: [
          {
            id: '1',
            type: 'assistant',
            content: `Hello! I've analyzed "${videoData.title}" and I'm ready to provide detailed, comprehensive answers to your questions. I can discuss the video content in depth and also engage in thorough conversations about any other topics you're curious about. What would you like to explore in detail?`,
            timestamp: new Date()
          }
        ],
        createdAt: new Date(),
        videoId: videoData.id,
        videoTitle: videoData.title
      };
      
      setChatSessions([initialSession]);
      setCurrentSessionId('default');
      VideoChatStorage.saveVideoChats(videoData.id, [initialSession]);
    }
  }, [videoData.id, videoData.title]);

  // Save sessions whenever they change
  useEffect(() => {
    if (chatSessions.length > 0) {
      VideoChatStorage.saveVideoChats(videoData.id, chatSessions);
    }
  }, [chatSessions, videoData.id]);

  const currentSession = chatSessions.find(session => session.id === currentSessionId) || chatSessions[0];
  const messages = currentSession?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    // Get suggested questions based on the video content
    setSuggestedQuestions(aiService.getSuggestedQuestions());
    // Check AI service status
    setAiStatus(aiService.getAIStatus());
    
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [videoData]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
      if (chatHistoryRef.current && !chatHistoryRef.current.contains(event.target as Node)) {
        setShowChatHistory(false);
        setShowAllVideosHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const updateCurrentSession = (updatedMessages: ChatMessage[]) => {
    setChatSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? { ...session, messages: updatedMessages }
        : session
    ));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    updateCurrentSession(updatedMessages);
    setInputMessage('');
    setIsTyping(true);
    setShowTypingIndicator(true);

    try {
      // Add a small delay to show typing indicator
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get AI response - supports both video and general questions
      const aiResponse = await aiService.generateDetailedResponse(userMessage.content);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        relevantTimestamp: aiResponse.timestamp
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      updateCurrentSession(finalMessages);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I apologize, but I encountered an error while processing your question. This might be due to API limits or connectivity issues. Please try asking again or rephrase your question.",
        timestamp: new Date()
      };
      const finalMessages = [...updatedMessages, errorMessage];
      updateCurrentSession(finalMessages);
    } finally {
      setIsTyping(false);
      setShowTypingIndicator(false);
      // Refocus input after response
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question);
    // Focus input after setting suggested question
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const handleNewChat = () => {
    const newSessionId = `chat-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: `Chat ${chatSessions.length + 1}`,
      messages: [
        {
          id: '1',
          type: 'assistant',
          content: `Hello! I'm ready to provide detailed, comprehensive answers about "${videoData.title}" or any other topics you'd like to explore in depth. What would you like to discuss?`,
          timestamp: new Date()
        }
      ],
      createdAt: new Date(),
      videoId: videoData.id,
      videoTitle: videoData.title
    };

    setChatSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSessionId);
    setShowChatHistory(false);
    
    // Clear AI service conversation history for new chat
    aiService.clearChatHistory();
    
    // Focus input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const handleSwitchChat = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setShowChatHistory(false);
    
    // Focus input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const handleDeleteChat = (sessionId: string) => {
    if (chatSessions.length <= 1) return; // Don't delete the last chat
    
    setChatSessions(prev => prev.filter(session => session.id !== sessionId));
    VideoChatStorage.deleteVideoChat(videoData.id, sessionId);
    
    // If we're deleting the current session, switch to the first available one
    if (sessionId === currentSessionId) {
      const remainingSessions = chatSessions.filter(session => session.id !== sessionId);
      setCurrentSessionId(remainingSessions[0].id);
    }
  };

  const handleClearCurrentChat = () => {
    const clearedMessages = [
      {
        id: '1',
        type: 'assistant' as const,
        content: `Hello! I'm ready to provide detailed, comprehensive answers about "${videoData.title}" or any other topics you'd like to explore in depth. What would you like to discuss?`,
        timestamp: new Date()
      }
    ];
    
    updateCurrentSession(clearedMessages);
    
    // Clear AI service conversation history
    aiService.clearChatHistory();
    
    // Close options menu
    setShowOptionsMenu(false);
    
    // Focus input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const handleClearAllVideoChats = () => {
    VideoChatStorage.clearVideoChats(videoData.id);
    
    // Create new initial session
    const initialSession: ChatSession = {
      id: 'default',
      title: 'Main Chat',
      messages: [
        {
          id: '1',
          type: 'assistant',
          content: `Hello! I've analyzed "${videoData.title}" and I'm ready to provide detailed, comprehensive answers to your questions. What would you like to explore in detail?`,
          timestamp: new Date()
        }
      ],
      createdAt: new Date(),
      videoId: videoData.id,
      videoTitle: videoData.title
    };
    
    setChatSessions([initialSession]);
    setCurrentSessionId('default');
    setShowOptionsMenu(false);
    
    // Clear AI service conversation history
    aiService.clearChatHistory();
  };

  const openVideoAtTimestamp = (timestamp: string) => {
    if (videoData.url && timestamp) {
      // Convert timestamp to seconds for YouTube URL
      const [minutes, seconds] = timestamp.split(':').map(Number);
      const totalSeconds = minutes * 60 + seconds;
      const youtubeUrl = `${videoData.url}&t=${totalSeconds}s`;
      window.open(youtubeUrl, '_blank');
    }
  };

  const getAIStatusIndicator = () => {
    if (aiStatus.gemini) {
      return (
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            AI Powered
          </span>
        </div>
      );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const allVideosWithChats = VideoChatStorage.getAllVideosWithChats();

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-4 py-4 shadow-sm transition-colors duration-300">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center space-x-4">
            <img
              src={videoData.thumbnail}
              alt={videoData.title}
              className="w-12 h-8 object-cover rounded-lg shadow-sm"
            />
            <div className="text-left max-w-md">
              <h1 className="font-semibold text-slate-900 dark:text-white truncate transition-colors duration-300">
                {videoData.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{videoData.duration}</span>
                </div>
                {videoData.channelTitle && (
                  <span className="truncate">{videoData.channelTitle}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {getAIStatusIndicator()}
            
            {/* Chat History Button */}
            <div className="relative" ref={chatHistoryRef}>
              <button
                onClick={() => setShowChatHistory(!showChatHistory)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Chat History"
              >
                <History className="w-5 h-5" />
              </button>
              
              {showChatHistory && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900 dark:text-white">This Video's Chats</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowAllVideosHistory(!showAllVideosHistory)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          All Videos
                        </button>
                        <button
                          onClick={handleNewChat}
                          className="flex items-center space-x-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>New</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {showAllVideosHistory ? (
                    <div className="py-2">
                      <div className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        All Videos with Chat History
                      </div>
                      {allVideosWithChats.map((video) => (
                        <div
                          key={video.videoId}
                          className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700"
                        >
                          <div className="font-medium text-slate-900 dark:text-white truncate text-sm">
                            {video.videoTitle}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {video.chatCount} chat{video.chatCount !== 1 ? 's' : ''} • Last: {video.lastActivity.toLocaleDateString()}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            ID: {video.videoId}
                          </div>
                        </div>
                      ))}
                      {allVideosWithChats.length === 0 && (
                        <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                          No other videos with chat history
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-2">
                      {chatSessions.map((session) => (
                        <div
                          key={session.id}
                          className={`flex items-center justify-between px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                            session.id === currentSessionId ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                          }`}
                        >
                          <button
                            onClick={() => handleSwitchChat(session.id)}
                            className="flex-1 text-left"
                          >
                            <div className="font-medium text-slate-900 dark:text-white truncate">
                              {session.title}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {session.messages.length - 1} messages • {session.createdAt.toLocaleDateString()}
                            </div>
                          </button>
                          
                          {chatSessions.length > 1 && (
                            <button
                              onClick={() => handleDeleteChat(session.id)}
                              className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Options Menu */}
            <div className="relative" ref={optionsMenuRef}>
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {showOptionsMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
                  <button
                    onClick={handleClearCurrentChat}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear current chat</span>
                  </button>
                  <button
                    onClick={handleClearAllVideoChats}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear all video chats</span>
                  </button>
                </div>
              )}
            </div>
            
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-3xl ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                    : 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white'
                }`}>
                  {message.type === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`rounded-2xl px-5 py-4 shadow-sm ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 transition-colors duration-300'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className={`text-xs ${
                      message.type === 'user' ? 'text-purple-200' : 'text-slate-500 dark:text-slate-400'
                    } transition-colors duration-300`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {message.relevantTimestamp && message.type === 'assistant' && (
                      <button
                        onClick={() => openVideoAtTimestamp(message.relevantTimestamp!)}
                        className="flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-full"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{message.relevantTimestamp}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Enhanced Typing Indicator */}
          {showTypingIndicator && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-3xl">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white flex items-center justify-center shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-white dark:bg-slate-700 rounded-2xl px-5 py-4 shadow-sm border border-slate-200 dark:border-slate-600 transition-colors duration-300">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">AI is thinking deeply...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Suggested Questions */}
          {messages.length === 1 && suggestedQuestions.length > 0 && (
            <div className="bg-white dark:bg-slate-700 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-600 transition-colors duration-300">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white transition-colors duration-300">
                  Suggested Questions for Detailed Discussion
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-left p-4 text-sm text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-600 rounded-xl transition-all border border-slate-200 dark:border-slate-600 hover:border-purple-200 dark:hover:border-purple-500 hover:shadow-sm"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Enhanced Input Form */}
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 px-4 py-4 transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex space-x-4">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask for detailed explanations about the video or any topic..."
                className="w-full px-5 py-4 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-300 shadow-sm"
                disabled={isTyping}
              />
              {isTyping && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          
          {/* Quick Actions */}
          <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-4">
              <span>Press Enter to send</span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>AI responses enabled</span>
              </span>
            </div>
            <div className="text-right">
              <span>{currentSession?.title} • {messages.length - 1} messages</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;