import React, { useState, useEffect } from 'react';
import { FileVideo, Download, MessageSquare, CheckCircle, Clock, AlertCircle, Youtube } from 'lucide-react';
import { ProcessingStep } from '../types';
import ThemeToggle from './ThemeToggle';

interface VideoProcessorProps {
  error?: string | null;
}

const VideoProcessor: React.FC<VideoProcessorProps> = ({ error }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: '1',
      title: 'Analyzing YouTube Video',
      description: 'Extracting video metadata and information',
      status: 'processing'
    },
    {
      id: '2',
      title: 'Processing Video Content',
      description: 'Analyzing video structure and preparing for transcription',
      status: 'pending'
    },
    {
      id: '3',
      title: 'AI Transcription in Progress',
      description: 'Converting speech to text using advanced AI models',
      status: 'pending'
    },
    {
      id: '4',
      title: 'Preparing Intelligent Assistant',
      description: 'Setting up AI context with video content for Q&A',
      status: 'pending'
    }
  ]);

  useEffect(() => {
    if (error) {
      setSteps(prevSteps => {
        const newSteps = [...prevSteps];
        const processingStep = newSteps.find(step => step.status === 'processing');
        if (processingStep) {
          processingStep.status = 'error';
        }
        return newSteps;
      });
      return;
    }

    const interval = setInterval(() => {
      setSteps(prevSteps => {
        const newSteps = [...prevSteps];
        const currentProcessing = newSteps.find(step => step.status === 'processing');
        
        if (currentProcessing) {
          currentProcessing.status = 'completed';
          const nextStep = newSteps.find(step => step.status === 'pending');
          if (nextStep) {
            nextStep.status = 'processing';
            setCurrentStep(newSteps.indexOf(nextStep));
          }
        }
        
        return newSteps;
      });
    }, 1800); // Slightly longer intervals for more realistic feel

    return () => clearInterval(interval);
  }, [error]);

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const hasError = steps.some(step => step.status === 'error');
  const progress = hasError ? 0 : (completedSteps / steps.length) * 100;

  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />;
      case 'processing':
        return <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />;
      default:
        return <Clock className="w-6 h-6 text-slate-400 dark:text-slate-500" />;
    }
  };

  const processingTips = [
    "🎯 Our AI analyzes video content to understand context and key topics",
    "🔍 Advanced transcription technology converts speech to searchable text",
    "💡 The AI assistant will be able to answer questions about specific moments",
    "⚡ You can ask both video-specific and general knowledge questions",
    "🎬 Timestamps will be provided for relevant video segments"
  ];

  const currentTip = processingTips[currentStep] || processingTips[0];

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700 transition-colors duration-300">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              hasError 
                ? 'bg-red-100 dark:bg-red-900/20' 
                : 'bg-gradient-to-r from-red-500 to-purple-600'
            } transition-colors duration-300`}>
              {hasError ? (
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              ) : (
                <Youtube className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 transition-colors duration-300">
              {hasError ? 'Video Analysis Failed' : 'Analyzing Your Video'}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 transition-colors duration-300">
              {hasError 
                ? 'There was an error processing your video. Please check the URL and try again.'
                : 'We\'re extracting and analyzing the video content to create your AI assistant'
              }
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl transition-colors duration-300">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-red-800 dark:text-red-300 font-medium">Analysis Error:</p>
              </div>
              <p className="text-red-700 dark:text-red-400">{error}</p>
              <div className="mt-3 text-sm text-red-600 dark:text-red-400">
                <p className="font-medium">Troubleshooting tips:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Ensure the YouTube URL is valid and accessible</li>
                  <li>Check if the video is public (not private or unlisted)</li>
                  <li>Try a different YouTube video URL</li>
                  <li>Add your YouTube API key for better reliability</li>
                </ul>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {!hasError && (
            <div className="mb-8">
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2 transition-colors duration-300">
                <span>Analysis Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 transition-colors duration-300">
                <div 
                  className="bg-gradient-to-r from-red-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>
          )}

          {/* Processing Steps */}
          <div className="space-y-4 mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 ${
                step.status === 'processing' 
                  ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800' 
                  : 'bg-slate-50 dark:bg-slate-700'
              }`}>
                <div className="flex-shrink-0">
                  {getStepIcon(step)}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold transition-colors duration-300 ${
                    step.status === 'completed' ? 'text-green-600 dark:text-green-400' : 
                    step.status === 'processing' ? 'text-purple-600 dark:text-purple-400' : 
                    step.status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">{step.description}</p>
                </div>
                {step.status === 'processing' && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Processing Tip */}
          {!hasError && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 transition-colors duration-300">
              <div className="flex items-start space-x-3">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1 transition-colors duration-300">Processing Tip</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 transition-colors duration-300">
                    {currentTip}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* API Key Notice */}
          <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 transition-colors duration-300">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>Note:</strong> For real YouTube video analysis, add your YouTube API key to the .env file. 
              Currently using enhanced mock data for demonstration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoProcessor;