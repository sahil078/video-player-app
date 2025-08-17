import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Embedded sample subtitles as fallback
const EMBEDDED_SUBTITLES = `[Script Info]
Title: Sample ASS Subtitles
ScriptType: v4.00+
WrapStyle: 1
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:04.00,Default,,0,0,0,,{\\b1}Welcome to the Video Player{\\b0}
Dialogue: 0,0:00:04.50,0:00:08.00,Default,,0,0,0,,{\\i1}This is italic text{\\i0}
Dialogue: 0,0:00:08.50,0:00:12.00,Default,,0,0,0,,{\\u1}This is underlined text{\\u0}
Dialogue: 0,0:00:12.50,0:00:16.00,Default,,0,0,0,,{\\s1}This is strikethrough text{\\s0}
Dialogue: 0,0:00:16.50,0:00:20.00,Default,,0,0,0,,{\\c&HFF0000&}This is red text{\\c&HFFFFFF&}
Dialogue: 0,0:00:20.50,0:00:24.00,Default,,0,0,0,,{\\b1\\i1\\c&H00FF00&}Bold, italic, and green text{\\b0\\i0\\c&HFFFFFF&}
Dialogue: 0,0:00:24.50,0:00:28.00,Default,,0,0,0,,{\\b1\\c&H0000FF&}Blue bold text{\\b0\\c&HFFFFFF&}
Dialogue: 0,0:00:28.50,0:00:32.00,Default,,0,0,0,,{\\i1\\c&HFFFF00&}Yellow italic text{\\i0\\c&HFFFFFF&}
Dialogue: 0,0:00:32.50,0:00:36.00,Default,,0,0,0,,{\\b1\\i1\\u1\\c&HFF00FF&}Purple bold italic underlined{\\b0\\i0\\u0\\c&HFFFFFF&}
Dialogue: 0,0:00:36.50,0:00:40.00,Default,,0,0,0,,{\\b1\\c&H00FFFF&}Cyan bold text{\\b0\\c&HFFFFFF&}
Dialogue: 0,0:00:40.50,0:00:44.00,Default,,0,0,0,,{\\i1\\c&HFF8000&}Orange italic text{\\i0\\c&HFFFFFF&}
Dialogue: 0,0:00:44.50,0:00:48.00,Default,,0,0,0,,{\\b1\\i1\\s1\\c&H8000FF&}Violet bold italic strikethrough{\\b0\\i0\\s0\\c&HFFFFFF&}
Dialogue: 0,0:00:48.50,0:00:52.00,Default,,0,0,0,,{\\b1\\c&H008000&}Green bold text{\\b0\\c&HFFFFFF&}
Dialogue: 0,0:00:52.50,0:00:56.00,Default,,0,0,0,,{\\i1\\c&H800080&}Purple italic text{\\i0\\c&HFFFFFF&}
Dialogue: 0,0:00:56.50,0:01:00.00,Default,,0,0,0,,{\\b1\\i1\\u1\\s1\\c&H000080&}Dark blue with all effects{\\b0\\i0\\u0\\s0\\c&HFFFFFF&}
Dialogue: 0,0:01:00.50,0:01:04.00,Default,,0,0,0,,{\\b1}Thank you for watching!{\\b0}
Dialogue: 0,0:01:04.50,0:01:08.00,Default,,0,0,0,,{\\i1}ASS subtitles working perfectly{\\i0}
Dialogue: 0,0:01:08.50,0:01:12.00,Default,,0,0,0,,{\\c&H00FF00&}Green success message{\\c&HFFFFFF&}
Dialogue: 0,0:01:12.50,0:01:16.00,Default,,0,0,0,,{\\b1\\c&HFF0000&}Red bold final message{\\b0\\c&HFFFFFF&}`;

// ASS Subtitle Parser and Renderer
class ASSSubtitleRenderer {
  constructor() {
    this.subtitles = [];
    this.currentSubtitle = null;
  }

