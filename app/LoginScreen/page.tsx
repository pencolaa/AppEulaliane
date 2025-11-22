// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

// Cores diretas para facilitar
const colors = { primary: "#4FC3F7", secondary: "#0288D1" };

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    const user = await AsyncStorage.getItem("user_session");
    if (user) router.replace("/HomePage/page");
  };

  const handleLogin = async () => {
    if (email.length > 3) {
      await AsyncStorage.setItem("user_session", email);
      router.replace("/HomePage/page");
    } else {
      Alert.alert("Erro", "Digite um e-mail válido.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoArea}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>Food</Text>
        </View>
        <Text style={styles.title}>Bem-vindo!</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Seu e-mail"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        placeholder="Sua senha"
        secureTextEntry
        placeholderTextColor="#999"
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>ENTRAR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FFF",
  },
  logoArea: { alignItems: "center", marginBottom: 50 },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  logoText: { color: "#FFF", fontSize: 24, fontWeight: "bold" },
  title: { fontSize: 28, color: colors.secondary, fontWeight: "bold" },
  input: {
    height: 50,
    borderColor: colors.primary,
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#F0F8FF",
  },
  button: {
    backgroundColor: colors.secondary,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});
