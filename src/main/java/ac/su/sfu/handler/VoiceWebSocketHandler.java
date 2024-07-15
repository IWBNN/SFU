package ac.su.sfu.handler;

import org.kurento.client.*;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class VoiceWebSocketHandler extends TextWebSocketHandler {

    private final KurentoClient kurentoClient;
    private final Map<String, UserSession> userSessions = new ConcurrentHashMap<>();
    private MediaPipeline pipeline;

    public VoiceWebSocketHandler(KurentoClient kurentoClient) {
        this.kurentoClient = kurentoClient;
        this.pipeline = kurentoClient.createMediaPipeline();
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        UserSession userSession = new UserSession(session, pipeline);
        userSessions.put(session.getId(), userSession);
        System.out.println("Voice Connection established with session ID: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        System.out.println("Received voice message: " + payload);

        Map<String, Object> msg = new ObjectMapper().readValue(payload, Map.class);
        String id = (String) msg.get("id");

        switch (id) {
            case "start":
                handleStart(session, msg);
                break;
            case "onIceCandidate":
                handleIceCandidate(session, msg);
                break;
            case "stop":
                handleStop(session);
                break;
        }
    }

    private void handleStart(WebSocketSession session, Map<String, Object> msg) {
        UserSession userSession = userSessions.get(session.getId());
        String sdpOffer = (String) msg.get("sdpOffer");

        WebRtcEndpoint webRtcEndpoint = userSession.getWebRtcEndpoint();
        webRtcEndpoint.processOffer(sdpOffer, new Continuation<String>() {
            @Override
            public void onSuccess(String result) {
                try {
                    System.out.println("Sending SDP Answer to session " + session.getId()); // 로그 추가
                    ObjectNode response = new ObjectMapper().createObjectNode();
                    response.put("id", "startResponse");
                    response.put("sdpAnswer", result);
                    session.sendMessage(new TextMessage(response.toString()));
                    webRtcEndpoint.gatherCandidates();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            @Override
            public void onError(Throwable cause) {
                cause.printStackTrace();
            }
        });
    }

    private void handleIceCandidate(WebSocketSession session, Map<String, Object> msg) {
        UserSession userSession = userSessions.get(session.getId());
        Map<String, Object> candidateMap = (Map<String, Object>) msg.get("candidate");
        IceCandidate candidate = new IceCandidate(
            (String) candidateMap.get("candidate"),
            (String) candidateMap.get("sdpMid"),
            ((Number) candidateMap.get("sdpMLineIndex")).intValue()
        );
        System.out.println("Received ICE Candidate from session " + session.getId() + ": " + candidate); // 로그 추가
        userSession.getWebRtcEndpoint().addIceCandidate(candidate);
    }

    private void handleStop(WebSocketSession session) {
        UserSession userSession = userSessions.remove(session.getId());
        if (userSession != null) {
            userSession.release();
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        handleStop(session);
        System.out.println("Voice connection closed with session ID: " + session.getId());
    }
}