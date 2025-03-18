import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import api from './config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './context/AuthContext';


const LoginScreen = ({ navigation }) => {
    const { setIsLoggedIn } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/users/login', {
                username,
                password,
            });

            const { token, username: user, roles } = response.data;

            if (token) {
                await AsyncStorage.setItem('jwtToken', token);
                await AsyncStorage.setItem('username', user);
                await AsyncStorage.setItem('roles', JSON.stringify(roles));

                console.log('JWT Token:', token);
                console.log('Username:', user);
                console.log('Roles:', roles);

                setIsLoggedIn(true);
            }
        } catch (err) {
            setError('Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>

            <TextInput
                label="Username"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                autoCapitalize="none"
                autoComplete="off"
            />

            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.button}
                loading={loading}
                disabled={loading || !username || !password}
            >
                Login
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        marginBottom: 12,
    },
    button: {
        marginTop: 16,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 8,
    },
});

export default LoginScreen;