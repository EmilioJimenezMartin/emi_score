import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

function createPlayer(name) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    score: 0,
  };
}

function SetupScreen({ players, onAddPlayer, onRemovePlayer, onStartGame }) {
  const [nameInput, setNameInput] = useState('');

  const handleAdd = () => {
    const clean = nameInput.trim();
    if (!clean) {
      return;
    }
    onAddPlayer(createPlayer(clean));
    setNameInput('');
  };

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.title}>Configurar Jugadores</Text>
      <Text style={styles.subtitle}>Modo PWA Activado</Text>

      <View style={styles.glassCard}>
        <Text style={styles.label}>Nombre del jugador</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="Ej: Emilio"
            placeholderTextColor="#7F879E"
            style={styles.input}
          />
          <Pressable style={styles.secondaryButton} onPress={handleAdd}>
            <Text style={styles.secondaryButtonText}>Agregar</Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.testGlowButton}>
        <Text style={styles.testGlowText}>TEST GLOW</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.playerList}>
        {players.map((player) => (
          <View key={player.id} style={styles.playerRow}>
            <Text style={styles.playerName}>{player.name}</Text>
            <Pressable style={styles.removePill} onPress={() => onRemovePlayer(player.id)}>
              <Text style={styles.removePillText}>Quitar</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <Pressable
        style={[styles.primaryGlowButton, players.length === 0 && styles.buttonDisabled]}
        onPress={onStartGame}
        disabled={players.length === 0}
      >
        <Text style={styles.primaryGlowText}>Empezar Partida</Text>
      </Pressable>
    </View>
  );
}

function GameScreen({ players, onUpdateScore, onFinishGame }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.title}>Partida en Curso</Text>
      <Text style={styles.subtitle}>Cards glass con contador en tiempo real</Text>

      <ScrollView contentContainerStyle={styles.cardsList}>
        {players.map((player) => (
          <View key={player.id} style={styles.scoreCard}>
            <Text style={styles.scoreName}>{player.name}</Text>
            <Text style={styles.scoreValue}>{player.score}</Text>
            <View style={styles.scoreButtonsRow}>
              <Pressable
                style={[styles.counterButton, styles.counterMinus]}
                onPress={() => onUpdateScore(player.id, -1)}
              >
                <Text style={styles.counterButtonText}>-</Text>
              </Pressable>
              <Pressable
                style={[styles.counterButton, styles.counterPlus]}
                onPress={() => onUpdateScore(player.id, 1)}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable style={styles.dangerButton} onPress={() => setConfirmOpen(true)}>
        <Text style={styles.dangerButtonText}>Terminar Partida</Text>
      </Pressable>

      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirmar cierre</Text>
            <Text style={styles.modalDescription}>Se van a limpiar jugadores y puntajes.</Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={() => setConfirmOpen(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmButton}
                onPress={() => {
                  setConfirmOpen(false);
                  onFinishGame();
                }}
              >
                <Text style={styles.modalConfirmText}>Sí, terminar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function App() {
  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);

  const addPlayer = (player) => setPlayers((prev) => [...prev, player]);
  const removePlayer = (id) => setPlayers((prev) => prev.filter((p) => p.id !== id));

  const updateScore = (id, delta) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, score: p.score + delta } : p)));
  };

  const finishGame = () => {
    setPlayers([]);
    setGameStarted(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.gradientLayer}>
        <View style={styles.orbA} />
        <View style={styles.orbB} />
        {gameStarted ? (
          <GameScreen players={players} onUpdateScore={updateScore} onFinishGame={finishGame} />
        ) : (
          <SetupScreen
            players={players}
            onAddPlayer={addPlayer}
            onRemovePlayer={removePlayer}
            onStartGame={() => setGameStarted(true)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  gradientLayer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  orbA: {
    position: 'absolute',
    top: -90,
    left: -60,
    width: 230,
    height: 230,
    borderRadius: 999,
    backgroundColor: 'rgba(49,102,255,0.22)',
  },
  orbB: {
    position: 'absolute',
    right: -40,
    top: 120,
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: 'rgba(120,64,255,0.14)',
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    color: '#F5F7FF',
    fontSize: 31,
    fontWeight: '800',
  },
  subtitle: {
    color: '#A8B0C5',
    marginTop: 6,
    marginBottom: 14,
  },
  glassCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  label: {
    color: '#DFE5FA',
    fontSize: 13,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(113,150,255,0.5)',
    backgroundColor: 'rgba(11,14,23,0.92)',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(128,166,255,0.55)',
    backgroundColor: 'rgba(36,58,111,0.74)',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: '#EAF0FF',
    fontWeight: '700',
  },
  testGlowButton: {
    marginTop: 14,
    marginBottom: 6,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: '#2C67FF',
    borderWidth: 1,
    borderColor: 'rgba(166,196,255,0.7)',
    shadowColor: '#2C67FF',
    shadowOpacity: 0.95,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  testGlowText: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  playerList: {
    paddingVertical: 12,
    gap: 10,
  },
  playerRow: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  removePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,136,136,0.55)',
    backgroundColor: 'rgba(147,33,46,0.56)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  removePillText: {
    color: '#FFD9DE',
    fontSize: 12,
    fontWeight: '700',
  },
  primaryGlowButton: {
    marginTop: 'auto',
    borderRadius: 15,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#2D6BFF',
    borderWidth: 1,
    borderColor: 'rgba(150,188,255,0.65)',
    shadowColor: '#2D6BFF',
    shadowOpacity: 0.9,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  primaryGlowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  cardsList: {
    gap: 12,
    paddingBottom: 18,
  },
  scoreCard: {
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scoreName: {
    color: '#E4EBFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scoreValue: {
    color: '#FFFFFF',
    fontSize: 46,
    fontWeight: '900',
    marginVertical: 8,
  },
  scoreButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  counterButton: {
    width: 62,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  counterMinus: {
    borderColor: 'rgba(255,143,143,0.5)',
    backgroundColor: 'rgba(137,36,48,0.58)',
  },
  counterPlus: {
    borderColor: 'rgba(127,166,255,0.65)',
    backgroundColor: 'rgba(36,66,132,0.8)',
    shadowColor: '#2D6BFF',
    shadowOpacity: 0.72,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  counterButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 30,
  },
  dangerButton: {
    marginTop: 6,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,132,154,0.58)',
    backgroundColor: 'rgba(174,35,58,0.92)',
    shadowColor: '#D93A56',
    shadowOpacity: 0.76,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(20,20,25,0.96)',
  },
  modalTitle: {
    color: '#F8F9FF',
    fontSize: 22,
    fontWeight: '800',
  },
  modalDescription: {
    color: '#BAC2D5',
    marginTop: 8,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  modalCancelText: {
    color: '#E2E7F7',
    fontWeight: '700',
  },
  modalConfirmButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,134,158,0.56)',
    backgroundColor: 'rgba(163,34,56,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
