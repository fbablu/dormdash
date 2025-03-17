// app/components/onboarding/RegisterScreen.tsx
// Contributors: @Fardeen Bablu, @Yuening Li
// Time spent: 2 hour

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Color } from '@/GlobalStyles';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const RegisterScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <View style={styles.iconBackground}>
          <Feather name="user-plus" size={width * 0.2} color={Color.colorBurlywood} />
        </View>
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Easy Dorm Delivery</Text>
        <Text style={styles.description}>
          DormDash connects Vanderbilt students with campus food delivery. 
          Create an account to start enjoying convenient food delivery directly to your dorm.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  imageContainer: {
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: Color.colorBlack,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});

export default RegisterScreen;