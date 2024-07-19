import React from 'react';
import TextChatComponent from './TextChatComponent';
import VoiceCallComponent from './VoiceCallComponent';

let App = () => {
    return (
        <div>
            <h1>Text Chat</h1>
            <TextChatComponent/>
            <h1>Voice Call</h1>
            <VoiceCallComponent/>
        </div>
    );
};

export default App;
