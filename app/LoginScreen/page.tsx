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

// --- IMPORTAÇÕES DO FIREBASE ---
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebaseConfig"; // Ajuste o caminho conforme sua estrutura

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

    setLoading(true);
    try {
      // --- LOGIN COM FIREBASE ---
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // Prepara os dados do usuário para salvar na sessão do app
      // O 'displayName' virá preenchido se o registro foi feito corretamente
      const userData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || "Usuário"
      };

      // Salva no armazenamento local para manter a sessão
      await AsyncStorage.setItem("user_session", JSON.stringify(userData));

      // Redireciona para a Home
      router.replace("/HomePage/page");

    } catch (error) {
      console.log(error);
      let msg = "Erro ao fazer login.";
      
      // Tratamento de erros comuns do Firebase
      // Nota: O Firebase atualizou alguns códigos de erro recentemente
      const code = error.code;
      
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        msg = "E-mail ou senha incorretos.";
      } else if (code === 'auth/invalid-email') {
        msg = "Formato de e-mail inválido.";
      } else if (code === 'auth/too-many-requests') {
        msg = "Muitas tentativas falhas. Aguarde um pouco e tente novamente.";
      } else if (code === 'auth/network-request-failed') {
        msg = "Verifique sua conexão com a internet.";
      }

      Alert.alert("Acesso Negado", msg);
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

      {/* --- BOTÃO DE CADASTRO --- */}
      <TouchableOpacity
        style={styles.registerLink}
        onPress={() => router.push("/RegisterScreen/page")}
      >
        <Text style={styles.registerText}>
          Não possui cadastro? <Text style={styles.registerBold}>Cadastre-se</Text>
        </Text>
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

  // Estilos do link de cadastro
  registerLink: {
    marginTop: 20,
    alignItems: "center",
    padding: 10, // Aumenta a área de toque
  },
  registerText: {
    color: colors.secondary,
    fontSize: 16,
  },
  registerBold: {
    fontWeight: "bold",
    textDecorationLine: "underline", // Opcional: sublinha para parecer mais link
  },
});