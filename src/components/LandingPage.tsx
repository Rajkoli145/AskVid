import React, { useState } from 'react';
import { Play, MessageCircle, Zap, Clock, ArrowRight, Youtube, ExternalLink, History, Video, Trash2, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface LandingPageProps {
  onVideoSubmit: (videoUrl: string) => void;
}

// Import the same storage class used in ChatInterface
const VIDEO_CHAT_STORAGE_KEY = 'askvid_video_chats';
const GEMINI_API_KEY_STORAGE = 'askvid_gemini_api_key';

interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  createdAt: Date;
  videoId: string;
  videoTitle: string;
}

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

  static getAllVideosWithChats(): Array<{ 
    videoId: string; 
    videoTitle: string; 
    chatCount: number; 
    lastActivity: Date;
    totalMessages: number;
    sessions: ChatSession[];
  }> {
    const allChats = this.getAllVideoChats();
    return Object.entries(allChats).map(([videoId, sessions]) => {
      const parsedSessions = sessions.map(session => ({
        ...session,
        createdAt: new Date(session.createdAt)
      }));

      const lastActivity = parsedSessions.reduce((latest, session) => {
        return session.createdAt > latest ? session.createdAt : latest;
      }, new Date(0));

      const totalMessages = parsedSessions.reduce((total, session) => {
        return total + (session.messages.length - 1); // Subtract 1 for initial AI message
      }, 0);

      return {
        videoId,
        videoTitle: sessions[0]?.videoTitle || 'Unknown Video',
        chatCount: sessions.length,
        lastActivity,
        totalMessages,
        sessions: parsedSessions
      };
    }).sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  static clearVideoChats(videoId: string): void {
    const allChats = this.getAllVideoChats();
    delete allChats[videoId];
    localStorage.setItem(VIDEO_CHAT_STORAGE_KEY, JSON.stringify(allChats));
  }

  static clearAllChats(): void {
    localStorage.removeItem(VIDEO_CHAT_STORAGE_KEY);
  }
}

class GeminiAPIStorage {
  static getAPIKey(): string {
    try {
      return localStorage.getItem(GEMINI_API_KEY_STORAGE) || '';
    } catch (error) {
      console.error('Error loading Gemini API key:', error);
      return '';
    }
  }

  static saveAPIKey(apiKey: string): void {
    try {
      if (apiKey.trim()) {
        localStorage.setItem(GEMINI_API_KEY_STORAGE, apiKey.trim());
        // Update the environment variable for immediate use
        (window as any).__GEMINI_API_KEY__ = apiKey.trim();
      } else {
        localStorage.removeItem(GEMINI_API_KEY_STORAGE);
        (window as any).__GEMINI_API_KEY__ = '';
      }
    } catch (error) {
      console.error('Error saving Gemini API key:', error);
    }
  }

  static clearAPIKey(): void {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE);
    (window as any).__GEMINI_API_KEY__ = '';
  }
}