  // Parse ASS file content
  parseASS(assContent) {
    const lines = assContent.split('\n');
    const events = [];
    let inEvents = false;
    let format = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '[Events]') {
        inEvents = true;
        continue;
      }
      
      if (line.startsWith('Format:')) {
        format = line.substring(7).split(',').map(f => f.trim());
        continue;
      }
      
      if (inEvents && line.startsWith('Dialogue:')) {
        const dialogue = line.substring(9).split(',');
        if (dialogue.length >= format.length) {
          const event = {};
          format.forEach((key, index) => {
            event[key] = dialogue[index] || '';
          });
          
          // Parse timing
          const startTime = this.parseTime(event.Start);
          const endTime = this.parseTime(event.End);
          
          if (startTime !== null && endTime !== null) {
            events.push({
              start: startTime,
              end: endTime,
              text: event.Text || '',
              style: event.Style || 'Default',
              effect: event.Effect || '',
              layer: parseInt(event.Layer) || 0,
            });
          }
        }
      }
    }

    this.subtitles = events.sort((a, b) => a.start - b.start);
    console.log('Parsed subtitles:', this.subtitles.length);
    return this.subtitles;
  }

  // Parse ASS time format (H:MM:SS.cc)
  parseTime(timeStr) {
    if (!timeStr) return null;
    
    const match = timeStr.match(/(\d+):(\d{2}):(\d{2})\.(\d{2})/);
    if (!match) return null;
    
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const seconds = parseInt(match[3]);
    const centiseconds = parseInt(match[4]);
    
    return (hours * 3600 + minutes * 60 + seconds) * 1000 + centiseconds * 10;
  }

  // Get current subtitle based on video time
  getCurrentSubtitle(currentTime) {
    const timeMs = currentTime * 1000;
    const subtitle = this.subtitles.find(sub => 
      timeMs >= sub.start && timeMs <= sub.end
    );
    
    if (subtitle) {
      console.log('Current subtitle:', subtitle.text, 'at time:', currentTime);
    }
    
    return subtitle || null;
  }

  // Parse ASS text formatting and styling
  parseStyledText(text) {
    if (!text) return [];
    
    const segments = [];
    let currentText = '';
    let currentStyle = {};
    
    // Simple ASS tag parsing (basic implementation)
    const tags = text.match(/\{[^}]*\}/g) || [];
    let lastIndex = 0;
    
    tags.forEach(tag => {
      const tagIndex = text.indexOf(tag, lastIndex);
      if (tagIndex > lastIndex) {
        currentText += text.substring(lastIndex, tagIndex);
      }
      
      // Parse common ASS tags
      if (tag.includes('\\b1')) currentStyle.bold = true;
      else if (tag.includes('\\b0')) currentStyle.bold = false;
      else if (tag.includes('\\i1')) currentStyle.italic = true;
      else if (tag.includes('\\i0')) currentStyle.italic = false;
      else if (tag.includes('\\u1')) currentStyle.underline = true;
      else if (tag.includes('\\u0')) currentStyle.underline = false;
      else if (tag.includes('\\s1')) currentStyle.strikeout = true;
      else if (tag.includes('\\s0')) currentStyle.strikeout = false;
      
      // Color parsing
      const colorMatch = tag.match(/\\c&H([0-9A-Fa-f]{6})&/);
      if (colorMatch) {
        const colorHex = colorMatch[1];
        currentStyle.color = `#${colorHex}`;
      }
      
      lastIndex = tagIndex + tag.length;
    });
    
    if (lastIndex < text.length) {
      currentText += text.substring(lastIndex);
    }
    
    if (currentText.trim()) {
      segments.push({
        text: currentText.trim(),
        style: { ...currentStyle }
      });
    }
    
    return segments.length > 0 ? segments : [{ text: text.trim(), style: {} }];
  }
}

