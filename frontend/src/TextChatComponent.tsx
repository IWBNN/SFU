import React, { useState, useEffect } from 'react';
import { w3cwebsocket as W3CWebSocket } from 'websocket';

const TEXT_SERVER_URL = 'wss://suportscore.site/ws';

const TextChatComponent: React.FC = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [textWsClient, setTextWsClient] = useState<W3CWebSocket | null>(null);

    useEffect(() => {
        const textClient = new W3CWebSocket(TEXT_SERVER_URL);

        textClient.onopen = () => {
            console.log('Text WebSocket Client Connected');
            setTextWsClient(textClient);
        };

        textClient.onmessage = (message) => {
            const data = JSON.parse(message.data.toString());
            handleTextMessage(data);
        };

        textClient.onclose = () => {
            console.log('Text WebSocket Client Closed');
            setTextWsClient(null);
        };

        textClient.onerror = (error) => {
            console.error('Text WebSocket Error:', error);
        };

        return () => {
            textClient.close();
        };
    }, []);

    const handleTextMessage = (data: any) => {
        if (data.id === 'message') {
            setMessages(prevMessages => [...prevMessages, `${data.sessionId}: ${data.message}`]);
        }
    };

    const sendMessage = () => {
        if (newMessage.trim() && textWsClient?.readyState === WebSocket.OPEN) {
            textWsClient?.send(JSON.stringify({ id: 'message', message: newMessage }));
            setMessages(prevMessages => [...prevMessages, `You: ${newMessage}`]);
            setNewMessage('');
        } else {
            console.error('Text WebSocket is not open');
        }
    };

    return (
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
    );
};

export default TextChatComponent;
