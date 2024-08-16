import { useState, useEffect, FormEvent } from "react";
import { API_BASE_URL, UNEXPECTED_ERROR_MSG } from "../Constants";
import axios from "axios";
import { ClipLoader } from "react-spinners";
import {Modal} from "bootstrap";
import Clipboard from '../assets/clipboard.svg';

function NameListComponent(props: any) {
    const [namesList, setNamesList] = useState<{name: String}[]>([]);

    useEffect(() => {
        props.setLoading(true);
        // Get the list of names for the current game
        axios.get(API_BASE_URL + '/game/' + props.gameId + '/players')
            .then((response) => {
                console.log(response);
                setNamesList(response.data);
            })
            .catch(error => {
                console.log("error: " + error);
                props.setErrorMsg(UNEXPECTED_ERROR_MSG)
            })
            .finally(props.setLoading(false));
    }, [])

    function shuffleList() {
        console.log("shuffling list");
        let temp = namesList.slice();
        let currentIndex = temp.length;
        while (currentIndex != 0) {
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [temp[currentIndex], temp[randomIndex]] = [temp[randomIndex], temp[currentIndex]];
        }
        setNamesList(temp);
    }

    if (namesList.length > 0) {
        return (
            <>
                <br />
                <hr />
                <button className="btn btn-success" onClick={shuffleList} type="button" data-bs-toggle="collapse" data-bs-target="#namesList" aria-expanded="false" aria-controls="namesList">Reveal list</button>
                <br /><br />
                <div className="collapse" id="namesList">
                    <ul className="list-group">
                        {namesList.map((e, idx) =>
                            <li className="list-group-item" key={idx}>{e.name}</li>
                        )}
                    </ul>
                    <br />
                </div>
                
            </>
        )
    } else {
        return null;
    }
}

