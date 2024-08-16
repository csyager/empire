import "bootstrap/dist/css/bootstrap.min.css";

import Login from './components/Login.tsx';
import Game from './components/Game.tsx';

import './App.css'

function App() {
  let gameId = localStorage.getItem('empire.gameId');
  let playerId = localStorage.getItem('empire.userId');
  console.log(gameId);
  return (
    <>
      <div className="container">
        <h1 className="app-title display-1">Empire</h1>
        <div className="container">
          {(gameId !== null && playerId !== null) && <Game gameId={gameId} playerId={playerId}/>}
          {(gameId === null || playerId === null) && <Login />}
        </div>
      </div>
    </>
  )
}

export default App
