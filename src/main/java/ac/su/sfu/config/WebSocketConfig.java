package ac.su.sfu.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import ac.su.sfu.handler.ChatWebSocketHandler;
import ac.su.sfu.handler.VoiceWebSocketHandler;
import org.kurento.client.KurentoClient;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Bean
    public KurentoClient kurentoClient() {
        return KurentoClient.create("wss://suportscore.site:8433/kurento");
    }

    @Bean
    public ChatWebSocketHandler webSocketHandler(KurentoClient kurentoClient) {
        return new ChatWebSocketHandler(kurentoClient);
    }

    @Bean
    public VoiceWebSocketHandler voiceWebSocketHandler(KurentoClient kurentoClient) {
        return new VoiceWebSocketHandler(kurentoClient);
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(webSocketHandler(kurentoClient()), "/ws").setAllowedOrigins("https://suportscore.site");
        registry.addHandler(voiceWebSocketHandler(kurentoClient()), "/voice").setAllowedOrigins("https://suportscore.site");
    }
}