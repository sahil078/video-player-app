import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import VideoPlayer from './components/VideoPlayer';

export default function App() {
  // Use working subtitle URLs
  const [videoUri, setVideoUri] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [subtitleUri, setSubtitleUri] = useState('https://raw.githubusercontent.com/SubtitleEdit/subtitleedit/master/TestFiles/ass/ass_sample.ass');
  const [subtitleStatus, setSubtitleStatus] = useState('Loading subtitles...');

  // Test subtitle loading
  useEffect(() => {
    testSubtitleLoading();
  }, []);

  const testSubtitleLoading = async () => {
    try {
      // Try to load the remote subtitle file
      const response = await fetch('https://raw.githubusercontent.com/SubtitleEdit/subtitleedit/master/TestFiles/ass/ass_sample.ass');
      if (response.ok) {
        const content = await response.text();
        setSubtitleStatus(`Subtitles loaded: ${content.length} characters`);
        console.log('Subtitle content preview:', content.substring(0, 200));
        setSubtitleUri('https://raw.githubusercontent.com/SubtitleEdit/subtitleedit/master/TestFiles/ass/ass_sample.ass');
      } else {
        // Fallback to a different working subtitle URL
        const fallbackResponse = await fetch('https://gist.githubusercontent.com/SubtitleEdit/ass_sample/raw/master/ass_sample.ass');
        if (fallbackResponse.ok) {
          const fallbackContent = await fallbackResponse.text();
          setSubtitleUri('https://gist.githubusercontent.com/SubtitleEdit/ass_sample/raw/master/ass_sample.ass');
          setSubtitleStatus(`Fallback subtitles loaded: ${fallbackContent.length} characters`);
        } else {
          setSubtitleStatus('Failed to load remote subtitles. Using embedded sample.');
          // Use embedded sample subtitles as last resort
          setSubtitleUri('embedded');
        }
      }
    } catch (error) {
      console.error('Error loading subtitles:', error);
      setSubtitleStatus('Error loading subtitles. Using embedded sample.');
      setSubtitleUri('embedded');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Video Player with ASS Subtitles</Text>
        <Text style={styles.headerSubtitle}>React Native + Expo</Text>
        <Text style={styles.subtitleStatus}>{subtitleStatus}</Text>
      </View>

      {/* Video Player */}
      <View style={styles.videoSection}>
        <VideoPlayer
          videoUri={videoUri}
          subtitleUri={subtitleUri}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    color: '#007AFF',
    fontSize: 16,
    marginBottom: 10,
  },
  subtitleStatus: {
    color: '#00FF00',
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  videoSection: {
    flex: 1,
    minHeight: 400,
  },
});
