import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import VideoPlayer from './components/VideoPlayer';

export default function App() {
  // Use a reliable video URL and local subtitle file
  const [videoUri, setVideoUri] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [subtitleUri, setSubtitleUri] = useState('./sample_subtitles.ass');
  const [subtitleStatus, setSubtitleStatus] = useState('Loading local subtitles...');

  // Test subtitle loading
  useEffect(() => {
    testSubtitleLoading();
  }, []);

  const testSubtitleLoading = async () => {
    try {
      // Try to load the local file first
      const response = await fetch('./sample_subtitles.ass');
      if (response.ok) {
        const content = await response.text();
        setSubtitleStatus(`Subtitles loaded: ${content.length} characters`);
        console.log('Subtitle content preview:', content.substring(0, 200));
      } else {
        setSubtitleStatus('Local file not found, trying remote...');
        const remoteResponse = await fetch('https://raw.githubusercontent.com/SubtitleEdit/subtitleedit/master/TestFiles/ass/ass_sample.ass');
        if (remoteResponse.ok) {
          const remoteContent = await remoteResponse.text();
          setSubtitleUri('https://raw.githubusercontent.com/SubtitleEdit/subtitleedit/master/TestFiles/ass/ass_sample.ass');
          setSubtitleStatus(`Remote subtitles loaded: ${remoteContent.length} characters`);
        } else {
          setSubtitleStatus('Failed to load subtitles. Check console for errors.');
          Alert.alert('Subtitle Error', 'Failed to load subtitles. The video will play without subtitles.');
        }
      }
    } catch (error) {
      setSubtitleStatus(`Error: ${error.message}`);
      Alert.alert('Subtitle Error', 'Failed to load subtitles. The video will play without subtitles.');
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
  instructionsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  instructionsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructionsText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
});
