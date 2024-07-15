import React from 'react';
import TextChatComponent from './TextChatComponent';
import VoiceCallComponent from './VoiceCallComponent';

const App: React.FC = () => {
    return (
        <div>
            <h1>Text Chat</h1>
            <TextChatComponent />
            <h1>Voice Call</h1>
            <VoiceCallComponent />
        </div>
    );
};

export default App;
