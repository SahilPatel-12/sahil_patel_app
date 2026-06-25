import React from 'react';
import { Tabs } from 'expo-router';
import AnimatedTabBar from '../../components/AnimatedTabBar';
import Header from '../../components/Header';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        header: () => <Header />,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="puja"
        options={{
          title: 'Puja',
        }}
      />
      <Tabs.Screen
        name="god"
        options={{
          title: 'Darshan',
        }}
      />
      <Tabs.Screen
        name="astro"
        options={{
          title: 'Astro',
        }}
      />
      <Tabs.Screen
        name="music"
        options={{
          title: 'Music',
        }}
      />
    </Tabs>
  );
}
