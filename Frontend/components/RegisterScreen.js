import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput, Button, Checkbox } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './config/api';
import { AuthContext } from './context/AuthContext';

const RegisterScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('WAITER');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const { setIsLoggedIn } = useContext(AuthContext);

    const roleOptions = ['WAITER', 'ADMIN', 'CHEF', 'CUSTOMER'];

    const validatePasswords = (pass = password, confirm = confirmPassword) => {
        if (pass && confirm && pass !== confirm) {
            setPasswordError('Passwords do not match');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const handlePasswordChange = (text) => {
        setPassword(text);
        validatePasswords(text, confirmPassword);
    };

    const handleConfirmPasswordChange = (text) => {
        setConfirmPassword(text);
        validatePasswords(password, text);
    };

    const handleRoleChange = (selectedRole) => {
        setRole(selectedRole);
    };

    const handleRegister = async () => {
        setLoading(true);
        setError('');

        if (!username || !password || !confirmPassword) {
            setError('All fields are required');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            console.log("Sending registration request...");

            console.log({
                username,
                password,
                role,
            });

            const registerResponse = await api.post('users/register', {
                username,
                password,
                role,
            });

            console.log("Registration response:", registerResponse);

            if (registerResponse.status == 200) {
                const loginResponse = await api.post('users/login', {
                    username,
                    password
                });

                console.log("Login response:", loginResponse);

                const { token, username: user, role, staffId } = loginResponse.data;

                await AsyncStorage.setItem('jwtToken', token);
                await AsyncStorage.setItem('username', user);
                await AsyncStorage.setItem('role', role);
                await AsyncStorage.setItem('staffId', staffId ? String(staffId) : '');

                setIsLoggedIn(true);
            }
        } catch (err) {
            console.error('Registration error:', err);

            if (err.response) {
                console.error('Error response:', err.response);
                setError(err.response?.data?.message || 'Registration failed. Please try again.');
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const isFormValid =
        username &&
        password &&
        confirmPassword &&
        password === confirmPassword &&
        role;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Register</Text>

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
                onChangeText={handlePasswordChange}
                style={styles.input}
                secureTextEntry
            />

            <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                style={styles.input}
                secureTextEntry
                error={!!passwordError}
            />

            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.subtitle}>Select Role:</Text>
            {roleOptions.map((roleOption) => (
                <View key={roleOption} style={styles.checkboxContainer}>
                    <Checkbox
                        status={role === roleOption ? 'checked' : 'unchecked'}
                        onPress={() => handleRoleChange(roleOption)}
                    />
                    <Text>{roleOption}</Text>
                </View>
            ))}

            <Button
                mode="contained"
                onPress={handleRegister}
                style={styles.button}
                loading={loading}
                disabled={!isFormValid || loading}
            >
                Register
            </Button>

            <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
            >
                Cancel
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
    subtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    input: {
        marginBottom: 12,
    },
    button: {
        marginTop: 16,
    },
    cancelButton: {
        marginTop: 12,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 8,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
});

export default RegisterScreen;
