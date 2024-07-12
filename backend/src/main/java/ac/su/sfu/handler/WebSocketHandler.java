package ac.su.sfu.handler;

import com.google.gson.JsonObject;
import org.kurento.client.IceCandidate;
import org.kurento.client.KurentoClient;
import org.kurento.client.MediaPipeline;
import org.kurento.client.WebRtcEndpoint;
import org.kurento.jsonrpc.JsonUtils;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

public class WebSocketHandler extends TextWebSocketHandler {

    private final KurentoClient kurentoClient = KurentoClient.create();
    private MediaPipeline pipeline;
    private WebRtcEndpoint webRtcEndpoint;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        this.pipeline = kurentoClient.createMediaPipeline();
        this.webRtcEndpoint = new WebRtcEndpoint.Builder(pipeline).build();
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonObject jsonMessage = JsonUtils.fromJson(message.getPayload(), JsonObject.class);
        switch (jsonMessage.get("id").getAsString()) {
            case "start":
                handleStart(session, jsonMessage);
                break;
            case "onIceCandidate":
                handleIceCandidate(jsonMessage);
                break;
            case "message":
                handleMessage(session, jsonMessage);
                break;
            case "stop":
                handleStop(session);
                break;
        }
    }

    private void handleStart(WebSocketSession session, JsonObject jsonMessage) throws Exception {
        webRtcEndpoint.processOffer(jsonMessage.get("sdpOffer").getAsString());
        String sdpAnswer = webRtcEndpoint.getAnswer();
        JsonObject response = new JsonObject();
        response.addProperty("id", "startResponse");
        response.addProperty("sdpAnswer", sdpAnswer);
        session.sendMessage(new TextMessage(response.toString()));
    }

    private void handleIceCandidate(JsonObject jsonMessage) {
        JsonObject candidate = jsonMessage.get("candidate").getAsJsonObject();
        webRtcEndpoint.addIceCandidate(new IceCandidate(candidate.get("candidate").getAsString(),
                candidate.get("sdpMid").getAsString(), candidate.get("sdpMLineIndex").getAsInt()));
    }

    private void handleMessage(WebSocketSession session, JsonObject jsonMessage) throws Exception {
        JsonObject response = new JsonObject();
        response.addProperty("id", "message");
        response.addProperty("message", jsonMessage.get("message").getAsString());
        session.sendMessage(new TextMessage(response.toString()));
    }

    private void handleStop(WebSocketSession session) throws Exception {
        if (pipeline != null) {
            pipeline.release();
        }
        session.close();
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        if (pipeline != null) {
            pipeline.release();
        }
    }
}
