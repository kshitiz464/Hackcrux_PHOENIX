import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, signInWithEmailAndPassword } from '../constants/firebaseConfig';
import { BlurView } from 'expo-blur';

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      Alert.alert('Success', 'Login Successful!', [
        { text: 'OK', onPress: () => router.replace('./(drawer)/home') },
      ]);
    } catch (error) {
      console.error('Error logging in:', error);
      let errorMessage = 'Login failed. Please try again.';
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'The email address is invalid.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'There is no user record corresponding to this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Wrong password. Please try again.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'The login details was invalid.';
      }
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <ImageBackground source={require('../assets/images/login3.jpg')} style={styles.background}>
      <View style={styles.overlay}>
        <Text style={styles.title}>AgriFlow</Text>

        <BlurView intensity={50} tint="light" style={styles.inputBlur}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </BlurView>

        <BlurView intensity={50} tint="light" style={styles.inputBlur}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </BlurView>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('./register')}>
          <Text style={styles.registerButtonText}>Create New Account</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.3)', // Subtle dark overlay for contrast
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2C7865', // Dark green title for contrast
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 40,
    fontFamily: 'serif',
  },
  inputBlur: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  input: {
    width: '100%',
    height: '100%',
    color: '#333', // Dark input text
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  registerButtonText: {
    marginTop: 20,
    color: '#2C7865', // Dark green for better visibility
    fontSize: 18,
    fontWeight: 'bold',
  },
});
