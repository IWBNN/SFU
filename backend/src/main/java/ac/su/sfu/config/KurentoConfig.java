package ac.su.sfu.config;

import org.kurento.client.KurentoClient;
import org.kurento.client.MediaPipeline;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KurentoConfig {

    @Bean
    public KurentoClient kurentoClient() {
        return KurentoClient.create();
    }

    @Bean
    public MediaPipeline mediaPipeline(KurentoClient kurentoClient) {
        return kurentoClient.createMediaPipeline();
    }
}
