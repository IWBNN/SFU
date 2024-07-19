import React, { useState, useRef, useEffect } from 'react';
import { w3cwebsocket as W3CWebSocket } from 'websocket';

const VOICE_SERVER_URL = 'ws://localhost:8080/voice';

const VoiceCallComponent: React.FC = () => {
    const [isCallStarted, setIsCallStarted] = useState(false);
    const [voiceWsClient, setVoiceWsClient] = useState<W3CWebSocket | null>(null);
    const localStream = useRef<MediaStream | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);

    const createPeerConnection = () => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        localStream.current?.getTracks().forEach(track => {
            pc.addTrack(track, localStream.current!);
        });

        pc.onicecandidate = (event) => {
            if (event.candidate && voiceWsClient?.readyState === WebSocket.OPEN) {
                console.log('Sending ICE Candidate:', event.candidate);
                voiceWsClient?.send(JSON.stringify({ id: 'onIceCandidate', candidate: event.candidate }));
            }
        };

        pc.ontrack = (event) => {
            console.log('Received remote track:', event.streams[0]);
            const remoteAudio = document.getElementById('remoteAudio') as HTMLAudioElement;
            if (remoteAudio) {
                remoteAudio.srcObject = event.streams[0];
            }
        };

        peerConnection.current = pc;
    };

    const startCall = async () => {
        if (peerConnection.current) {
            console.log('RTCPeerConnection already exists.');
            return;
        }

        const voiceClient = new W3CWebSocket(VOICE_SERVER_URL);

        voiceClient.onopen = async () => {
            console.log('Voice WebSocket Client Connected');
            setVoiceWsClient(voiceClient);
            createPeerConnection();
            const offer = await peerConnection.current!.createOffer();
            await peerConnection.current!.setLocalDescription(offer);
            console.log('Sending SDP Offer:', offer.sdp);
            voiceClient.send(JSON.stringify({ id: 'start', sdpOffer: offer.sdp }));
            setIsCallStarted(true);
        };

        voiceClient.onmessage = (message) => {
            const data = JSON.parse(message.data.toString());
            handleVoiceMessage(data);
        };

        voiceClient.onclose = () => {
            console.log('Voice WebSocket Client Closed');
            setVoiceWsClient(null);
        };

        voiceClient.onerror = (error) => {
            console.error('Voice WebSocket Error:', error);
        };
    };

    const handleVoiceMessage = async (data: any) => {
        console.log('Received message from server:', data);
        switch (data.id) {
            case 'startResponse':
                console.log('Received SDP Answer:', data.sdpAnswer);
                await peerConnection.current?.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdpAnswer }));
                break;
            case 'iceCandidate':
                if (data.candidate) {
                    console.log('Received ICE Candidate:', data.candidate);
                    await peerConnection.current?.addIceCandidate(new RTCIceCandidate(data.candidate));
                }
                break;
        }
    };

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            localStream.current = stream;
            console.log('Local stream obtained:', stream);
        }).catch(error => {
            console.error('Error accessing media devices.', error);
        });
    }, []);

    return (
        <div>
            <button onClick={startCall} disabled={isCallStarted}>Start Call</button>
            <audio id="remoteAudio" autoPlay />
        </div>
    );
};

export default VoiceCallComponent;
