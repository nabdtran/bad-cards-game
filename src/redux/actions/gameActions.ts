import axios from 'axios';
import { Firebase } from './../../FirebaseContext';
import {
  GAME_USER_LOADED,
  GameUserLoadedAction,
  GameUpdatePlayersAction,
  UserType,
  GAME_UPDATE_PLAYERS,
  GameJoindedAction,
  GAME_JOINED,
  GAME_HOSTED,
  GAME_EXITED,
  GameExitedAction,
} from './../actionTypes/gameTypes';
import { Action } from '../store';
import { GAME_STATE_CHANGED, GameStateChangedAction, CardType, Role, GameNextRoundAction, GAME_NEXT_ROUND } from '../actionTypes/gameTypes';

export const gameStarted = (state: boolean): GameStateChangedAction => ({
  type: GAME_STATE_CHANGED,
  payload: { gameStarted: state },
});

export const newRound = (round: number, cards: CardType[], role: Role, blackCard: CardType, judgeID: string): GameNextRoundAction => ({
  type: GAME_NEXT_ROUND,
  payload: {
    round,
    cards,
    role,
    blackCard,
    judgeID,
  },
});

export const userLoaded = (username: string): GameUserLoadedAction => ({ type: GAME_USER_LOADED, payload: { username } });

export const updatePlayers = (players: UserType[]): GameUpdatePlayersAction => ({ type: GAME_UPDATE_PLAYERS, payload: { players } });

export const joinGame = (roomID: string, firebase: Firebase): GameJoindedAction => {
  firebase.enterRoom(roomID);
  return { type: GAME_JOINED, payload: { roomID } };
};

export const hostGame = (firebase: Firebase): Action<string> => async (dispatch) => {
  try {
    const response = await axios.get<{ roomID: string }>('/game/createRoom');
    firebase?.enterRoom(response.data.roomID);
    dispatch({ type: GAME_HOSTED, payload: { roomID: response.data.roomID } });
  } catch (error) {
    console.error(error);
  }
};

export const exitGame = (firebase: Firebase): GameExitedAction => {
  firebase.exitRoom();
  return { type: GAME_EXITED };
};