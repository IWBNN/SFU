import React, { useState, useRef, useEffect } from 'react';
import { w3cwebsocket as W3CWebSocket } from "websocket";

const SERVER_URL = 'wss://yourserver.com/ws';

const AudioChatComponent: React.FC = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isCallStarted, setIsCallStarted] = useState(false);
    const [wsClient, setWsClient] = useState<W3CWebSocket | null>(null);
    const localStream = useRef<MediaStream | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        const client = new W3CWebSocket(SERVER_URL);
        setWsClient(client);

        client.onmessage = (message) => {
            const data = JSON.parse(message.data.toString());
            handleSignalingData(data);
        };

        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            localStream.current = stream;
        });

        return () => {
            client.close();
        };
    }, []);

    const handleSignalingData = async (data: any) => {
        switch (data.id) {
            case 'startResponse':
                await peerConnection.current?.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdpAnswer }));
                break;
            case 'iceCandidate':
                if (data.candidate) {
                    await peerConnection.current?.addIceCandidate(new RTCIceCandidate(data.candidate));
                }
                break;
            case 'message':
                setMessages(prevMessages => [...prevMessages, data.message]);
                break;
        }
    };

    const createPeerConnection = () => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        localStream.current?.getTracks().forEach(track => {
            pc.addTrack(track, localStream.current!);
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                wsClient?.send(JSON.stringify({ id: 'onIceCandidate', candidate: event.candidate }));
            }
        };

        pc.ontrack = (event) => {
            const remoteAudio = document.getElementById('remoteAudio') as HTMLAudioElement;
            if (remoteAudio) {
                remoteAudio.srcObject = event.streams[0];
            }
        };

        peerConnection.current = pc;
    };

    const startCall = async () => {
        createPeerConnection();
        const offer = await peerConnection.current!.createOffer();
        await peerConnection.current!.setLocalDescription(offer);
        wsClient?.send(JSON.stringify({ id: 'start', sdpOffer: offer.sdp }));
        setIsCallStarted(true);
    };

    const stopCall = () => {
        wsClient?.send(JSON.stringify({ id: 'stop' }));
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        setIsCallStarted(false);
    };

    const sendMessage = () => {
        if (newMessage.trim()) {
            wsClient?.send(JSON.stringify({ id: 'message', message: newMessage }));
            setMessages(prevMessages => [...prevMessages, newMessage]);
            setNewMessage('');
        }
    };

    return (
        <div>
            <button onClick={startCall} disabled={isCallStarted}>Start Call</button>
            <button onClick={stopCall} disabled={!isCallStarted}>Stop Call</button>
            <audio id="remoteAudio" autoPlay />
            <div>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    style={{ width: '300px' }}
                />
                <button onClick={sendMessage}>Enter</button>
                <div>
                    {messages.map((msg, index) => (
                        <div key={index}>{msg}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AudioChatComponent;
