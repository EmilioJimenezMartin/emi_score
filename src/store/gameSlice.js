import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  players: [],
  gameStarted: false,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    addPlayer: {
      reducer: (state, action) => {
        state.players.push(action.payload);
      },
      prepare: (name) => {
        const cleanName = name.trim();
        return {
          payload: {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: cleanName,
            score: 0,
          },
        };
      },
    },
    removePlayer: (state, action) => {
      state.players = state.players.filter((player) => player.id !== action.payload);
    },
    updatePlayerScore: (state, action) => {
      const { id, delta } = action.payload;
      const player = state.players.find((item) => item.id === id);

      if (player) {
        player.score += delta;
      }
    },
    startGame: (state) => {
      state.gameStarted = true;
    },
    resetGame: () => initialState,
  },
});

export const { addPlayer, removePlayer, updatePlayerScore, startGame, resetGame } =
  gameSlice.actions;

export default gameSlice.reducer;