const LandingPage: React.FC<LandingPageProps> = ({ onVideoSubmit }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [videosWithChats, setVideosWithChats] = useState(VideoChatStorage.getAllVideosWithChats());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onVideoSubmit(videoUrl);
  };

  const handleVideoSelect = (videoId: string) => {
    // Create a YouTube URL from the video ID for consistency
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    setShowHistory(false);
    onVideoSubmit(youtubeUrl);
  };

  const handleDeleteVideoHistory = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    VideoChatStorage.clearVideoChats(videoId);
    setVideosWithChats(VideoChatStorage.getAllVideosWithChats());
  };

  const handleClearAllHistory = () => {
    if (confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      VideoChatStorage.clearAllChats();
      setVideosWithChats([]);
    }
  };

  const refreshHistory = () => {
    setVideosWithChats(VideoChatStorage.getAllVideosWithChats());
  };

  const features = [
    {
      icon: <MessageCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
      title: "Interactive Q&A",
      description: "Ask any question about the video content and get instant, accurate answers."
    },
    {
      icon: <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
      title: "AI-Powered Transcription",
      description: "Advanced AI analyzes video content to provide contextual responses."
    },
    {
      icon: <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />,
      title: "Save Time",
      description: "Skip scrubbing through long videos. Get answers in seconds, not minutes."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">AskVid</span>
            </div>
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex space-x-8">
                <a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Features</a>
                <a href="#how-it-works" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">How it Works</a>
                <a href="#demo" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Demo</a>
              </nav>
              
              {/* History Button */}
              <button
                onClick={() => {
                  refreshHistory();
                  setShowHistory(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="View Chat History"
              >
                <History className="w-5 h-5" />
                <span className="hidden sm:inline">History</span>
                {videosWithChats.length > 0 && (
                  <span className="bg-purple-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {videosWithChats.length}
                  </span>
                )}
              </button>
              
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden transition-colors duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-3">
                <History className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Chat History</h2>
                <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full text-sm">
                  {videosWithChats.length} video{videosWithChats.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {videosWithChats.length > 0 && (
                  <button
                    onClick={handleClearAllHistory}
                    className="flex items-center space-x-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All</span>
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {videosWithChats.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Chat History Yet</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Start analyzing videos to build your chat history. All your conversations will be saved here.
                  </p>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                  >
                    Analyze Your First Video
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {videosWithChats.map((video) => (
                    <div
                      key={video.videoId}
                      className="group bg-slate-50 dark:bg-slate-700 rounded-xl p-4 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all duration-200 cursor-pointer border border-slate-200 dark:border-slate-600 hover:border-purple-200 dark:hover:border-purple-500 hover:shadow-md"
                      onClick={() => handleVideoSelect(video.videoId)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                            {video.videoTitle}
                          </h3>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{video.chatCount} chat{video.chatCount !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{video.totalMessages} messages</span>
                            </div>
                            <span>Last: {video.lastActivity.toLocaleDateString()}</span>
                          </div>
                          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                            Video ID: {video.videoId}
                          </div>
                          
                          {/* Chat Sessions Preview */}
                          <div className="mt-3 space-y-1">
                            {video.sessions.slice(0, 2).map((session) => (
                              <div key={session.id} className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 rounded px-2 py-1">
                                <span className="font-medium">{session.title}</span> • {session.messages.length - 1} messages
                              </div>
                            ))}
                            {video.sessions.length > 2 && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                                +{video.sessions.length - 2} more chat{video.sessions.length - 2 !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={(e) => handleDeleteVideoHistory(video.videoId, e)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="Delete video history"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight transition-colors duration-300">
              Ask Questions
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                About Any Video
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed transition-colors duration-300">
              Transform passive video watching into active learning. Paste any video link and start chatting with AI about its content.
            </p>
          </div>

          {/* Video Input Form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-2xl mx-auto border border-slate-200 dark:border-slate-700 transition-colors duration-300">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="video-url" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 transition-colors duration-300">
                  Paste your video link
                </label>
                <div className="relative">
                  <Youtube className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                  <input
                    id="video-url"
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full pl-12 pr-4 py-4 text-lg border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || !videoUrl.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-4 px-8 rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 text-lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Start Asking Questions</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Demo Link */}
          <div className="mt-8">
            <p className="text-slate-500 dark:text-slate-400 mb-4 transition-colors duration-300">Try it with this sample video:</p>
            <button
              onClick={() => setVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
              className="inline-flex items-center space-x-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Use sample video</span>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 transition-colors duration-300">
              Why Choose AskVid?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto transition-colors duration-300">
              Transform the way you learn from video content with AI-powered assistance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-8 rounded-2xl bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg mb-6 transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 transition-colors duration-300">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed transition-colors duration-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 transition-colors duration-300">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 transition-colors duration-300">
              Three simple steps to start learning from any video
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Paste Video Link", desc: "Simply paste any video URL from YouTube or other platforms" },
              { step: "2", title: "AI Transcription", desc: "Our AI analyzes and transcribes the video content automatically" },
              { step: "3", title: "Ask Questions", desc: "Start chatting and get instant answers about the video content" }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 h-full transition-colors duration-300">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-6">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 transition-colors duration-300">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 transition-colors duration-300">{item.desc}</p>
                </div>
                {index < 2 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-8 h-8 transition-colors duration-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Play className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">AskVid</span>
          </div>
          <p className="text-center text-slate-400 dark:text-slate-500 transition-colors duration-300">
            © 2025 AskVid. Transforming video learning with AI.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;