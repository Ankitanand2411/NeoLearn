
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RotateCcw, Loader, Youtube } from 'lucide-react';
import { toast } from 'sonner';

interface VideoRecommendation {
  title: string;
  videoId: string;
  description: string;
  duration: string;
}

interface YouTubeVideoPlayerProps {
  topicTitle: string;
  userMasteryLevel: number;
  onVideoWatched: () => void;
}

const YouTubeVideoPlayer = ({ topicTitle, userMasteryLevel, onVideoWatched }: YouTubeVideoPlayerProps) => {
  const [selectedLevel, setSelectedLevel] = useState('');
  const [videoRecommendation, setVideoRecommendation] = useState<VideoRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Determine default level based on user mastery
  const getDefaultLevel = (mastery: number) => {
    if (mastery === 0) return 'beginner';
    if (mastery < 0.3) return 'beginner';
    if (mastery < 0.7) return 'intermediate';
    return 'advanced';
  };

  useEffect(() => {
    const defaultLevel = getDefaultLevel(userMasteryLevel);
    setSelectedLevel(defaultLevel);
    searchVideo(defaultLevel);
  }, [topicTitle, userMasteryLevel]);

  const searchVideo = async (level: string) => {
    setLoading(true);
    setHasSearched(true);
    
    try {
      console.log('Searching for video:', { topic: topicTitle, level });
      
      const { data, error } = await supabase.functions.invoke('search-youtube-videos', {
        body: {
          topic: topicTitle,
          level: level
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Video search response:', data);

      if (data.success && data.recommendation) {
        setVideoRecommendation(data.recommendation);
        
        if (data.fallback) {
          toast.success('🎥 Educational video loaded (using fallback content)');
        } else {
          toast.success('🎥 Video recommendation loaded!');
        }
      } else {
        throw new Error(data.error || 'Failed to get video recommendation');
      }
    } catch (error) {
      console.error('Error searching video:', error);
      toast.error('Failed to load video recommendation. Please try again.');
      
      // Fallback video with real educational content
      const fallbackVideo = {
        title: `${topicTitle} - Educational Tutorial`,
        videoId: 'u_nd9IVKoR4', // Khan Academy algebra intro
        description: `Learn about ${topicTitle} in this educational video from Khan Academy`,
        duration: '10-15 minutes'
      };
      setVideoRecommendation(fallbackVideo);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelChange = (newLevel: string) => {
    setSelectedLevel(newLevel);
    searchVideo(newLevel);
  };

  const handleRefreshVideo = () => {
    if (selectedLevel) {
      searchVideo(selectedLevel);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-xl gap-3">
            <Youtube className="h-6 w-6 text-red-600" />
            {topicTitle} - Video Lesson
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Level Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="videoLevel">Customize Video Level</Label>
              <div className="flex gap-3 items-center">
                <Select value={selectedLevel} onValueChange={handleLevelChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select video difficulty level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner - Basic concepts and simple explanations</SelectItem>
                    <SelectItem value="intermediate">Intermediate - Detailed explanations with examples</SelectItem>
                    <SelectItem value="advanced">Advanced - In-depth analysis and complex scenarios</SelectItem>
                    <SelectItem value="expert">Expert - Comprehensive coverage with latest research</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={handleRefreshVideo}
                  disabled={loading}
                  className="px-3"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Recommended level based on your progress: {getDefaultLevel(userMasteryLevel)}
              </p>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Finding the best educational video for you...</span>
            </div>
          )}

          {!loading && hasSearched && videoRecommendation && (
            <>
              {/* Video Player */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoRecommendation.videoId}?rel=0&modestbranding=1`}
                  title={videoRecommendation.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>

              {/* Video Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-2">
                  {videoRecommendation.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  {videoRecommendation.description}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Duration: {videoRecommendation.duration}
                </p>
              </div>
            </>
          )}

          <Button 
            onClick={onVideoWatched} 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg py-3"
          >
            I've Watched the Video! Continue →
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default YouTubeVideoPlayer;
