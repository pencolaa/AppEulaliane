// @ts-nocheck
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";

// --- IMPORTAÇÕES DO FIREBASE ---
// Aqui chamamos as funções reais de criar conta e atualizar perfil
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
// Importamos a configuração que criamos no arquivo firebaseConfig.ts
import { auth } from "../../firebaseConfig"; 

const colors = { primary: "#4FC3F7", secondary: "#0288D1" };

export default function RegisterScreen() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    // 1. Validação Básica
    if (!nome || !email || !senha) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      // 2. CRIA A CONTA NO FIREBASE
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // 3. ATUALIZA O NOME DO USUÁRIO NO PERFIL
      await updateProfile(user, {
        displayName: nome
      });

      // 4. SALVA OS DADOS NA SESSÃO LOCAL (ASYNCSTORAGE)
      const userData = {
        uid: user.uid,
        email: user.email,
        name: nome
      };
      await AsyncStorage.setItem("user_session", JSON.stringify(userData));

      // 5. SUCESSO E REDIRECIONAMENTO
      Alert.alert("Bem-vindo!", "Sua conta foi criada com sucesso.");
      router.replace("/HomePage/page");

    } catch (error) {
      console.log(error);
      let msg = "Não foi possível criar a conta.";
      
      // Tratamento de erros comuns do Firebase em Português
      if (error.code === 'auth/email-already-in-use') {
        msg = "Este e-mail já está sendo usado por outra pessoa.";
      } else if (error.code === 'auth/invalid-email') {
        msg = "O formato do e-mail é inválido. Verifique se digitou certo.";
      } else if (error.code === 'auth/weak-password') {
        msg = "Sua senha é muito fraca. Use pelo menos 6 caracteres.";
      } else if (error.code === 'auth/network-request-failed') {
        msg = "Sem conexão com a internet.";
      }

      Alert.alert("Erro no Cadastro", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>Food</Text>
          </View>
          <Text style={styles.title}>Crie sua conta</Text>
          <Text style={styles.subtitle}>Preencha os dados abaixo</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Nome completo"
          value={nome}
          onChangeText={setNome}
          placeholderTextColor="#999"
        />

        <TextInput
          style={styles.input}
          placeholder="Seu e-mail"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Escolha uma senha (mínimo 6 dígitos)"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>CADASTRAR</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
            style={styles.linkButton} 
            onPress={() => router.back()} 
        >
            <Text style={styles.linkText}>Já tem uma conta? <Text style={{fontWeight: 'bold'}}>Faça Login</Text></Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FFF",
  },
  logoArea: { alignItems: "center", marginBottom: 40 },
  logoCircle: {
    width: 80, 
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  logoText: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
  title: { fontSize: 28, color: colors.secondary, fontWeight: "bold" },
  subtitle: { fontSize: 16, color: "#666", marginTop: 5 },
  
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
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
    padding: 10,
  },
  linkText: {
    color: colors.secondary,
    fontSize: 14,
  }
});