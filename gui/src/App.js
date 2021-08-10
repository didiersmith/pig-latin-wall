import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import Wall from './artifacts/contracts/Wall.sol/Wall.json';

const wallAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
const APIAddress = "/api/v1"

console.log("Smart contract is at address ", wallAddress);

function App() {
  const [messageInput, setMessageInput] = useState(''); // Message in input field.
  const [messageList, setMessageList] = useState(['']); // Message list from API.

  async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  }

  async function fetchMessages() {
    fetch(`${APIAddress}/wall`)
      .then(response => response.json())
      .then(data => {
        setMessageList(data);
      });
  }

  async function setMessage() {
    // Update message to smart contract.
    if (!messageInput) {
      alert("Please enter a message");
      return;
    }
    if (typeof window.ethereum === 'undefined') {
      alert("Metamask not initialized");
      return;
    }
    await requestAccount();

    // Create provider that can sign transactions.
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(wallAddress, Wall.abi, signer);
    const transaction = await contract.setMessage(messageInput);
    console.log("Waiting for transaction to commit")
    await transaction.wait();
    console.log("Transaction complete");
  }

  function handleKeyPress(e) {
    if (e.keyCode === 13 || e.code === "Enter" || e.charCode === 13) { // User pressed enter
      setMessage();
    }
  }

  useEffect(() => {
    // Fetch messages when component added to DOM
    fetchMessages();  

    // Fetch messages every second
    const fetchInterval = setInterval(fetchMessages, 1000);

    // Stop fetching messages when removed from DOM.
    return () => clearInterval(fetchInterval);
  }, []);
  

  return (
    <div className="App">
      <div className="wall-content">
        <h1>Pig Latin Wall</h1>
        <ul>
          {messageList.map((msg, idx) => {
            return <li key={idx}>{msg}</li>
          })}
        </ul>
        <div className="input-form">
          <input
            onKeyPress={handleKeyPress}
            onChange={e => setMessageInput(e.target.value)}
            placeholder="ewnay essagemay" />
          <button onClick={setMessage}>ublishpay!</button>
        </div>
      </div>
    </div>
  );
}

export default App;
