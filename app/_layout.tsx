// app/_layout.tsx
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Feather } from '@expo/vector-icons';

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  useEffect(() => {
    setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 1000);
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#cfae70',
          height: 71,
          paddingBottom: 10
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="deliver"
        options={{
          title: 'Deliver',
          tabBarIcon: ({ color }) => (
            <Feather name="package" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'My Orders',
          tabBarIcon: ({ color }) => (
            <Feather name="list" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}