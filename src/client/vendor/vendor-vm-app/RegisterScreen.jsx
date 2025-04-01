import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = () => {
    if (email && password) {
      // Default registration assigns a 'maintainer' role.
      navigation.navigate('Dashboard', { user: { email, role: 'maintainer' } });
    } else {
      setError("Please fill in all fields.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Register</Text>
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
      <Button title="Register" onPress={handleRegister} />
      <Button title="Back to Login" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center'
  },
  header: {
    fontSize: 26,
    marginBottom: 10
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 10
  },
  error: {
    color: 'red'
  }
});
