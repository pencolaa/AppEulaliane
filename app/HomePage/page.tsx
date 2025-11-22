// @ts-nocheck
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Image,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import * as Calendar from "expo-calendar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import DateTimePicker from '@react-native-community/datetimepicker';

const colors = { primary: "#4FC3F7", secondary: "#0288D1", danger: "#FF5252", success: "#4CAF50", warning: "#FF9800", gray: "#E0E0E0" };

export default function HomeScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraVisible, setCameraVisible] = useState(false);
  const cameraRef = useRef(null);
  const router = useRouter();

  // --- ESTADOS ---
  const [orders, setOrders] = useState([]);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  // --- ESTADOS DO AGENDAMENTO ---
  const [modalAgendamentoVisible, setModalAgendamentoVisible] = useState(false);
  const [novoPrato, setNovoPrato] = useState("");
  const [novoDestinatario, setNovoDestinatario] = useState("");
  
  const [dataAgendamento, setDataAgendamento] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState('date');

  // --- FUNÇÕES ---

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("user_session");
      router.replace("/LoginScreen/page");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível sair.");
    }
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || dataAgendamento;
    setShowPicker(Platform.OS === 'ios'); 
    setDataAgendamento(currentDate);
    if(Platform.OS === 'android') setShowPicker(false); 
  };

  const showMode = (currentMode) => {
    setShowPicker(true);
    setMode(currentMode);
  };

  const getCalendarId = async () => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Erro", "Sem permissão de calendário");
      return null;
    }
    const defaultCalendarSource = Platform.OS === "ios"
      ? await Calendar.getDefaultCalendarSource()
      : { isLocalAccount: true, name: "Expo Calendar" };
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    return calendars.length > 0 ? calendars[0].id : null;
  };

  // 1. CRIAR AGENDAMENTO
  const confirmarAgendamento = async () => {
    if (novoPrato === "" || novoDestinatario === "") {
      return Alert.alert("Atenção", "Preencha o prato e o destinatário.");
    }

    const calendarId = await getCalendarId();
    if (!calendarId) return;

    try {
      const startDate = dataAgendamento;
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); 

      const eventId = await Calendar.createEventAsync(calendarId, {
        title: `Entrega: ${novoPrato}`,
        location: `Cliente: ${novoDestinatario}`,
        startDate: startDate,
        endDate: endDate,
        timeZone: "GMT-3",
        notes: "Agendado pelo App de Delivery",
      });

      const novoPedido = {
        id: Date.now(),
        title: `Pedido #${1000 + orders.length + 1}`,
        desc: `${novoPrato} (Para: ${novoDestinatario})`,
        status: "Agendado",
        photo: null,
        coords: null,
        calendarEventId: eventId,
        dateString: startDate.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
      };

      setOrders([novoPedido, ...orders]);
      setModalAgendamentoVisible(false);
      setNovoPrato("");
      setNovoDestinatario("");
      setDataAgendamento(new Date()); 
      Alert.alert("Agendado!", "Evento criado no calendário com sucesso.");

    } catch (e) {
      console.log(e);
      Alert.alert("Erro", "Falha ao criar evento no calendário.");
    }
  };

  // 2. CANCELAR AGENDAMENTO
  const cancelarEntrega = async (idPedido, eventId) => {
    try {
      if (eventId) await Calendar.deleteEventAsync(eventId);
      setOrders(prevOrders => prevOrders.filter(o => o.id !== idPedido));
      Alert.alert("Cancelado", "Pedido removido do app e do calendário.");
    } catch (e) {
        console.log(e);
        setOrders(prevOrders => prevOrders.filter(o => o.id !== idPedido));
    }
  };

  // 3. REGISTRAR ENTREGA (FOTO + REMOVER DO CALENDÁRIO)
  const iniciarRegistroEntrega = async (idPedido) => {
    setCurrentOrderId(idPedido);
    if (!cameraPermission || !cameraPermission.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) return Alert.alert("Precisamos da câmera!");
    }
    let { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    if (locationStatus !== "granted") return Alert.alert("Erro", "Sem permissão de GPS");
    setCameraVisible(true);
  };

  const tirarFotoEIntegrar = async () => {
    if (cameraRef.current && currentOrderId) {
      try {
        // A. Tira a Foto
        const photo = await cameraRef.current.takePictureAsync();
        setCameraVisible(false);

        // B. Pega Localização
        let location = await Location.getCurrentPositionAsync({});
        const currentCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005, 
            longitudeDelta: 0.005,
        };
        
        // --- NOVO: REMOVER O EVENTO DO CALENDÁRIO ---
        // 1. Encontra o pedido atual na lista
        const pedidoAtual = orders.find(o => o.id === currentOrderId);
        
        // 2. Se ele tiver um evento agendado, apaga do celular
        if (pedidoAtual && pedidoAtual.calendarEventId) {
            try {
                await Calendar.deleteEventAsync(pedidoAtual.calendarEventId);
                console.log("Evento do calendário removido pois a entrega foi feita.");
            } catch (calError) {
                console.log("Erro ao tentar apagar do calendário (pode já ter sido apagado):", calError);
            }
        }

        // C. Atualiza o Status no App para "Entregue"
        setOrders(prevOrders => prevOrders.map(order => {
            if (order.id === currentOrderId) {
                return { 
                    ...order, 
                    status: "Entregue", 
                    photo: photo.uri, 
                    coords: currentCoords,
                };
            }
            return order;
        }));

        Alert.alert("Entrega Concluída!", "A foto foi salva e o agendamento removido do seu calendário.");

      } catch (error) {
        console.log(error);
        Alert.alert("Erro", "Falha na integração.");
      } finally {
        setCurrentOrderId(null);
      }
    }
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.headerActions}>
        <Text style={styles.headerTitle}>Meus Pedidos</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalAgendamentoVisible(true)}>
            <Text style={styles.addButtonText}>+ Agendar Entrega</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} style={{width: '100%'}}>
        {orders.length === 0 && (
            <Text style={{textAlign: 'center', marginTop: 50, color: '#999'}}>Nenhum pedido agendado.</Text>
        )}

        {orders.map((item) => (
            <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={[
                        styles.statusBadge, 
                        { color: item.status === 'Entregue' ? colors.success : colors.warning }
                    ]}>
                        {item.status}
                    </Text>
                </View>
                
                <Text style={styles.cardText}>{item.desc}</Text>
                
                {item.status === "Agendado" && (
                    <Text style={{fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 10}}>
                        📅 Data: {item.dateString}
                    </Text>
                )}

                {item.status === "Agendado" ? (
                    <View>
                        <TouchableOpacity
                            style={[styles.actionButton, {marginBottom: 10}]}
                            onPress={() => iniciarRegistroEntrega(item.id)}
                        >
                            <Text style={styles.actionButtonText}>CONFIRMAR ENTREGA (FOTO)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.danger }]}
                            onPress={() => cancelarEntrega(item.id, item.calendarEventId)}
                        >
                            <Text style={styles.actionButtonText}>CANCELAR AGENDAMENTO</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                   <View style={styles.deliveryInfo}>
                        <Text style={styles.sectionTitle}>Comprovante de Entrega:</Text>
                        <View style={styles.proofRow}>
                            <Image source={{ uri: item.photo }} style={styles.proofImage} />
                            <View style={styles.miniMapContainer}>
                                <MapView 
                                    style={styles.miniMap}
                                    initialRegion={item.coords}
                                    scrollEnabled={false}
                                    zoomEnabled={false}
                                >
                                    <Marker coordinate={item.coords} pinColor="blue" />
                                </MapView>
                            </View>
                        </View>
                        <View style={{marginTop: 10, alignItems: 'center'}}>
                            <Text style={{color: '#666', fontSize: 12}}>Localização capturada:</Text>
                            <Text style={styles.coordsText}>Lat: {item.coords.latitude.toFixed(5)}</Text>
                            <Text style={styles.coordsText}>Long: {item.coords.longitude.toFixed(5)}</Text>
                        </View>
                    </View>
                )}
            </View>
        ))}
      </ScrollView>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>SAIR DA CONTA</Text>
      </TouchableOpacity>

      {/* --- MODAL DE AGENDAMENTO --- */}
      <Modal visible={modalAgendamentoVisible} animationType="slide" transparent={true}>
        <View style={styles.modalCenter}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Novo Agendamento</Text>
                
                <TextInput 
                    style={styles.input} 
                    placeholder="Nome do Prato / Pedido"
                    value={novoPrato}
                    onChangeText={setNovoPrato}
                />
                
                <TextInput 
                    style={styles.input} 
                    placeholder="Nome do Destinatário"
                    value={novoDestinatario}
                    onChangeText={setNovoDestinatario}
                />

                <Text style={styles.label}>Escolha a Data e Hora:</Text>
                
                <View style={styles.dateRow}>
                    <TouchableOpacity style={styles.dateButton} onPress={() => showMode('date')}>
                        <Text style={styles.dateButtonText}>📅 Data</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.dateButton} onPress={() => showMode('time')}>
                        <Text style={styles.dateButtonText}>⏰ Hora</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.selectedDateText}>
                    Selecionado: {dataAgendamento.toLocaleString()}
                </Text>

                {showPicker && (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={dataAgendamento}
                        mode={mode}
                        is24Hour={true}
                        display="default"
                        onChange={onChangeDate}
                    />
                )}

                <TouchableOpacity style={styles.modalButton} onPress={confirmarAgendamento}>
                    <Text style={styles.modalButtonText}>SALVAR NO CALENDÁRIO</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalClose} onPress={() => setModalAgendamentoVisible(false)}>
                    <Text style={{color: '#666'}}>Fechar</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      <Modal visible={cameraVisible} animationType="slide">
        <CameraView style={{ flex: 1 }} ref={cameraRef}>
          <View style={styles.cameraOverlay}>
            <TouchableOpacity style={styles.captureButton} onPress={tirarFotoEIntegrar}>
              <Text style={{ color: "white", fontWeight: 'bold' }}>FOTOGRAFAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setCameraVisible(false)}>
              <Text style={{ color: "white" }}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    marginTop: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.secondary },
  
  addButton: {
    backgroundColor: colors.success,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    elevation: 5,
  },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },

  card: {
    width: "100%",
    backgroundColor: "#E0F7FA",
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: colors.secondary },
  statusBadge: { fontWeight: 'bold', fontSize: 14 },
  cardText: { fontSize: 16, color: "#555", marginBottom: 5 },
  
  deliveryInfo: { backgroundColor: 'rgba(255,255,255,0.6)', padding: 10, borderRadius: 10 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: colors.secondary, marginBottom: 5 },
  proofRow: { flexDirection: 'row', justifyContent: 'space-between', height: 100 },
  proofImage: { width: '48%', height: '100%', borderRadius: 8, backgroundColor: '#ddd' },
  miniMapContainer: { width: '48%', height: '100%', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#ccc' },
  miniMap: { width: '100%', height: '100%' },
  coordsText: { fontSize: 14, color: '#333', fontWeight: 'bold', textAlign: 'center' },

  actionButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  actionButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },

  logoutButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  logoutText: { color: colors.danger, fontWeight: "bold", fontSize: 16 },

  // ESTILOS DO MODAL
  modalCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 20, padding: 20, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.secondary, marginBottom: 20 },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#DDD', borderRadius: 10, marginBottom: 15, paddingHorizontal: 10, backgroundColor: '#F9F9F9' },
  label: { alignSelf: 'flex-start', color: '#555', fontWeight: 'bold', marginTop: 5 },
  
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginVertical: 10 },
  dateButton: { backgroundColor: colors.gray, padding: 10, borderRadius: 8, width: '48%', alignItems: 'center' },
  dateButtonText: { fontWeight: 'bold', color: '#333' },
  selectedDateText: { marginVertical: 10, color: colors.secondary, fontWeight: 'bold', fontSize: 16 },

  modalButton: { backgroundColor: colors.success, paddingVertical: 15, borderRadius: 10, width: '100%', alignItems: 'center', marginTop: 10, marginBottom: 10 },
  modalButtonText: { color: '#FFF', fontWeight: 'bold' },
  modalClose: { padding: 10 },

  cameraOverlay: { flex: 1, backgroundColor: "transparent", justifyContent: "flex-end", alignItems: "center", marginBottom: 40 },
  captureButton: { backgroundColor: colors.secondary, paddingHorizontal: 30, paddingVertical: 20, borderRadius: 50, marginBottom: 20 },
  closeButton: { backgroundColor: "#555", padding: 10, borderRadius: 20 },
});