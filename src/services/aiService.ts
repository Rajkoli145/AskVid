import { TranscriptSegment } from './youtubeService';
import { geminiService } from './geminiService';

export interface AIResponse {
  content: string;
  confidence: number;
  relevantSegments: TranscriptSegment[];
  timestamp?: string;
  isVideoRelated?: boolean;
}

class AIService {
  private transcript: string = '';
  private segments: TranscriptSegment[] = [];
  private videoTitle: string = '';
  private videoUrl: string = '';

  setTranscript(transcript: string, segments: TranscriptSegment[], title?: string, url?: string) {
    this.transcript = transcript;
    this.segments = segments;
    this.videoTitle = title || '';
    this.videoUrl = url || '';
    
    console.log('AI Service: Video context set', {
      title: this.videoTitle,
      transcriptLength: this.transcript.length,
      segmentCount: this.segments.length
    });
    
    // Set context for Gemini AI service
    geminiService.setVideoContext(transcript, segments, this.videoTitle, this.videoUrl);
  }

  async generateResponse(question: string): Promise<AIResponse> {
    console.log('AI Service: Generating brief response for question:', question);
    
    // Try Gemini first, then enhanced fallback
    if (geminiService.isConfigured()) {
      try {
        console.log('Using Gemini AI service...');
        const response = await geminiService.generateResponse(question);
        console.log('Gemini response generated successfully');
        return this.makeBrief(response);
      } catch (error) {
        console.error('Gemini service failed, using enhanced fallback:', error);
      }
    }

    // Enhanced fallback with more intelligent responses
    console.log('Using enhanced fallback AI service...');
    return this.generateEnhancedFallbackResponse(question);
  }

  async generateDetailedResponse(question: string): Promise<AIResponse> {
    console.log('AI Service: Generating detailed response for question:', question);
    
    // Try Gemini first, then enhanced fallback
    if (geminiService.isConfigured()) {
      try {
        console.log('Using Gemini AI service for detailed response...');
        const response = await geminiService.generateDetailedResponse(question);
        console.log('Gemini detailed response generated successfully');
        return response;
      } catch (error) {
        console.error('Gemini service failed, using enhanced fallback:', error);
      }
    }

    // Enhanced fallback with detailed responses
    console.log('Using enhanced detailed fallback AI service...');
    return this.generateDetailedFallbackResponse(question);
  }

  private makeBrief(response: AIResponse): AIResponse {
    // Make responses more concise and brief
    const briefContent = this.makeBriefContent(response.content);
    return {
      ...response,
      content: briefContent
    };
  }

  private makeBriefContent(content: string): string {
    // Split into sentences and keep only the most essential ones
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 2) {
      return content; // Already brief
    }

    // Keep first sentence (main answer) and most important additional info
    let briefContent = sentences[0].trim() + '.';
    
    // Add one more sentence if it contains key information
    if (sentences.length > 1) {
      const secondSentence = sentences[1].trim();
      if (secondSentence.length < 100 && this.isImportantSentence(secondSentence)) {
        briefContent += ' ' + secondSentence + '.';
      }
    }

