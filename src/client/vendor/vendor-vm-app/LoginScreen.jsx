import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (email && password) {
      navigation.navigate('Dashboard', { user: { email, role: 'maintainer' } });
    } else {
      setError("Please enter email and password.");
    }
  };

  const handleGoogleLogin = () => {
    navigation.navigate('Dashboard', { user: { email: 'googleuser@example.com', role: 'maintainer' } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginBox}>
        <Text style={styles.header}>Login</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput 
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput 
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <View style={styles.buttonContainer}>
          <Button title="Login" onPress={handleLogin} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Login with Google" onPress={handleGoogleLogin} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Register" onPress={() => navigation.navigate('Register')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loginBox: {
    width: '50%', // Half the screen width
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    height: 40,  // Suitable height for text entry
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 5,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});
