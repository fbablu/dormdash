import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

interface UserProfile {
  name: string;
  email: string;
  phoneNumber: string;
  paymentMethods: string[];
  favorites: string[];
  defaultAddress: string;
  notificationsEnabled: boolean;
}

export default function Page() {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phoneNumber: '',
    paymentMethods: [],
    favorites: [],
    defaultAddress: '',
    notificationsEnabled: true,
  });

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      if (!currentUser) {
        router.replace('/');
        return;
      }

      // TODO: Replace with your actual API endpoint
      const response = await fetch(`/api/users/${currentUser.user.id}`);
      const data = await response.json();
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
    }
  };

  const handleSignOut = async () => {
    try {
      await GoogleSignin.signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateUserInfo = async (name: string, phoneNumber: string) => {
    try {
      // TODO: Replace with your actual API endpoint
      await fetch('/api/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phoneNumber }),
      });
      
      setUserProfile(prev => ({ ...prev, name, phoneNumber }));
      setShowInfoModal(false);
    } catch (error) {
      console.error('Error updating user info:', error);
      Alert.alert('Error', 'Failed to update information');
    }
  };

  const InfoModal = () => (
    <Modal
      visible={showInfoModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>My Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={userProfile.name}
            onChangeText={(text) => setUserProfile(prev => ({ ...prev, name: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={userProfile.phoneNumber}
            keyboardType="phone-pad"
            onChangeText={(text) => setUserProfile(prev => ({ ...prev, phoneNumber: text }))}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => updateUserInfo(userProfile.name, userProfile.phoneNumber)}
            >
              <Text>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowInfoModal(false)}
            >
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const MenuItem = ({ icon, title, onPress }: { icon: keyof typeof Feather.glyphMap, title: string, onPress: () => void }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Feather name={icon} size={24} color="black" />
      <Text style={styles.menuItemText}>{title}</Text>
      <Feather name="chevron-right" size={24} color="black" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.heading}>Profile</Text>
        
        <View style={styles.section}>
          <MenuItem 
            icon="user" 
            title="My Information" 
            onPress={() => setShowInfoModal(true)} 
          />
          <MenuItem 
            icon="credit-card" 
            title="Payment" 
            onPress={() => setShowPaymentModal(true)} 
          />
          <MenuItem 
            icon="heart" 
            title="Favorites" 
            onPress={() => router.push('/favorites')} 
          />
          <MenuItem 
            icon="help-circle" 
            title="Support" 
            onPress={() => Linking.openURL('mailto:dormdash@gmail.com')} 
          />
        </View>

        <Text style={styles.heading}>Account Settings</Text>
        
        <View style={styles.section}>
          <MenuItem 
            icon="bell" 
            title="Notifications" 
            onPress={() => setShowNotificationsModal(true)} 
          />
          <MenuItem 
            icon="map-pin" 
            title="Address" 
            onPress={() => setShowAddressModal(true)} 
          />
          <MenuItem 
            icon="log-out" 
            title="Sign Out" 
            onPress={handleSignOut} 
          />
        </View>
      </ScrollView>

      <InfoModal />
      {/* Add other modals here */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#cfae70',
  },
  cancelButton: {
    backgroundColor: '#ddd',
  },
});
