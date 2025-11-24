// @ts-nocheck
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Cores diretas para facilitar
const colors = { primary: "#4FC3F7", secondary: "#0288D1" };

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    const user = await AsyncStorage.getItem("user_session");
    if (user) router.replace("/HomePage/page");
  };

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }
      // Mock login para testes sem backend
    if(email == 'test@test.com' && senha == 'test'){
      await AsyncStorage.setItem("user_session", JSON.stringify({email: 'test'}));
      router.replace("/HomePage/page");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://192.168.0.24:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: senha }),
      });

      const data = await res.json();

      if (res.ok) {
        await AsyncStorage.setItem("user_session", JSON.stringify(data));
        router.replace("/HomePage/page");
      } else {
        Alert.alert("Erro", data.message || "Credenciais inválidas.");
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível conectar ao servidor.");
      console.error(error);
    } finally {
      setLoading(false);
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
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Sua senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        placeholderTextColor="#999"
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>ENTRAR</Text>
        )}
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});
