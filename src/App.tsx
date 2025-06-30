import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import VideoProcessor from './components/VideoProcessor';
import ChatInterface from './components/ChatInterface';
import { VideoData } from './types';
import { youtubeService } from './services/youtubeService';
import { transcriptionService } from './services/transcriptionService';
import { aiService } from './services/aiService';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'processor' | 'chat'>('landing');
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const handleVideoSubmit = async (videoUrl: string) => {
    setCurrentView('processor');
    setProcessingError(null);

    try {
      // Step 1: Get video information from YouTube
      const videoInfo = await youtubeService.getVideoInfo(videoUrl);
      
      // Step 2: Get transcript
      const transcriptResult = await transcriptionService.transcribeVideo(videoInfo.id);
      
      // Step 3: Set up AI service with transcript and video context
      aiService.setTranscript(
        transcriptResult.fullText, 
        transcriptResult.segments,
        videoInfo.title,
        videoUrl
      );
      
      // Step 4: Create video data object
      const processedVideoData: VideoData = {
        id: videoInfo.id,
        url: videoUrl,
        title: videoInfo.title,
        transcript: transcriptResult.fullText,
        duration: videoInfo.duration,
        thumbnail: videoInfo.thumbnail,
        channelTitle: videoInfo.channelTitle,
        publishedAt: videoInfo.publishedAt,
        segments: transcriptResult.segments
      };

      setVideoData(processedVideoData);
      setCurrentView('chat');
    } catch (error) {
      console.error('Error processing video:', error);
      setProcessingError(error instanceof Error ? error.message : 'Failed to process video');
      // Go back to landing page after showing error
      setTimeout(() => {
        setCurrentView('landing');
        setProcessingError(null);
      }, 3000);
    }
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setVideoData(null);
    setProcessingError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      {currentView === 'landing' && (
        <LandingPage onVideoSubmit={handleVideoSubmit} />
      )}
      {currentView === 'processor' && (
        <VideoProcessor error={processingError} />
      )}
      {currentView === 'chat' && videoData && (
        <ChatInterface 
          videoData={videoData} 
          onBack={handleBackToLanding}
        />
      )}
    </div>
  );
}

export default App;