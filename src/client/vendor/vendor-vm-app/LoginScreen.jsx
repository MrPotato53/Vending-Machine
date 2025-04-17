import React, { useState } from 'react';
import { StyleSheet, Image, Dimensions } from 'react-native';
import { Layout, Input, Button, Text } from '@ui-kitten/components';

const { width } = Dimensions.get('window');
const quarterWidth = width * 0.25;

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (email && password) {
      navigation.navigate('Dashboard', { user: { email, role: 'maintainer' } });
    } else {
      setError('Please enter email and password.');
    }
  };

  const handleGoogleLogin = () => {
    navigation.navigate('Dashboard', { user: { email: 'googleuser@example.com', role: 'maintainer' } });
  };

  return (
    <Layout style={styles.container}>
      <Text category='h4' style={styles.header}>Welcome Back</Text>
      {error ? <Text status='danger' style={styles.error}>{error}</Text> : null}

      <Input
        style={[styles.input, { width: quarterWidth }]}
        placeholder='Email'
        value={email}
        onChangeText={setEmail}
      />
      <Input
        style={[styles.input, { width: quarterWidth }]}
        placeholder='Password'
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button style={[styles.button, { width: quarterWidth }]} onPress={handleLogin}>
        LOGIN
      </Button>
      <Button appearance='outline' style={[styles.button, { width: quarterWidth }]} onPress={handleGoogleLogin}>
        LOGIN WITH GOOGLE
      </Button>
      <Button appearance='ghost' style={[styles.button, { width: quarterWidth }]} onPress={() => navigation.navigate('Register')}>
        REGISTER
      </Button>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'white',
  },
  logo: {
    width: quarterWidth,
    height: quarterWidth,
    marginBottom: 20,
  },
  header: {
    marginBottom: 20,
    color: '#333',
  },
  error: {
    marginBottom: 10,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginVertical: 5,
  },
});