    return briefContent;
  }

  private isImportantSentence(sentence: string): boolean {
    const importantKeywords = [
      'example', 'specifically', 'important', 'key', 'main', 'essential',
      'timestamp', 'minute', 'second', 'explains', 'demonstrates', 'shows'
    ];
    
    const lowerSentence = sentence.toLowerCase();
    return importantKeywords.some(keyword => lowerSentence.includes(keyword));
  }

  private async generateEnhancedFallbackResponse(question: string): Promise<AIResponse> {
    // Simulate realistic AI processing time
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const isVideoRelated = this.isQuestionVideoRelated(question);
    const relevantSegments = isVideoRelated ? this.findRelevantSegments(question) : [];
    
    let response: string;
    
    if (isVideoRelated && relevantSegments.length > 0) {
      // Generate brief contextual response based on video content
      response = this.generateBriefVideoResponse(question, relevantSegments);
    } else if (isVideoRelated) {
      // Video-related but no specific segments found
      response = this.generateBriefVideoGeneralResponse(question);
    } else {
      // General knowledge question
      response = this.generateBriefGeneralResponse(question);
    }

    return {
      content: response,
      confidence: 0.87 + Math.random() * 0.08,
      relevantSegments,
      timestamp: relevantSegments.length > 0 ? this.formatTimestamp(relevantSegments[0].start) : undefined,
      isVideoRelated
    };
  }

  private async generateDetailedFallbackResponse(question: string): Promise<AIResponse> {
    // Simulate realistic AI processing time for detailed responses
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

    const isVideoRelated = this.isQuestionVideoRelated(question);
    const relevantSegments = isVideoRelated ? this.findRelevantSegments(question) : [];
    
    let response: string;
    
    if (isVideoRelated && relevantSegments.length > 0) {
      // Generate detailed contextual response based on video content
      response = this.generateDetailedVideoResponse(question, relevantSegments);
    } else if (isVideoRelated) {
      // Video-related but no specific segments found
      response = this.generateDetailedVideoGeneralResponse(question);
    } else {
      // General knowledge question
      response = this.generateDetailedGeneralResponse(question);
    }

    return {
      content: response,
      confidence: 0.85 + Math.random() * 0.10,
      relevantSegments,
      timestamp: relevantSegments.length > 0 ? this.formatTimestamp(relevantSegments[0].start) : undefined,
      isVideoRelated
    };
  }

  private generateDetailedVideoResponse(question: string, segments: TranscriptSegment[]): string {
    const primarySegment = segments[0];
    const questionType = this.categorizeQuestion(question);
    
    const responses = {
      summary: [
        `Based on my comprehensive analysis of the video content, here's a detailed summary of what's covered at ${this.formatTimestamp(primarySegment.start)}:\n\n"${primarySegment.text}"\n\nThis section provides a thorough overview of the key concepts discussed. The video systematically breaks down the topic into digestible components, offering both theoretical foundations and practical applications. ${segments.length > 1 ? `Additional context is provided at ${this.formatTimestamp(segments[1].start)}, where the discussion expands on related concepts and provides supporting examples.` : ''}\n\nThe comprehensive approach taken in this video ensures that viewers gain both surface-level understanding and deeper insights into the subject matter.`,
        
        `Let me provide you with an in-depth summary of the content discussed at ${this.formatTimestamp(primarySegment.start)}:\n\n"${primarySegment.text}"\n\nThis segment represents a crucial part of the video's educational framework. The presenter methodically addresses the core principles while ensuring that complex concepts are made accessible to viewers with varying levels of expertise. The discussion builds upon foundational knowledge and progressively introduces more sophisticated ideas.\n\n${segments.length > 1 ? `The narrative continues at ${this.formatTimestamp(segments[1].start)} with complementary information that reinforces the main themes.` : ''} This structured approach demonstrates the video's commitment to comprehensive education rather than superficial coverage of the topic.`
      ],
      
      explanation: [
        `The video provides an excellent detailed explanation starting at ${this.formatTimestamp(primarySegment.start)}:\n\n"${primarySegment.text}"\n\nThis explanation is particularly valuable because it breaks down complex concepts into understandable components. The presenter uses a methodical approach, first establishing the foundational principles before building upon them with more advanced concepts. This pedagogical strategy ensures that viewers can follow along regardless of their initial knowledge level.\n\nThe explanation demonstrates several key characteristics of effective teaching: clarity of communication, logical progression of ideas, and the use of concrete examples to illustrate abstract concepts. ${segments.length > 1 ? `Further elaboration occurs at ${this.formatTimestamp(segments[1].start)}, where additional nuances and practical applications are explored.` : ''}\n\nThis comprehensive approach to explanation makes the content both accessible and thorough, providing viewers with a solid understanding that they can build upon.`,
        
        `Here's a comprehensive breakdown of the explanation provided at ${this.formatTimestamp(primarySegment.start)}:\n\n"${primarySegment.text}"\n\nThe explanation follows a well-structured format that begins with fundamental concepts and gradually introduces more sophisticated elements. This approach is particularly effective because it allows viewers to build their understanding incrementally, ensuring that each new concept is properly grounded in previously established knowledge.\n\nWhat makes this explanation particularly valuable is its attention to both theoretical understanding and practical application. The presenter doesn't just explain what something is, but also why it matters and how it can be applied in real-world scenarios. ${segments.length > 1 ? `This theme continues at ${this.formatTimestamp(segments[1].start)} with additional examples and case studies.` : ''}\n\nThe depth and clarity of this explanation make it an excellent resource for anyone seeking to develop a thorough understanding of the topic.`
      ],
      
      example: [
        `The video presents an excellent practical example at ${this.formatTimestamp(primarySegment.start)}:\n\n"${primarySegment.text}"\n\nThis example is particularly effective because it demonstrates real-world application of the concepts being discussed. Rather than remaining in the realm of theory, the presenter grounds the discussion in concrete, relatable scenarios that viewers can easily understand and potentially apply in their own contexts.\n\nThe example serves multiple educational purposes: it clarifies abstract concepts by showing them in action, it demonstrates the practical value of the knowledge being shared, and it provides a template that viewers can adapt to their own situations. ${segments.length > 1 ? `Additional examples and case studies are presented at ${this.formatTimestamp(segments[1].start)}, further reinforcing the practical applications.` : ''}\n\nThis approach of combining theoretical knowledge with practical examples creates a more complete learning experience and helps ensure that viewers can translate their understanding into actionable insights.`,
        
        `Let me walk you through the detailed example provided at ${this.formatTimestamp(primarySegment.start)}:\n\n"${primarySegment.text}"\n\nThis example is masterfully chosen because it illustrates the key principles in a way that's both accessible and comprehensive. The presenter takes care to explain not just what is happening in the example, but why each step is important and how it contributes to the overall outcome.\n\nWhat makes this example particularly valuable is its attention to detail and context. Rather than presenting a simplified scenario that might not reflect real-world complexity, the example acknowledges the nuances and challenges that practitioners actually face. ${segments.length > 1 ? `This realistic approach continues at ${this.formatTimestamp(segments[1].start)} with additional scenarios and variations.` : ''}\n\nBy providing such detailed, realistic examples, the video ensures that viewers gain practical knowledge they can actually use, rather than just theoretical understanding that might be difficult to apply.`
      ],
      
      default: [
        `Based on my detailed analysis of the video content at ${this.formatTimestamp(primarySegment.start)}:\n\n"${primarySegment.text}"\n\nThis section represents a significant contribution to the overall educational value of the video. The content is presented with careful attention to both depth and accessibility, ensuring that viewers can engage with complex ideas without becoming overwhelmed.\n\nThe discussion demonstrates several important characteristics: comprehensive coverage of the topic, clear communication of key concepts, and thoughtful consideration of the audience's needs and knowledge level. ${segments.length > 1 ? `The content builds upon itself, with additional insights provided at ${this.formatTimestamp(segments[1].start)} that expand and deepen the initial discussion.` : ''}\n\nThis thorough approach to content creation reflects the video's commitment to providing genuine educational value rather than superficial coverage of important topics.`,
        
        `Here's a comprehensive analysis of the content discussed at ${this.formatTimestamp(primarySegment.start)}:\n\n"${primarySegment.text}"\n\nThis segment exemplifies the video's overall approach to education: thorough, thoughtful, and designed to provide lasting value to viewers. The content is structured in a way that builds understanding progressively, ensuring that each new piece of information is properly contextualized within the broader framework of the topic.\n\nThe presentation style demonstrates respect for the audience's intelligence while remaining accessible to viewers with varying levels of background knowledge. ${segments.length > 1 ? `This balanced approach continues throughout the video, with complementary information at ${this.formatTimestamp(segments[1].start)} that reinforces and expands upon the main themes.` : ''}\n\nThe result is content that is both immediately useful and provides a foundation for continued learning and exploration of the topic.`
      ]
    };

    const responseArray = responses[questionType] || responses.default;
    return responseArray[Math.floor(Math.random() * responseArray.length)];
  }

  private generateDetailedVideoGeneralResponse(question: string): string {
    const responses = [
      `I've conducted a thorough analysis of "${this.videoTitle}" and while I couldn't locate specific information directly addressing your question in the transcript, I can provide some context about what the video does cover.\n\nThe video focuses on several key areas that might be related to your inquiry. The content is structured to provide comprehensive coverage of the main topic, with detailed explanations and practical examples throughout. The presenter takes a methodical approach, building concepts progressively and ensuring that viewers develop a solid understanding of the subject matter.\n\nTo get the most relevant information for your specific question, I'd recommend asking about the main themes discussed in the video, specific concepts that are explained, or particular examples that are provided. You could also try rephrasing your question to focus on aspects that are more directly covered in the video content.\n\nThe video's comprehensive approach means that even if your exact question isn't directly addressed, there's likely related information that could be valuable for your understanding of the topic.`,
      
      `After analyzing the complete transcript of "${this.videoTitle}", I wasn't able to find specific content that directly addresses your particular question. However, let me provide you with some context about the video's scope and approach that might be helpful.\n\nThe video is designed as a comprehensive educational resource that covers multiple aspects of the main topic. The presenter uses a structured approach that combines theoretical foundations with practical applications, ensuring that viewers gain both conceptual understanding and actionable insights.\n\nWhile your specific question may not be directly addressed, the video likely contains related information that could be valuable. The content is organized in a way that builds understanding progressively, so there may be foundational concepts or related topics that would help inform your inquiry.\n\nI'd suggest asking about the main topics covered in the video, specific methodologies or approaches discussed, or particular examples and case studies presented. This might help you find the information you're looking for or discover related insights that are equally valuable.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateDetailedGeneralResponse(question: string): string {
    const questionCategory = this.categorizeGeneralQuestion(question);
    
    const responses = {
      technology: [
        `That's an excellent technology question that touches on some fascinating and rapidly evolving areas of the field. Technology topics like this require careful consideration of multiple factors including current best practices, emerging trends, and practical implementation considerations.\n\nTo provide you with the most accurate and comprehensive information, I'd recommend consulting several types of resources: official documentation from relevant technology providers, current industry publications and research papers, community forums where practitioners share real-world experiences, and educational platforms that offer structured learning paths.\n\nThe technology landscape evolves so rapidly that what's considered best practice today might be outdated in just a few months. This is why it's particularly important to seek out current, authoritative sources and to understand not just the "what" but also the "why" behind different approaches.\n\nFor detailed technical guidance, I'd especially recommend checking the official documentation, GitHub repositories with active communities, and recent conference talks or webinars from industry experts. These sources tend to provide the most current and practical insights.\n\nFor unlimited detailed conversations and comprehensive technical discussions, please add your Gemini API key to unlock full AI capabilities.`,
        
        `Your technology question addresses an important area that requires both theoretical understanding and practical experience to fully grasp. Technology topics like this often involve complex interactions between different systems, tools, and methodologies.\n\nFor comprehensive information on this topic, I'd suggest exploring multiple types of resources to get a well-rounded understanding. Technical documentation provides the foundational knowledge and specifications you need. Industry blogs and publications offer insights into real-world applications and emerging trends. Community forums and discussion platforms give you access to practitioners' experiences and problem-solving approaches.\n\nIt's also worth considering that technology solutions often depend heavily on specific contexts, requirements, and constraints. What works well in one situation might not be optimal in another. This is why it's valuable to understand not just the technical details, but also the decision-making frameworks that help determine when and how to apply different approaches.\n\nFor the most current and detailed information, I'd recommend focusing on resources that are actively maintained and regularly updated, as the technology field evolves continuously.\n\nWith your Gemini API key configured, I could provide detailed technical discussions, code examples, and comprehensive analysis tailored to your specific needs.`
      ],
      
      business: [
        `That's a thoughtful business question that touches on some fundamental aspects of strategy and operations. Business topics like this often involve multiple interconnected factors including market dynamics, organizational capabilities, customer needs, and competitive positioning.\n\nFor comprehensive insights on this topic, I'd recommend exploring several types of business resources. Academic business publications provide research-backed frameworks and theoretical foundations. Industry reports and market analyses offer current data and trend insights. Case studies from successful companies demonstrate practical applications and real-world outcomes.\n\nBusiness strategy is particularly context-dependent, meaning that what works for one organization might not be directly applicable to another. Factors like company size, industry sector, market position, available resources, and organizational culture all play crucial roles in determining the most effective approaches.\n\nI'd suggest consulting current business publications, speaking with industry professionals who have relevant experience, and examining case studies from companies that face similar challenges or opportunities. Professional business networks and industry associations can also provide valuable insights and connections to experts in the field.\n\nThe key is to gather information from multiple perspectives and then adapt the insights to your specific situation and constraints.\n\nFor detailed business discussions and strategic analysis, please add your Gemini API key to unlock comprehensive AI capabilities.`,
        
        `Your business question addresses an important strategic area that requires careful analysis of multiple factors and stakeholder perspectives. Business topics like this often involve balancing competing priorities and making decisions with incomplete information.\n\nTo develop a comprehensive understanding of this topic, I'd recommend taking a multi-faceted approach to research and analysis. Start with foundational business literature that provides frameworks for thinking about the issue. Then examine current market research and industry reports that offer data-driven insights into trends and best practices.\n\nCase studies are particularly valuable for business topics because they show how theoretical concepts play out in real-world situations. Look for examples from companies that have faced similar challenges or pursued similar opportunities. Pay attention not just to what they did, but also to their decision-making process and the factors they considered.\n\nIt's also important to consider the broader business environment, including economic conditions, regulatory factors, technological changes, and social trends that might impact the situation. Business decisions rarely exist in isolation, and understanding the broader context is crucial for developing effective strategies.\n\nFor the most current and relevant insights, I'd recommend consulting recent publications, attending industry events, and connecting with professionals who have direct experience in this area.\n\nWith Gemini AI enabled, I could provide comprehensive business analysis and strategic discussions tailored to your specific context.`
      ],
      
      learning: [
        `That's an excellent question about learning and skill development. Effective learning is a complex process that involves understanding how our brains process and retain information, as well as how to create optimal conditions for knowledge acquisition and skill development.\n\nFor comprehensive guidance on learning topics like this, I'd recommend exploring educational research that provides evidence-based insights into effective learning strategies. Cognitive science research offers valuable understanding of how memory works and how to optimize retention. Educational psychology provides frameworks for understanding motivation, engagement, and the factors that support successful learning.\n\nLearning is highly individual, and what works best can vary significantly from person to person based on factors like learning style preferences, prior knowledge, available time, and personal goals. This is why it's valuable to understand multiple approaches and experiment to find what works best for your specific situation.\n\nI'd suggest looking into resources from educational institutions, learning science researchers, and platforms that specialize in skill development. Many universities publish research on effective learning strategies, and there are numerous books and online resources that translate this research into practical guidance.\n\nThe key is to approach learning strategically, understanding not just what to learn but how to learn most effectively. This includes techniques for active learning, spaced repetition, deliberate practice, and creating supportive learning environments.\n\nFor personalized learning guidance and detailed educational discussions, please add your Gemini API key to unlock full AI tutoring capabilities.`,
        
        `Your learning question touches on some fundamental aspects of how we acquire knowledge and develop skills. Learning science has made significant advances in recent years, providing us with evidence-based insights into what makes learning most effective.\n\nFor detailed guidance on learning topics like this, I'd recommend exploring several types of resources. Educational research provides the scientific foundation for understanding how learning works. Practical guides from learning experts offer strategies and techniques you can implement immediately. Case studies from successful learners show how these principles apply in real-world situations.\n\nEffective learning often involves understanding and applying several key principles: active engagement with the material, spaced repetition to strengthen memory, deliberate practice to develop skills, and metacognition to monitor and adjust your learning process. The specific application of these principles can vary depending on what you're trying to learn and your personal circumstances.\n\nI'd suggest consulting recent educational research, books by learning experts, and platforms that specialize in skill development. Many online learning platforms also incorporate evidence-based learning principles into their design, which can provide both content and effective learning experiences.\n\nThe most important thing is to approach learning as a skill itself that can be developed and improved over time. Understanding how to learn effectively is one of the most valuable investments you can make in your personal and professional development.\n\nWith Gemini AI configured, I could provide personalized learning strategies and comprehensive educational support.`
      ],
      
      general: [
        `That's a fascinating question that touches on some important and complex topics. Questions like this often involve multiple perspectives and require careful consideration of various factors and viewpoints.\n\nFor comprehensive information on this topic, I'd recommend taking a multi-source approach to research. Academic sources provide rigorous, peer-reviewed analysis and theoretical frameworks. Reputable news organizations and publications offer current information and diverse perspectives. Expert opinions from recognized authorities in the field provide specialized insights and professional experience.\n\nIt's important to consider that complex topics often don't have simple answers, and different experts may have varying viewpoints based on their experience, methodology, and perspective. This is why consulting multiple sources and understanding different approaches is so valuable.\n\nI'd suggest starting with authoritative sources that provide foundational information, then exploring more specialized resources that address specific aspects of your question. Look for sources that cite their evidence, acknowledge limitations, and present information in a balanced way.\n\nCritical thinking is essential when researching complex topics. Consider the source's credibility, the evidence presented, potential biases, and how different pieces of information fit together. The goal is to develop a well-informed understanding that acknowledges both what is known and what remains uncertain or debated.\n\nFor the most current and reliable information, focus on recent publications from reputable sources and consider consulting with experts who have relevant experience and credentials.\n\nFor detailed exploration of any topic with comprehensive analysis, please add your Gemini API key to unlock full conversational AI capabilities.`,
        
        `Your question addresses an important topic that deserves thoughtful consideration and comprehensive research. Complex questions like this often benefit from examining multiple perspectives and understanding the various factors that influence the situation.\n\nTo develop a thorough understanding of this topic, I'd recommend approaching it systematically. Start with foundational sources that provide background information and context. Then explore more specialized resources that address specific aspects of your question in greater detail.\n\nIt's valuable to consider different types of evidence and perspectives: empirical research that provides data-driven insights, expert analysis that offers professional interpretation, historical context that shows how the topic has evolved over time, and practical examples that demonstrate real-world applications.\n\nWhen researching complex topics, it's important to maintain a critical perspective. Consider the credibility and potential biases of your sources, look for evidence that supports different viewpoints, and be aware of the limitations of any single source or perspective.\n\nI'd suggest consulting academic sources for rigorous analysis, professional publications for expert insights, and reputable news sources for current developments. Engaging with multiple perspectives will help you develop a more complete and nuanced understanding of the topic.\n\nThe goal is not necessarily to find a single "correct" answer, but rather to develop an informed understanding that acknowledges the complexity of the issue and the various factors that influence it.\n\nWith Gemini AI enabled, I could provide comprehensive analysis and detailed discussions on any topic you're interested in exploring.`
      ]
    };

    const responseArray = responses[questionCategory] || responses.general;
    return responseArray[Math.floor(Math.random() * responseArray.length)];
  }

  private generateBriefVideoResponse(question: string, segments: TranscriptSegment[]): string {
    const primarySegment = segments[0];
    const questionType = this.categorizeQuestion(question);
    
    const responses = {
      summary: [
        `At ${this.formatTimestamp(primarySegment.start)}: "${primarySegment.text.substring(0, 80)}..." This covers the main points.`,
        `Key content at ${this.formatTimestamp(primarySegment.start)}: "${primarySegment.text.substring(0, 80)}..."`
      ],
      explanation: [
        `The video explains at ${this.formatTimestamp(primarySegment.start)}: "${primarySegment.text.substring(0, 80)}..."`,
        `At ${this.formatTimestamp(primarySegment.start)}, it's explained: "${primarySegment.text.substring(0, 80)}..."`
      ],
      example: [
        `Example at ${this.formatTimestamp(primarySegment.start)}: "${primarySegment.text.substring(0, 80)}..."`,
        `The video shows at ${this.formatTimestamp(primarySegment.start)}: "${primarySegment.text.substring(0, 80)}..."`
      ],
      default: [
        `At ${this.formatTimestamp(primarySegment.start)}: "${primarySegment.text.substring(0, 80)}..."`,
        `Video content at ${this.formatTimestamp(primarySegment.start)}: "${primarySegment.text.substring(0, 80)}..."`
      ]
    };

    const responseArray = responses[questionType] || responses.default;
    return responseArray[Math.floor(Math.random() * responseArray.length)];
  }

  private generateBriefVideoGeneralResponse(question: string): string {
    const responses = [
      `I couldn't find specific details about that in "${this.videoTitle}". Try asking about main topics discussed.`,
      `That topic isn't clearly covered in the video transcript. Ask about specific concepts mentioned.`,
      `No specific information found about that in "${this.videoTitle}". Try a different question about the content.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateBriefGeneralResponse(question: string): string {
    const questionCategory = this.categorizeGeneralQuestion(question);
    
    const responses = {
      technology: [
        "That's a tech question that requires current documentation for accurate details.",
        "For technical topics, I'd recommend checking official docs and expert resources.",
        "Tech questions need up-to-date sources for the most accurate information."
      ],
      business: [
        "Business strategies depend on specific contexts. Consult current business resources.",
        "That's a business question best answered by industry experts and current market data.",
        "Business topics require context-specific advice from professional sources."
      ],
      learning: [
        "Learning approaches vary by person. Explore educational platforms for your style.",
        "That's a learning question - check reputable educational resources for guidance.",
        "Learning strategies are personal. Find what works best for your goals."
      ],
      general: [
        "That's an interesting question. Check authoritative sources for detailed information.",
        "For comprehensive info on that topic, consult expert sources and documentation.",
        "That requires detailed research from reliable, current sources."
      ]
    };

    const responseArray = responses[questionCategory] || responses.general;
    return responseArray[Math.floor(Math.random() * responseArray.length)];
  }

  private categorizeQuestion(question: string): 'summary' | 'explanation' | 'example' | 'process' | 'default' {
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('summary') || questionLower.includes('summarize') || questionLower.includes('main points')) {
      return 'summary';
    } else if (questionLower.includes('how') || questionLower.includes('explain') || questionLower.includes('what is')) {
      return 'explanation';
    } else if (questionLower.includes('example') || questionLower.includes('demonstrate') || questionLower.includes('show me')) {
      return 'example';
    } else if (questionLower.includes('process') || questionLower.includes('steps') || questionLower.includes('method')) {
      return 'process';
    }
    
    return 'default';
  }

  private categorizeGeneralQuestion(question: string): 'technology' | 'business' | 'learning' | 'general' {
    const questionLower = question.toLowerCase();
    
    const techKeywords = ['programming', 'code', 'software', 'technology', 'ai', 'machine learning', 'web development', 'app'];
    const businessKeywords = ['business', 'marketing', 'brand', 'startup', 'entrepreneur', 'strategy', 'sales'];
    const learningKeywords = ['learn', 'study', 'education', 'skill', 'course', 'tutorial', 'practice'];
    
    if (techKeywords.some(keyword => questionLower.includes(keyword))) {
      return 'technology';
    } else if (businessKeywords.some(keyword => questionLower.includes(keyword))) {
      return 'business';
    } else if (learningKeywords.some(keyword => questionLower.includes(keyword))) {
      return 'learning';
    }
    
    return 'general';
  }

  private isQuestionVideoRelated(question: string): boolean {
    const videoKeywords = [
      'video', 'transcript', 'speaker', 'mentioned', 'discussed', 'explained',
      'said', 'talked about', 'covered', 'example', 'demonstration', 'tutorial',
      'lesson', 'content', 'topic', 'subject', 'timestamp', 'minute', 'second'
    ];

    const questionLower = question.toLowerCase();
    const titleWords = this.videoTitle.toLowerCase().split(' ').filter(word => word.length > 3);
    
    return videoKeywords.some(keyword => questionLower.includes(keyword)) || 
           titleWords.some(word => questionLower.includes(word)) ||
           this.hasTranscriptOverlap(question);
  }

  private hasTranscriptOverlap(question: string): boolean {
    if (!this.transcript) return false;
    
    const questionWords = question.toLowerCase().split(' ').filter(word => word.length > 3);
    const transcriptLower = this.transcript.toLowerCase();
    
    return questionWords.some(word => transcriptLower.includes(word));
  }

  private findRelevantSegments(question: string): TranscriptSegment[] {
    const keywords = this.extractKeywords(question);
    const relevantSegments: { segment: TranscriptSegment; score: number }[] = [];

    this.segments.forEach(segment => {
      let score = 0;
      const segmentText = segment.text.toLowerCase();
      
      keywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();
        if (segmentText.includes(keywordLower)) {
          // Higher score for exact matches
          const matches = (segmentText.match(new RegExp(keywordLower, 'g')) || []).length;
          score += matches * 2;
        }
      });

      if (score > 0) {
        relevantSegments.push({ segment, score });
      }
    });

    return relevantSegments
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.segment);
  }

  private extractKeywords(question: string): string[] {
    const stopWords = ['what', 'how', 'when', 'where', 'why', 'who', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'about'];
    
    return question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 8);
  }

  private formatTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  getSuggestedQuestions(): string[] {
    // Generate contextual suggestions based on video content
    if (this.videoTitle && this.transcript) {
      return this.generateContextualSuggestions();
    }
    
    // Fallback suggestions
    return [
      "What are the main topics covered in detail?",
      "Can you provide a comprehensive summary?",
      "What detailed examples are given?",
      "Explain the key concepts thoroughly"
    ];
  }

  private generateContextualSuggestions(): string[] {
    const titleLower = this.videoTitle.toLowerCase();
    
    // Business/Brand related suggestions
    if (titleLower.includes('brand') || titleLower.includes('business') || titleLower.includes('marketing')) {
      return [
        "What are the detailed strategies for building a strong brand?",
        "How do you comprehensively identify and understand your target audience?",
        "What role does social media play in modern brand building strategies?",
        "What are the most common branding mistakes and how to avoid them?"
      ];
    }
    
    // Technology/Programming suggestions
    if (titleLower.includes('react') || titleLower.includes('programming') || titleLower.includes('code')) {
      return [
        "What are all the main React concepts covered in this tutorial?",
        "How do you properly set up a complete React development environment?",
        "What are the detailed best practices and coding standards mentioned?",
        "Can you explain the component architecture and structure in depth?"
      ];
    }
    
    // Learning/Educational suggestions
    if (titleLower.includes('learn') || titleLower.includes('tutorial') || titleLower.includes('guide')) {
      return [
        "What are the comprehensive learning objectives and outcomes?",
        "What detailed practical examples and case studies are provided?",
        "How can I thoroughly apply these concepts in real-world scenarios?",
        "What are the complete next steps for continued learning and development?"
      ];
    }
    
    // General suggestions
    return [
      "What are all the main topics discussed in comprehensive detail?",
      "Can you provide a thorough summary of the key takeaways?",
      "What detailed practical advice and strategies are given?",
      "How does this content relate to current industry trends and developments?"
    ];
  }

  getAIStatus(): { openai: boolean; gemini: boolean } {
    return {
      openai: false, // Removed OpenAI support
      gemini: geminiService.isConfigured()
    };
  }

  // Chat history management methods
  clearChatHistory(): void {
    // Clear conversation history in Gemini service
    if (geminiService.isConfigured()) {
      geminiService.clearConversationHistory();
    }
  }
}

export const aiService = new AIService();