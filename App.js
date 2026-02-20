import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const createPlayer = (name) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name,
  score: 0,
});

const STORAGE_KEY = 'emi_score_game_state_v1';

async function cleanupLegacyPwaTraces() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }

    if ('localStorage' in window) {
      localStorage.removeItem('reduxPersist:root');
      localStorage.removeItem('pwa-install-state');
    }

    if ('sessionStorage' in window) {
      sessionStorage.removeItem('pwa-install-state');
    }
  } catch (error) {
    console.warn('PWA legacy cleanup failed:', error);
  }
}

function ChromaCTA({ label, onPress, disabled = false, danger = false }) {
  return (
    <View style={[styles.chromaRing, danger ? styles.chromaRingDanger : styles.chromaRingBlue, disabled && styles.disabled]}>
      <View style={styles.chromaInner}>
        <Pressable onPress={onPress} disabled={disabled} style={styles.chromaPressable}>
          <Text style={styles.chromaText}>{label}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PlayerFormCard({ title, value, onChange, onAdd }) {
  return (
    <View style={styles.glassCard}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.formStack}>
        <TextInput
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onAdd}
          returnKeyType="done"
          placeholder="Escribe el nombre"
          placeholderTextColor="#7D86A0"
          style={styles.input}
        />
        <Pressable style={styles.secondaryBtn} onPress={onAdd}>
          <Text style={styles.secondaryBtnText}>Añadir jugador</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SetupScreen({ players, playerName, onChangePlayerName, onAddPlayer, onRemovePlayer, onStartGame }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Configurar Jugadores</Text>
      <Text style={styles.subtitle}>Modo PWA Activado</Text>

      <PlayerFormCard
        title="Añade los participantes"
        value={playerName}
        onChange={onChangePlayerName}
        onAdd={onAddPlayer}
      />

      <ScrollView contentContainerStyle={styles.list}>
        {players.map((player) => (
          <View key={player.id} style={styles.playerRow}>
            <Text style={styles.playerName}>{player.name}</Text>
            <Pressable style={styles.removeChip} onPress={() => onRemovePlayer(player.id)}>
              <Text style={styles.removeChipText}>Quitar</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <ChromaCTA label="Empezar Partida" onPress={onStartGame} disabled={players.length === 0} />
    </View>
  );
}

function GameScreen({
  players,
  playerName,
  onChangePlayerName,
  onAddPlayer,
  pointsByPlayer,
  onChangePoints,
  onChangeScore,
  onFinishGame,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);

  const getPointsValue = (id) => {
    const raw = pointsByPlayer[id] ?? '1';
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return 1;
    }
    return parsed;
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Partida en Curso</Text>
      <Text style={styles.subtitle}>Puedes añadir jugadores en cualquier momento</Text>

      <View style={{ marginBottom: 12 }}>
        <ChromaCTA label="Añadir Jugador" onPress={() => setAddPlayerOpen(true)} />
      </View>

      <ScrollView contentContainerStyle={styles.cardsList}>
        {players.map((player) => {
          const points = getPointsValue(player.id);
          return (
            <View key={player.id} style={styles.scoreCard}>
              <Text style={styles.scoreName}>{player.name}</Text>
              <Text style={styles.scoreValue}>{player.score}</Text>

              <View style={styles.quickActionsRow}>
                <Pressable style={[styles.counterBtn, styles.minusBtn]} onPress={() => onChangeScore(player.id, -1)}>
                  <Text style={styles.counterText}>-1</Text>
                </Pressable>
                <Pressable style={[styles.counterBtn, styles.plusBtn]} onPress={() => onChangeScore(player.id, 1)}>
                  <Text style={styles.counterText}>+1</Text>
                </Pressable>
              </View>

              <Text style={styles.customLabel}>Puntos personalizados</Text>
              <View style={styles.customRow}>
                <TextInput
                  value={pointsByPlayer[player.id] ?? '1'}
                  onChangeText={(text) => onChangePoints(player.id, text.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  style={styles.pointsInput}
                  placeholder="1"
                  placeholderTextColor="#8892B0"
                />
                <View style={styles.customButtonsStack}>
                  <Pressable
                    style={[styles.wideActionBtn, styles.plusBtn]}
                    onPress={() => onChangeScore(player.id, points)}
                  >
                    <Text style={styles.counterText}>Sumar puntos</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.wideActionBtn, styles.minusBtn]}
                    onPress={() => onChangeScore(player.id, -points)}
                  >
                    <Text style={styles.counterText}>Restar puntos</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <ChromaCTA label="Terminar Partida" onPress={() => setConfirmOpen(true)} danger />

      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirmar cierre</Text>
            <Text style={styles.modalDescription}>Esto limpiará jugadores y puntajes.</Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setConfirmOpen(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirm}
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

      <Modal visible={addPlayerOpen} transparent animationType="fade" onRequestClose={() => setAddPlayerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <PlayerFormCard
              title="Agregar jugador"
              value={playerName}
              onChange={onChangePlayerName}
              onAdd={() => {
                onAddPlayer();
                setAddPlayerOpen(false);
              }}
            />
            <View style={[styles.modalActions, { marginTop: 12 }]}>
              <Pressable style={styles.modalCancel} onPress={() => setAddPlayerOpen(false)}>
                <Text style={styles.modalCancelText}>Cerrar</Text>
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
  const [playerName, setPlayerName] = useState('');
  const [pointsByPlayer, setPointsByPlayer] = useState({});
  const [hydrated, setHydrated] = useState(false);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [pendingRestore, setPendingRestore] = useState(null);

  const addPlayer = () => {
    const clean = playerName.trim();
    if (!clean) {
      return;
    }

    const newPlayer = createPlayer(clean);
    setPlayers((prev) => [...prev, newPlayer]);
    setPointsByPlayer((prev) => ({ ...prev, [newPlayer.id]: '1' }));
    setPlayerName('');
  };

  const removePlayer = (id) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setPointsByPlayer((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const changeScore = (id, delta) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, score: p.score + delta } : p)));
  };

  const finishGame = () => {
    setPlayers([]);
    setPointsByPlayer({});
    setPlayerName('');
    setGameStarted(false);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => { });
  };

  const backgroundGlowStyle = useMemo(() => ({ opacity: 0.16 }), []);

  useEffect(() => {
    cleanupLegacyPwaTraces();
    const restoreState = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setHydrated(true);
          return;
        }

        const parsed = JSON.parse(raw);
        if (parsed?.gameStarted && Array.isArray(parsed?.players) && parsed.players.length > 0) {
          setPendingRestore(parsed);
          setResumeModalOpen(true);
          return;
        }

        if (Array.isArray(parsed?.players)) {
          setPlayers(parsed.players);
          setGameStarted(Boolean(parsed.gameStarted));
          setPlayerName(parsed.playerName ?? '');
          setPointsByPlayer(parsed.pointsByPlayer ?? {});
        }
      } catch (error) {
        console.warn('State restore failed:', error);
      } finally {
        setHydrated(true);
      }
    };

    restoreState();
  }, []);

  useEffect(() => {
    if (!hydrated || resumeModalOpen) {
      return;
    }

    if (!gameStarted && players.length === 0) {
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => { });
      return;
    }

    const stateToSave = {
      players,
      gameStarted,
      playerName,
      pointsByPlayer,
    };

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave)).catch((error) => {
      console.warn('State save failed:', error);
    });
  }, [players, gameStarted, playerName, pointsByPlayer, hydrated, resumeModalOpen]);

  const continueSavedGame = () => {
    if (pendingRestore) {
      setPlayers(Array.isArray(pendingRestore.players) ? pendingRestore.players : []);
      setGameStarted(Boolean(pendingRestore.gameStarted));
      setPlayerName(pendingRestore.playerName ?? '');
      setPointsByPlayer(pendingRestore.pointsByPlayer ?? {});
    }
    setPendingRestore(null);
    setResumeModalOpen(false);
  };

  const discardSavedGame = () => {
    setPendingRestore(null);
    setResumeModalOpen(false);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => { });
  };

  if (!hydrated) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.background} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.background}>
        <View style={[styles.gradientHaloA, backgroundGlowStyle]} />
        <View style={styles.gradientHaloB} />

        {gameStarted ? (
          <GameScreen
            players={players}
            playerName={playerName}
            onChangePlayerName={setPlayerName}
            onAddPlayer={addPlayer}
            pointsByPlayer={pointsByPlayer}
            onChangePoints={(id, value) => setPointsByPlayer((prev) => ({ ...prev, [id]: value }))}
            onChangeScore={changeScore}
            onFinishGame={finishGame}
          />
        ) : (
          <SetupScreen
            players={players}
            playerName={playerName}
            onChangePlayerName={setPlayerName}
            onAddPlayer={addPlayer}
            onRemovePlayer={removePlayer}
            onStartGame={() => setGameStarted(true)}
          />
        )}
      </View>

      <Modal visible={resumeModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Partida detectada</Text>
            <Text style={styles.modalDescription}>Hay una partida guardada. ¿Quieres continuarla?</Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={discardSavedGame}>
                <Text style={styles.modalCancelText}>Nueva partida</Text>
              </Pressable>
              <Pressable style={styles.modalConfirm} onPress={continueSavedGame}>
                <Text style={styles.modalConfirmText}>Continuar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    overflow: 'hidden',
  },
  background: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    overflow: 'hidden',
  },
  gradientHaloA: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: 'rgba(52,107,255,0.24)',
  },
  gradientHaloB: {
    position: 'absolute',
    top: 90,
    right: -50,
    width: 210,
    height: 210,
    borderRadius: 999,
    backgroundColor: 'rgba(145,77,255,0.14)',
  },
  screen: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    color: '#F6F8FF',
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: '#A8B0C8',
    marginTop: 6,
    marginBottom: 14,
  },
  glassCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  label: {
    color: '#E2E8FF',
    fontSize: 13,
    marginBottom: 8,
  },
  formStack: {
    width: '100%',
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,157,255,0.5)',
    backgroundColor: 'rgba(11,14,22,0.92)',
    color: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  secondaryBtn: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(132,169,255,0.58)',
    backgroundColor: 'rgba(38,60,116,0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: '#ECF1FF',
    fontWeight: '700',
  },
  list: {
    paddingVertical: 12,
    gap: 10,
  },
  playerRow: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  removeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,140,140,0.58)',
    backgroundColor: 'rgba(149,33,47,0.58)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  removeChipText: {
    color: '#FFDDE1',
    fontSize: 12,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.45,
  },
  cardsList: {
    paddingVertical: 12,
    gap: 12,
  },
  scoreCard: {
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  scoreName: {
    color: '#E8EDFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scoreValue: {
    color: '#FFF',
    fontSize: 46,
    fontWeight: '900',
    marginVertical: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  customLabel: {
    color: '#A8B0C8',
    alignSelf: 'flex-start',
    marginBottom: 6,
    fontSize: 12,
  },
  customRow: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  pointsInput: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(120,157,255,0.5)',
    backgroundColor: 'rgba(11,14,22,0.92)',
    color: '#FFF',
    textAlign: 'center',
    paddingVertical: 8,
    fontWeight: '700',
  },
  customButtonsStack: {
    width: '100%',
    gap: 8,
  },
  counterBtn: {
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 72,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  wideActionBtn: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  minusBtn: {
    borderColor: 'rgba(255,143,143,0.52)',
    backgroundColor: 'rgba(137,37,49,0.58)',
  },
  plusBtn: {
    borderColor: 'rgba(132,169,255,0.65)',
    backgroundColor: 'rgba(36,67,133,0.82)',
    shadowColor: '#2F6DFF',
    shadowOpacity: 0.72,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  counterText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  chromaRing: {
    width: '100%',
    padding: 1.5,
    borderRadius: 15,
    marginTop: 4,
  },
  chromaRingBlue: {
    borderColor: 'rgba(120,170,255,0.95)',
    backgroundColor: 'rgba(73,125,255,0.4)',
    shadowColor: '#4f8dff',
    shadowOpacity: 0.9,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  chromaRingDanger: {
    borderColor: 'rgba(255,138,170,0.92)',
    backgroundColor: 'rgba(190,56,86,0.38)',
    shadowColor: '#e04b6b',
    shadowOpacity: 0.85,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 11,
  },
  chromaInner: {
    borderRadius: 13,
    backgroundColor: '#0f1320',
    overflow: 'hidden',
  },
  chromaPressable: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    backgroundColor: 'rgba(15,19,32,0.94)',
  },
  chromaText: {
    color: '#F7FAFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
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
    color: '#BBC4D9',
    marginTop: 8,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  modalCancelText: {
    color: '#E2E8F8',
    fontWeight: '700',
  },
  modalConfirm: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,133,155,0.58)',
    backgroundColor: 'rgba(164,35,56,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  modalConfirmText: {
    color: '#FFF',
    fontWeight: '800',
  },
});
