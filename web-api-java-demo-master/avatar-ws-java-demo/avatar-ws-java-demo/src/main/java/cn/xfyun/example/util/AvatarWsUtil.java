package cn.xfyun.example.util;

import cn.hutool.json.JSONUtil;
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.jetbrains.annotations.NotNull;

import java.io.IOException;
import java.net.ProtocolException;

import java.util.Objects;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
public class AvatarWsUtil {
    public static  WebSocket webSocket;

    private static final AtomicBoolean isConnected = new AtomicBoolean(false);

    private static CountDownLatch countDownLatch;
    private static   CountDownLatch connect;

    public JSONObject jsonObject;

    public static String vmr_status = "0";
//    private MessageHeadler messageHeadler;
    public AvatarWsUtil(){

    }

    public AvatarWsUtil(String requestUrl) {
//        this.messageHeadler = messageHeadler;
//        这行代码创建了一个 HTTP 请求对象 wsRequest，它使用 requestUrl 作为目标 URL。
//        Request.Builder() 是 OkHttp 库用来构建 HTTP 请求的类。
//        url(requestUrl) 设置请求的 URL。
//        build() 方法构建 Request 对象
        Request wsRequest = (new Request.Builder()).url(requestUrl).build();
//        这行代码创建一个新的 OkHttpClient 对象，它是 OkHttp 库中的一个核心类，用于发送和接收网络请求。
//        newBuilder() 方法返回一个 OkHttpClient.Builder 对象，该对象可以用来配置 OkHttpClient。
//        build() 方法构建 OkHttpClient 实例。
        OkHttpClient okHttpClient = new OkHttpClient().newBuilder().build();
//        CountDownLatch 是 Java 并发包 java.util.concurrent 中的一个同步辅助类。
//        CountDownLatch 初始化为 1，表示它将等待一个事件的发生（在这种情况下，可能等待 WebSocket 连接的建立）。
        connect = new CountDownLatch(1);
//        使用 okHttpClient 对象创建一个新的 WebSocket 连接。
//        newWebSocket(wsRequest, buildWebSocketListener()) 方法接受两个参数：
//        wsRequest 是 WebSocket 请求对象。
//        buildWebSocketListener() 是一个方法，返回一个 WebSocketListener，用于处理 WebSocket 的各种事件（如打开连接、接收消息、关闭连接、出现错误等）。
//        把创建的 WebSocket 连接赋值给 this.webSocket，这使得该 WebSocket 连接在 AvatarWsUtil 类的实例中可用。
        this.webSocket = okHttpClient.newWebSocket(wsRequest, buildWebSocketListener());
    }

    public void start(JSONObject request, CountDownLatch countDownLatch) throws Exception {
        this.countDownLatch = countDownLatch;
        System.out.println("connect之前");
        connect.await();
        System.out.println("connect之后");
        send(request);
        System.out.println("send发送了start请求");
//        connect.countDown();
    }

    public void start(JSONObject request) throws Exception {
//        this.countDownLatch = countDownLatch;
        System.out.println("connect之前");
        connect.await();
        System.out.println("connect之后");
        send(request);
    }

    public void send(JSONObject request) {
        if (isConnected.get()) {
            String jsonStr = JSONUtil.toJsonStr(request);
            log.info("send :{}", jsonStr);
            webSocket.send(jsonStr);
        }
    }


    public static WebSocketListener buildWebSocketListener() {
        return new WebSocketListener() {
            //处理连接打开事件
            public void onOpen(@NotNull WebSocket webSocket, @NotNull Response response) {
                log.info("onOpen");
                System.out.println("触发onOpen事件，连接上了");
                isConnected.set(true);
                connect.countDown();
            }
            //处理接受消息事件
            public void onMessage(@NotNull WebSocket webSocket, @NotNull String text) {
                log.info("onMessage: {}", text);
                JSONObject jsonObject = JSON.parseObject(text);
                int code = jsonObject.getJSONObject("header").getIntValue("code");
                if (code != 0) {
                    onEvent(webSocket, 1002, jsonObject.getJSONObject("header").getString("message"), "server closed");
                    System.exit(0);
                    return;
                }
                JSONObject payload = jsonObject.getJSONObject("payload");
                if (payload != null) {
                    JSONObject avatar = payload.getJSONObject("avatar");
                    if (avatar != null) {
                        if(avatar.getString("stream_url") != null) {
                            if (!Objects.equals("", avatar.getString("stream_url"))) {
                                System.out.println("获取到了推流地址，start成功");
                                countDownLatch.countDown();
                            }
                        }
                    }
                }
            }
            //处理连接关闭事件
            public void onClosing(@NotNull WebSocket webSocket, int code, @NotNull String reason) {
                this.onEvent(webSocket, code, reason, "onClosing");
            }
            //处理连接已关闭事件
            public void onClosed(@NotNull WebSocket webSocket, int code, @NotNull String reason) {
                this.onEvent(webSocket, code, reason, "onClosed");
            }
            //处理连接失败事件
            public void onFailure(@NotNull WebSocket webSocket, @NotNull Throwable tx, Response response) {
                Object t;
                try {
                    String responseBody = response.body().string();
                    JSONObject body = JSON.parseObject(responseBody);
                    t = new ProtocolException(body.toString());
                } catch (IOException var6) {
                    t = var6;
                }
                log.info("onFailure:{}", t);
            }
            //处理其他事件
            void onEvent(@NotNull WebSocket webSocket, int code, String reason, String event) {
                log.info("session {} . code:{}, reason:{}", event, code, reason);
                isConnected.set(false);
                countDownLatch.countDown();
                try {
                    webSocket.close(code, reason);
                } catch (Exception var6) {
                    log.error("{} error.{}", event, var6.getMessage());
                }
            }
        };
    }

    //关闭连接
    public void close() {
        this.webSocket.close(1000, "");
    }
}