function DuplicateNameModal(props: any) {

    function closeModal() {
        let modalEl = document.getElementById("duplicateNameModal");
        let modal = Modal.getInstance(modalEl);
        modal.hide();
        props.setDuplicateName("");
    }

    function override() {
        let modalEl = document.getElementById("duplicateNameModal");
        let modal = Modal.getInstance(modalEl);
        modal.hide();
        props.override();
    }

    return (
        <div className="modal fade" tabIndex={-1} id="duplicateNameModal">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Duplicate name!</h5>
                        <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        <p>We've detected a possible <b>duplicate name</b>.</p>
                        <p>Name you submitted:  {props.playerName}</p>
                        <p>Possible duplicate:  {props.duplicateName}</p>
                        <p>You can either go back and pick a new name, or if you think your name is different enough you can override.</p>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={closeModal}>Pick a new name</button>
                        <button type="button" className="btn btn-danger" onClick={override}>Override</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function SetNameForm(props: any) {
    const [loading, setLoading] = useState(false);
    const [formPlayerName, setFormPlayerName] = useState("");
    const [duplicateName, setDuplicateName] = useState("");

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        let request = {
            name: formPlayerName
        };
        axios.post(API_BASE_URL + '/game/' + props.gameId + '/player/' + props.playerId, request)
            .then((response) => {
                console.log(response);
                props.setPlayerName(formPlayerName);
            }).catch((error) => {
                if (error.response.status === 409) {
                    console.log("handling duplicate");
                    setDuplicateName(error.response.data.duplicateName);
                } else {
                    console.log("error: " + error);
                    props.setErrorMsg(UNEXPECTED_ERROR_MSG);
                }
            }).finally(() => {
                setLoading(false);
            });
    }

    function overrideSubmit() {
        let request = {
            name: formPlayerName,
            override: true
        };
        axios.post(API_BASE_URL + '/game/' + props.gameId + '/player/' + props.playerId, request)
            .then((response) => {
                console.log(response);
                props.setPlayerName(formPlayerName);
            }).catch((error) => {
                console.log("error: " + error);
                props.setErrorMsg(UNEXPECTED_ERROR_MSG);
            }).finally(() => {
                setLoading(false);
            });
    }

    useEffect(() => {
        console.log(duplicateName);
        if (duplicateName != "") {
            const myModal = new Modal("#duplicateNameModal", {})
            myModal.show();
        }
    }, [duplicateName])

    if (loading) {
        return (
            <div className="loading-card-body">
                <ClipLoader />
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <input type="text" value={formPlayerName} className="form-control" placeholder="Name" onChange={(e) => setFormPlayerName(e.target.value)} required />
                <small className="form-text text-muted">Choose a name.  Your friends will try to guess which name you chose!</small>
            </div>
            <button type="submit" className="btn btn-primary set-name-button">Submit</button>
            <DuplicateNameModal playerName={formPlayerName} duplicateName={duplicateName} setDuplicateName={setDuplicateName} override={overrideSubmit}/>
        </form>
    )
}

export default function Game(props: any) {
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [playerName, setPlayerName] = useState<string>("");
    const [blurPlayerName, setBlurPlayerName] = useState(true);
    const [isHost, setIsHost] = useState(false);

    // get name set for player
    useEffect(() => {
        setLoading(true);
        axios.get(API_BASE_URL + '/game?game_id=' + props.gameId)
            .then(response => {
                console.log(response)
                console.log(response.data.host + " " + props.playerId);
                if (response.data.Items[0].host == props.playerId) {
                    setIsHost(true);
                }
            }).catch((error) => {
                console.log("error: " + error);
                setErrorMsg(UNEXPECTED_ERROR_MSG);
            })
        axios.get(API_BASE_URL + '/game/' + props.gameId + '/player/' + props.playerId)
            .then(response => {
                console.log(response);
                setPlayerName(response.data.name);
            }).catch((error) => {
                if (error.response.status != 404) {
                    console.log("error: " + error);
                    setErrorMsg(UNEXPECTED_ERROR_MSG);
                }
            }).finally(() => {
                setLoading(false);
            });
    }, []);

    function leaveGame() {
        localStorage.removeItem("empire.userId");
        localStorage.removeItem("empire.gameId");
        window.location.reload();
    }

    function copyGameId() {
        const url = window.location.href.split('?')[0];
        navigator.clipboard.writeText(url + "?game_id=" + props.gameId);
        window.alert("Copied shareable link to clipboard.");
    }

    function resetGame() {
        axios.post(API_BASE_URL + '/game/' + props.gameId + '/reset')
            .then(response => {
                console.log(response)
                window.alert("Cleared game, everyone refresh!");
            }).catch((error) => {
                console.log("error: " + error);
                setErrorMsg(UNEXPECTED_ERROR_MSG);
            })
    }

    if (loading) {
        return (
            <div className="card">
                <div className="card-body loading-card-body">
                    <ClipLoader />
                </div>
            </div>
        )
    }

    return (
        <div className="card">
            <h4>Share this code to invite other players:  <a onClick={copyGameId}><b>{props.gameId}</b> <img src={Clipboard} /></a></h4>
            <div className="card-body">
                {errorMsg !== "" && 
                    <div className="alert alert-danger" role="alert">
                        {errorMsg}
                    </div>
                }
                {playerName ?
                    <>
                        <p>Your name is <b><span className={blurPlayerName ? "blur" : ""} id="playerName">{playerName}</span></b></p>
                        <p>Don't let your friends know which name you chose!</p>
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" role="switch" onChange={() => setBlurPlayerName(!blurPlayerName)} checked={blurPlayerName}/>
                            <label className="form-check-label">Blur name</label>
                        </div>
                        { isHost && 
                        <>
                            <NameListComponent gameId={props.gameId} setLoading={setLoading} setErrorMsg={setErrorMsg} />
                            <button className="btn btn-warning" onClick={resetGame}>Reset game</button>
                        </>
                        }
                    </>
                    :
                    <SetNameForm setPlayerName={setPlayerName} gameId={props.gameId} playerId={props.playerId} setErrorMsg={setErrorMsg} setLoading={setLoading}/>
                }
                <br />
                <hr />
                <button className="btn btn-danger" onClick={leaveGame}>Leave game</button>
            </div>
        </div>
    )
}