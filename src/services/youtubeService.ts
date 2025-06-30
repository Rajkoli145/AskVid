import axios from 'axios';

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

class YouTubeService {
  private readonly API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  private readonly BASE_URL = 'https://www.googleapis.com/youtube/v3';

  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
      /youtu\.be\/([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  async getVideoInfo(videoUrl: string): Promise<YouTubeVideoInfo> {
    const videoId = this.extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL. Please provide a valid YouTube video link.');
    }

    try {
      // If API key is properly configured, use real YouTube API
      if (this.API_KEY && this.API_KEY !== 'your_youtube_api_key_here' && this.API_KEY.trim() !== '') {
        console.log('Using real YouTube API for video analysis...');
        return await this.fetchRealVideoInfo(videoId);
      } else {
        console.log('YouTube API key not configured - using enhanced mock analysis...');
        // Use enhanced mock data that simulates real video analysis
        return await this.getContextualMockVideoInfo(videoId, videoUrl);
      }
    } catch (error) {
      console.error('Error fetching video info:', error);
      throw new Error(`Failed to analyze video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchRealVideoInfo(videoId: string): Promise<YouTubeVideoInfo> {
    try {
      const response = await axios.get(`${this.BASE_URL}/videos`, {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoId,
          key: this.API_KEY
        }
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Video not found or is private/unavailable');
      }

      const video = response.data.items[0];
      const snippet = video.snippet;
      const contentDetails = video.contentDetails;

      console.log('Successfully fetched real YouTube video data:', snippet.title);

      return {
        id: videoId,
        title: snippet.title,
        description: snippet.description || 'No description available',
        duration: this.formatDuration(contentDetails.duration),
        thumbnail: snippet.thumbnails.maxres?.url || 
                  snippet.thumbnails.high?.url || 
                  snippet.thumbnails.medium?.url || 
                  snippet.thumbnails.default.url,
        channelTitle: snippet.channelTitle,
        publishedAt: snippet.publishedAt
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          throw new Error('YouTube API quota exceeded or invalid API key');
        } else if (error.response?.status === 404) {
          throw new Error('Video not found');
        }
      }
      throw error;
    }
  }

  private async getContextualMockVideoInfo(videoId: string, videoUrl: string): Promise<YouTubeVideoInfo> {
    // Simulate API call delay for realism
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Try to extract actual video info from common video IDs or generate contextual mock data
    const videoInfo = this.getVideoInfoFromId(videoId) || this.generateContextualMockData(videoId);
    
    console.log('Generated contextual mock video data:', videoInfo.title);
    
    return {
      id: videoId,
      title: videoInfo.title,
      description: videoInfo.description,
      duration: videoInfo.duration,
      thumbnail: videoInfo.thumbnail,
      channelTitle: videoInfo.channelTitle,
      publishedAt: videoInfo.publishedAt
    };
  }

  private getVideoInfoFromId(videoId: string): any | null {
    // Map of known video IDs to their actual content (for demo purposes)
    const knownVideos: { [key: string]: any } = {
      'dQw4w9WgXcQ': {
        title: "Rick Astley - Never Gonna Give You Up (Official Video)",
        description: "The official video for Rick Astley's 'Never Gonna Give You Up'. A classic that never gets old!",
        channelTitle: "Rick Astley",
        duration: "3:33",
        category: "music"
      },
      'jNQXAC9IVRw': {
        title: "Me at the zoo",
        description: "The first video ever uploaded to YouTube. A piece of internet history!",
        channelTitle: "jawed",
        duration: "0:19",
        category: "historic"
      },
      'kJQP7kiw5Fk': {
        title: "Despacito",
        description: "Luis Fonsi - Despacito ft. Daddy Yankee. One of the most viewed videos on YouTube.",
        channelTitle: "Luis Fonsi",
        duration: "4:42",
        category: "music"
      }
    };

    return knownVideos[videoId] || null;
  }

  private generateContextualMockData(videoId: string) {
    // Generate more realistic video data based on video ID characteristics
    const videoTypes = [
      {
        title: "How To Build A Big Brand? Complete Business Strategy Guide",
        description: "Learn the essential strategies for building a successful brand from scratch. This comprehensive guide covers brand identity, marketing strategies, customer engagement, and scaling your business for long-term success.",
        channelTitle: "Business Mastery",
        duration: "21:46",
        category: "business",
        thumbnail: "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800&h=450"
      },
      {
        title: "Complete React Tutorial - Build Modern Web Applications",
        description: "Master React development with this comprehensive tutorial. Learn components, hooks, state management, and build real-world applications. Perfect for beginners and intermediate developers.",
        channelTitle: "CodeMaster Pro",
        duration: "2:15:30",
        category: "programming",
        thumbnail: "https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=800&h=450"
      },
      {
        title: "Machine Learning Fundamentals - AI Explained Simply",
        description: "Understand machine learning and artificial intelligence concepts without the complexity. Real-world examples and practical applications explained in simple terms.",
        channelTitle: "AI Academy",
        duration: "28:42",
        category: "technology",
        thumbnail: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800&h=450"
      },
      {
        title: "Digital Marketing Strategy 2024 - Complete Guide",
        description: "Master digital marketing with proven strategies for social media, content marketing, SEO, and paid advertising. Grow your business online with these expert techniques.",
        channelTitle: "Marketing Guru",
        duration: "45:18",
        category: "marketing",
        thumbnail: "https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=800&h=450"
      },
      {
        title: "Entrepreneurship Mindset - From Idea to Success",
        description: "Develop the entrepreneurial mindset needed to turn your ideas into successful businesses. Learn from real entrepreneurs and their journey to success.",
        channelTitle: "Startup Stories",
        duration: "33:25",
        category: "entrepreneurship",
        thumbnail: "https://images.pexels.com/photos/4348404/pexels-photo-4348404.jpeg?auto=compress&cs=tinysrgb&w=800&h=450"
      }
    ];

    // Select based on video ID for consistency
    const index = videoId.charCodeAt(0) % videoTypes.length;
    const selectedVideo = videoTypes[index];

    return {
      ...selectedVideo,
      publishedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  private formatDuration(isoDuration: string): string {
    const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1]?.replace('H', '') || '0');
    const minutes = parseInt(match[2]?.replace('M', '') || '0');
    const seconds = parseInt(match[3]?.replace('S', '') || '0');

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  async getTranscript(videoId: string): Promise<TranscriptSegment[]> {
    // In a real implementation, this would call a backend service
    // that uses youtube-transcript or similar library
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.generateContextualTranscript(videoId));
      }, 2000);
    });
  }

  private generateContextualTranscript(videoId: string): TranscriptSegment[] {
    // Generate more realistic transcript based on video type
    const transcriptTemplates = {
      business: [
        "Welcome to this comprehensive guide on building a successful brand from the ground up.",
        "Today we're going to explore the fundamental principles that separate great brands from mediocre ones.",
        "The first step in brand building is understanding your target audience and their pain points.",
        "Your brand identity should reflect your core values and resonate with your ideal customers.",
        "Consistency across all touchpoints is crucial for building brand recognition and trust.",
        "Let's discuss the importance of storytelling in creating an emotional connection with your audience.",
        "Social media platforms offer incredible opportunities for brand building and customer engagement.",
        "Content marketing is one of the most effective ways to establish thought leadership in your industry.",
        "Building partnerships and collaborations can exponentially expand your brand's reach and credibility.",
        "Remember, brand building is a marathon, not a sprint - consistency and patience are key to long-term success."
      ],
      programming: [
        "Hello everyone, and welcome to this comprehensive React tutorial for modern web development.",
        "In this video, we'll build a complete application from scratch using the latest React features.",
        "First, let's understand what makes React so powerful for building user interfaces.",
        "Components are the building blocks of React applications - let's create our first functional component.",
        "The useState hook allows us to add state to functional components in a clean and intuitive way.",
        "useEffect is essential for handling side effects like API calls and DOM manipulation.",
        "Let's implement routing using React Router to create a multi-page application experience.",
        "State management becomes crucial as your application grows - here's how to handle complex state.",
        "We'll also cover best practices for component organization and code structure.",
        "By the end of this tutorial, you'll have the skills to build professional React applications."
      ],
      technology: [
        "Machine learning and artificial intelligence are transforming every industry we can think of.",
        "But what exactly is machine learning, and how does it differ from traditional programming?",
        "At its core, machine learning is about finding patterns in data and making predictions.",
        "There are three main types of machine learning: supervised, unsupervised, and reinforcement learning.",
        "Supervised learning uses labeled data to train models that can make accurate predictions.",
        "Neural networks are inspired by how the human brain processes information and learns.",
        "Deep learning uses multiple layers of neural networks to solve complex problems.",
        "Real-world applications include image recognition, natural language processing, and autonomous vehicles.",
        "The key to successful machine learning projects is having high-quality, relevant data.",
        "As AI continues to evolve, it's creating new opportunities and challenges across all sectors."
      ]
    };

    // Determine video type based on video ID
    const videoTypes = Object.keys(transcriptTemplates);
    const typeIndex = videoId.charCodeAt(0) % videoTypes.length;
    const selectedType = videoTypes[typeIndex] as keyof typeof transcriptTemplates;
    const selectedTranscript = transcriptTemplates[selectedType];

    return selectedTranscript.map((text, index) => ({
      text,
      start: index * 30 + Math.random() * 10,
      duration: 25 + Math.random() * 15
    }));
  }
}

export const youtubeService = new YouTubeService();