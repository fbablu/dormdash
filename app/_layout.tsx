import { Stack } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Animated, View, Text, StyleSheet } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(async () => {
        await SplashScreen.hideAsync();
      });
    }, 1000);
  }, []);

  return (
    <View style={styles.container}>
      <Stack />
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={styles.main}>
          <Text style={styles.subtitle}>Hello</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 24,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 960,
    marginHorizontal: 'auto',
  },
  subtitle: {
    fontSize: 36,
    color: '#38434D',
  },
});