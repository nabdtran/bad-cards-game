import React, { useEffect, useState } from 'react';
import Button from '../components/Button';
import { useSelector } from '../redux/store';
import { useDispatch } from 'react-redux';
import { exitGame, joinGame, startGame, sendSelected, sendWinner, error, redirectAfterLogin } from '../redux/actions/gameActions';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Card from '../components/Card';
import { CardColor, CardType, ErrorType } from '../redux/actionTypes/gameTypes';
import { Redirect, useParams } from 'react-router-dom';
import Paper from '../components/Paper';

export default function Room() {
  const gameStarted = useSelector((state) => state.gameStarted);
  const round = useSelector((state) => state.round);
  const players = useSelector((state) => state.players);
  const isHost = useSelector((state) => state.isHost);
  const judge = useSelector((state) => state.judge);
  const uid = useSelector((state) => state.uid);
  const roomID = useSelector((state) => state.roomID);
  const logged = useSelector((state) => state.logged);
  const inRoom = useSelector((state) => state.inRoom);
  const selectionsSent = useSelector((state) => state.selectionsSent);
  const returnToGame = useSelector((state) => state.returnToGame);

  const { roomID: roomIDParam } = useParams<{ roomID: string }>();

  const [cardsSelected, setCardsSelected] = useState<CardType[]>([]);

  const blackCard = useSelector((state) => state.blackCard);
  const whiteCards = useSelector((state) => state.cards);

  const dispatch = useDispatch();

  let cardsToSend = 0;
  const [isJudge, setIsJudge] = useState(false);
  let cardsToRender: CardType[][] = [];
  let checkable = false;
  let covered = false;

  useEffect(() => {
    setIsJudge(judge?.uid === uid);
  }, [judge, uid]);

  if (blackCard) {
    cardsToSend = (blackCard.message.match(/_/g) || []).length || 1;
  }

  if (isJudge) {
    players.forEach((player) => {
      if (player.cardSelected.length === 0) {
        if (player.uid !== uid) {
          covered = true;
        }
      } else {
        cardsToRender.push(player.cardSelected);
      }
    });
    //players.map((player) => player.cardSelected).flat(1);
    checkable = !selectionsSent && !covered && cardsSelected.length < cardsToSend;
  } else {
    if (selectionsSent) {
      cardsToRender.push(cardsSelected);
      checkable = false;
    } else {
      cardsToRender.push(whiteCards);
      checkable = cardsSelected.length < cardsToSend;
    }
  }

  // Join if roomIDParam
  useEffect(() => {
    if (!inRoom && logged && roomIDParam) {
      dispatch(joinGame(roomIDParam));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Exit game at unload component
  useEffect(() => {
    return () => {
      console.log('Exiting');
      dispatch(exitGame());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCardsSelected([]);
  }, [round]);

  const onStartGame = () => {
    dispatch(startGame());
  };

  const sendSelections = () => {
    if (isJudge) {
      const winner = players.find((player) =>
        player.cardSelected.find((card) => cardsSelected.find((cardSelected) => cardSelected.id === card.id))
      );
      if (winner) {
        dispatch(sendWinner(winner));
      }
    } else {
      dispatch(sendSelected(cardsSelected));
    }
  };

  const onSelectCard = (checked: boolean, card: CardType) => {
    if (!isJudge) {
      if (checked) {
        if (!cardsSelected.find((c) => c.id === card.id)) {
          setCardsSelected([...cardsSelected, card]);
        }
      } else {
        if (cardsSelected.find((c) => c.id === card.id)) {
          setCardsSelected(cardsSelected.filter((c) => c.id !== card.id));
        }
      }
    } else {
      if (!checked) {
        setCardsSelected([]);
      } else {
        // find player
        setCardsSelected(players.find((p) => p.cardSelected.find((c) => c.id === card.id))?.cardSelected || []);
      }
    }
  };

  const shareRoom = () => {
    let n = navigator as any;
    if (n && n.share) {
      n.share({
        title: document.title,
        text: 'Bad Cards URL',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Room url copied');
    }
  };

  if (!logged) {
    setTimeout(() => {
      // Prevent rendering conflict while redirect
      dispatch(error('You need to login or register before enter in a room', 'Not authorized', ErrorType.LOGIN));
    }, 0);
    dispatch(redirectAfterLogin(window.location.pathname));
    return <Redirect to="/login" />;
  }

  const shareButton = (
    <FontAwesomeIcon
      icon={['fas', 'share-square']}
      className="hover:opacity-75 cursor-pointer hover:border-blue-800"
      size="xs"
      role="button"
      title="Share"
      onClick={shareRoom}
    />
  );

  if (returnToGame) {
    return <Redirect to={`/game`} />;
  }

  return (
    <div>
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex flex-col-reverse sm:flex-row">
          <Paper className="mt-2 sm:mt-0 mr-0 sm:mr-2 sm:flex-1 flex flex-col">
            {gameStarted ? (
              <>
                <h1 className="text-2xl mb-4">Round {round}</h1>
                {isJudge ? (
                  <p className="italic text-gray-700">{!covered ? 'Choose the best cards' : 'Wait all players choose cards'}</p>
                ) : (
                  <p className="italic text-gray-700">{selectionsSent ? 'Wait the end of the round' : 'Choose the best cards'}</p>
                )}
                {blackCard && (
                  <div className="mt-4 flex flex-row justify-center">
                    <Card card={blackCard} color={CardColor.Black} />
                  </div>
                )}
              </>
            ) : isHost ? (
              <>
                <h1 className="text-2xl mb-4 flex flex-row justify-between items-center">
                  Room {roomID} created
                  {shareButton}
                </h1>
                <p className="italic text-gray-700 mb-4">Start the game when all players are ready</p>
                <Button className="self-start" disabled={players.length < 2} onClick={onStartGame}>
                  Start game
                </Button>
              </>
            ) : (
              <>
                <h1 className="text-2xl mb-4 flex flex-row justify-between items-center">
                  Starting...
                  {shareButton}
                </h1>
                <p className="italic text-gray-700">Wait the host start the game</p>
              </>
            )}
          </Paper>

          <Paper className="mt-2 sm:mt-0 mr-0 sm:mr-2 sm:flex-1">
            <h1 className="text-2xl mb-4">Players</h1>
            <ul>
              {players &&
                players.map((user) => (
                  <li key={user.uid} className="flex flex-row justify-between items-center px-4">
                    <FontAwesomeIcon icon={['far', user.cardSelected.length > 0 ? 'dot-circle' : 'circle']} className="mr-4" />
                    <span className="flex-1">
                      {user.displayName}
                      {gameStarted ? ` (${user.points})` : ''}
                    </span>
                    {user.winner && <FontAwesomeIcon icon={['fas', 'trophy']} className="mr-2" />}
                    <span className="text-gray-600">{user.uid === judge?.uid ? 'Kazar' : 'Player'}</span>
                  </li>
                ))}
            </ul>
          </Paper>
        </div>
        {gameStarted && !covered && !selectionsSent && cardsToRender.length > 0 && (
          <div className="mt-8">
            {isJudge ? (
              <Button disabled={cardsSelected.length < cardsToSend} onClick={sendSelections}>
                Choose winner
              </Button>
            ) : (
              <>
                <Button disabled={cardsSelected.length < cardsToSend} onClick={sendSelections}>
                  Send selection
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      {cardsToRender.length > 0 && (
        <div className="flex flex-row overflow-x-auto p-4 -mx-4">
          {cardsToRender.map((cardGroup, i) => (
            <div key={i} className="mr-8 flex">
              {cardGroup.map((card) => (
                <Card
                  key={card.id}
                  checkable={checkable}
                  onCheckChange={onSelectCard}
                  checkbox={!selectionsSent}
                  className="mt-4 mr-4 flex-shrink-0"
                  card={card}
                  color={CardColor.White}
                  checked={!!cardsSelected.find((c) => c.id === card.id)}
                  covered={covered}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