// Subtitle Display Component
const SubtitleDisplay = ({ subtitle, videoWidth, videoHeight }) => {
  if (!subtitle) return null;

  const renderer = new ASSSubtitleRenderer();
  const segments = renderer.parseStyledText(subtitle.text);

  return (
    <View style={[styles.subtitleContainer, { width: videoWidth, height: videoHeight }]}>
      {segments.map((segment, index) => (
        <Text
          key={index}
          style={[
            styles.subtitleText,
            segment.style.bold && styles.boldText,
            segment.style.italic && styles.italicText,
            segment.style.underline && styles.underlineText,
            segment.style.strikeout && styles.strikeoutText,
            segment.style.color && { color: segment.style.color },
          ]}
        >
          {segment.text}
        </Text>
      ))}
    </View>
  );
};

// Video Player Component
const VideoPlayer = ({ videoUri, subtitleUri }) => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [currentSubtitle, setCurrentSubtitle] = useState(null);
  const [subtitleRenderer, setSubtitleRenderer] = useState(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [videoError, setVideoError] = useState(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  useEffect(() => {
    if (subtitleUri) {
      loadSubtitles();
    }
  }, [subtitleUri]);

  useEffect(() => {
    if (subtitleRenderer && currentTime > 0) {
      const subtitle = subtitleRenderer.getCurrentSubtitle(currentTime);
      setCurrentSubtitle(subtitle);
    }
  }, [currentTime, subtitleRenderer]);

  const loadSubtitles = async () => {
    try {
      console.log('Loading subtitles from:', subtitleUri);
      
      if (subtitleUri === 'embedded') {
        // Use embedded subtitles
        console.log('Using embedded subtitles');
        const renderer = new ASSSubtitleRenderer();
        renderer.parseASS(EMBEDDED_SUBTITLES);
        setSubtitleRenderer(renderer);
        return;
      }
      
      const response = await fetch(subtitleUri);
      const assContent = await response.text();
      console.log('Subtitle content loaded, length:', assContent.length);
      
      const renderer = new ASSSubtitleRenderer();
      renderer.parseASS(assContent);
      setSubtitleRenderer(renderer);
    } catch (error) {
      console.error('Error loading subtitles:', error);
      // Fallback to embedded subtitles
      console.log('Falling back to embedded subtitles');
      const renderer = new ASSSubtitleRenderer();
      renderer.parseASS(EMBEDDED_SUBTITLES);
      setSubtitleRenderer(renderer);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    console.log('Playback status update:', status);
    setStatus(status);
    setIsPlaying(status.isPlaying);
    setCurrentTime(status.positionMillis / 1000);
    setDuration(status.durationMillis / 1000);
    
    if (status.videoWidth && status.videoHeight) {
      setVideoDimensions({
        width: status.videoWidth,
        height: status.videoHeight
      });
    }
  };

  const onVideoLoad = (data) => {
    console.log('Video loaded successfully:', data);
    setIsVideoLoading(false);
    setVideoError(null);
    setVideoDimensions({
      width: data.naturalSize.width,
      height: data.naturalSize.height
    });
  };

  const onVideoError = (error) => {
    console.error('Video error:', error);
    setVideoError(error);
    setIsVideoLoading(false);
    Alert.alert('Video Error', 'Failed to load video. Please check your internet connection and try again.');
  };

  const togglePlayPause = async () => {
    try {
      if (isPlaying) {
        await videoRef.current?.pauseAsync();
      } else {
        await videoRef.current?.playAsync();
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      Alert.alert('Playback Error', 'Failed to control video playback.');
    }
  };

  const seekTo = async (time) => {
    try {
      const clampedTime = Math.max(0, Math.min(time, duration));
      await videoRef.current?.setPositionAsync(clampedTime * 1000);
      setCurrentTime(clampedTime);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  // Forward seeking functions
  const seekForward = async (seconds = 10) => {
    const newTime = currentTime + seconds;
    await seekTo(newTime);
  };

  const seekBackward = async (seconds = 10) => {
    const newTime = currentTime - seconds;
    await seekTo(newTime);
  };

  // Small seek functions
  const seekForwardSmall = async () => {
    await seekForward(5);
  };

  const seekBackwardSmall = async () => {
    await seekBackward(5);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        {/* Video Loading Indicator */}
        {isVideoLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}

        {/* Video Error Display */}
        {videoError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Video failed to load</Text>
            <Text style={styles.errorSubtext}>Check your internet connection</Text>
          </View>
        )}

        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: videoUri }}
          useNativeControls={false}
          resizeMode={ResizeMode.CONTAIN}
          isLooping={false}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onLoad={onVideoLoad}
          onError={onVideoError}
          shouldPlay={false}
          isMuted={false}
        />
        
        {/* Subtitles Overlay */}
        <SubtitleDisplay
          subtitle={currentSubtitle}
          videoWidth={videoDimensions.width || screenWidth}
          videoHeight={videoDimensions.height || screenHeight * 0.6}
        />
        
        {/* Touch to toggle controls */}
        <TouchableOpacity
          style={styles.videoTouchArea}
          onPress={toggleControls}
          activeOpacity={1}
        />
      </View>

      {/* Video Controls */}
      {showControls && (
        <View style={styles.controlsContainer}>
          {/* Main Control Row */}
          <View style={styles.mainControlsRow}>
            {/* Backward Seek Button */}
            <TouchableOpacity
              style={styles.seekButton}
              onPress={seekBackwardSmall}
            >
              <Ionicons name="play-back" size={20} color="white" />
              <Text style={styles.seekButtonText}>5s</Text>
            </TouchableOpacity>

            {/* Play/Pause Button */}
            <TouchableOpacity
              style={styles.controlButton}
              onPress={togglePlayPause}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={32}
                color="white"
              />
            </TouchableOpacity>

            {/* Forward Seek Button */}
            <TouchableOpacity
              style={styles.seekButton}
              onPress={seekForwardSmall}
            >
              <Ionicons name="play-forward" size={20} color="white" />
              <Text style={styles.seekButtonText}>5s</Text>
            </TouchableOpacity>
          </View>

          {/* Secondary Control Row */}
          <View style={styles.secondaryControlsRow}>
            {/* Large Backward Seek */}
            <TouchableOpacity
              style={styles.largeSeekButton}
              onPress={() => seekBackward(30)}
            >
              <Ionicons name="play-back" size={16} color="white" />
              <Text style={styles.largeSeekButtonText}>30s</Text>
            </TouchableOpacity>

            {/* Time Display */}
            <Text style={styles.timeText}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>

            {/* Large Forward Seek */}
            <TouchableOpacity
              style={styles.largeSeekButton}
              onPress={() => seekForward(30)}
            >
              <Ionicons name="play-forward" size={16} color="white" />
              <Text style={styles.largeSeekButtonText}>30s</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(currentTime / duration) * 100}%` }
                ]}
              />
            </View>
            <TouchableOpacity
              style={styles.progressTouchable}
              onPress={(event) => {
                const { locationX } = event.nativeEvent;
                const progressBarWidth = event.target.measure((x, y, width) => {
                  const progress = locationX / width;
                  const seekTime = progress * duration;
                  seekTo(seekTime);
                });
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
    minHeight: 400,
    height: '70%',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 400,
  },
  videoTouchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    zIndex: 1000,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  subtitleContainer: {
    position: 'absolute',
    bottom: 20, // Position at bottom of video
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  subtitleText: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    fontWeight: '600',
  },
  boldText: {
    fontWeight: 'bold',
  },
  italicText: {
    fontStyle: 'italic',
  },
  underlineText: {
    textDecorationLine: 'underline',
  },
  strikeoutText: {
    textDecorationLine: 'line-through',
  },
  controlsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 20,
    height: '30%',
    justifyContent: 'space-between',
  },
  mainControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  secondaryControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  controlButton: {
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  seekButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  seekButtonText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '600',
  },
  largeSeekButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  largeSeekButtonText: {
    color: 'white',
    fontSize: 11,
    marginLeft: 3,
    fontWeight: '500',
  },
  timeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 100,
    textAlign: 'center',
  },
  progressContainer: {
    position: 'relative',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressTouchable: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    bottom: -10,
  },
});

export default VideoPlayer; 