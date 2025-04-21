import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Layout, Input, Button, Text } from '@ui-kitten/components';
import  api  from './apiCommunicator';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      // using email as u_name for now
      const user = await api.createUser({ u_name: email, email, password });
      navigation.navigate('Dashboard', { user });
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Layout style={styles.container}>
      <Text category='h4' style={styles.header}>Create Account</Text>
      {error ? <Text status='danger' style={styles.error}>{error}</Text> : null}
      <Input
        style={styles.input}
        placeholder='Email'
        autoCapitalize='none'
        value={email}
        onChangeText={setEmail}
      />
      <Input
        style={styles.input}
        placeholder='Password'
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button style={styles.button} onPress={handleRegister}>REGISTER</Button>
      <Button appearance='ghost' style={styles.button} onPress={() => navigation.goBack()}>BACK TO LOGIN</Button>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:24 },
  header: { marginBottom:20 },
  error: { marginBottom:10 },
  input: { width:'100%', marginBottom:15 },
  button: { width:'100%', marginVertical:5 },
});
