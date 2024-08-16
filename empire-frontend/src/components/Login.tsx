import { FormEvent, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL, UNEXPECTED_ERROR_MSG } from '../Constants';

export default function Login() {
    const searchParams = new URLSearchParams(window.location.search);
    const paramGameId: string = searchParams.get('game_id') || "";

    const [formGameId, setFormGameId] = useState<string>(paramGameId);
    const [formUserId, setFormUserId] = useState<string>("");
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [showJoinGame, setShowJoinGame] = useState(true);

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        axios.get(API_BASE_URL + '/game?game_id=' + formGameId)
            .then((response) => {
                console.log(response);
                if (response.data["Count"] != 0) {
                    localStorage.setItem('empire.gameId', formGameId);
                    localStorage.setItem('empire.userId', formUserId);
                    window.location.reload();
                } else {
                    setErrorMsg("Game " + formGameId + " not found.");
                }
            }).catch((error) => {
                console.log("error: " + error);
                setErrorMsg(UNEXPECTED_ERROR_MSG);
            })
    }

    function startGame(event: FormEvent) {
        event.preventDefault();
        axios.post(API_BASE_URL + '/game', {"host": formUserId})
            .then((response) => {
                console.log(response);
                if (response.status === 201) {
                    localStorage.setItem('empire.gameId', response.data["game_id"]);
                    localStorage.setItem('empire.userId', formUserId);
                    window.location.reload();
                } else {
                    setErrorMsg(UNEXPECTED_ERROR_MSG);
                }
                
            }).catch((error) => {
                console.log("error: " + error);
                setErrorMsg(UNEXPECTED_ERROR_MSG);
            })
    }

    return (
        <>
        <div className="card">
            <div className="card-body">
                {errorMsg !== "" && 
                    <div className="alert alert-danger" role="alert">
                        {errorMsg}
                    </div>
                }
                {showJoinGame ? 
                    <>
                        <h5 className="card-title">Join a game</h5>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <input type="text" value={formGameId} className="form-control" placeholder="Game ID" onChange={(e) => setFormGameId(e.target.value)} required/>    
                            </div>
                            <div className="form-group">
                                <input type="text" value={formUserId} className="form-control" placeholder="Display name" onChange={(e) => setFormUserId(e.target.value)} required/>
                            </div>
                            <button type="submit" className="btn btn-primary find-game-btn">Find game</button>              
                        </form>
                    </>
                    :
                    <>
                        <h5>Start a new game</h5>
                        <form onSubmit={startGame}>
                            <div className="form-group">
                                <input type="text" value={formUserId} className="form-control" placeholder="Display name" onChange={(e) => setFormUserId(e.target.value)} required />
                            </div>
                            <button type="submit" className="btn btn-primary start-game-btn">Start a new game</button>
                        </form>
                    </>
                }
                <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" role="switch" onChange={() => setShowJoinGame(!showJoinGame)} checked={!showJoinGame}/>
                    <label className="form-check-label">Start a new game</label>
                </div>
                
                
            </div>
        </div>
        
        </>
    )
}