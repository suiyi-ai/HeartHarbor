package cn.xfyun.example;

import cn.xfyun.example.util.AuthUtil;
import cn.xfyun.example.util.AvatarWsUtil;
import com.alibaba.fastjson2.JSONObject;

import java.io.*;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;


public class Main extends AvatarWsUtil {
    private static final String avatarUrl = "wss://avatar.cn-huadong-1.xf-yun.com/v1/interact";//接口地址，无需更改
    private static final String apiKey = "xxx"; //请到交互平台-接口服务中获取
    private static final String apiSecret = "xxx"; //请到交互平台-接口服务中获取
    private static final String appId = "xxx"; //请到交互平台-接口服务中获取
    private static final String avatarId = "110117005"; //请到交互平台-接口服务-形象列表中获取
    public static final String TTE = "UTF8"; // 小语种必须使用UNICODE编码作为值
    // 发音人参数。到控制台-我的应用-语音合成-添加试用或购买发音人，添加后即显示该发音人参数值，若试用未添加的发音人会报错11200
    public static final String VCN = "x4_lingxiaoying_assist";//请到交互平台-接口服务-声音列表中获取
    public static final String TEXT = "欢迎来到讯飞开放平台";


    public static void main(String[] args) throws Exception {
        String requestUrl = AuthUtil.assembleRequestUrl(avatarUrl, apiKey, apiSecret);
        System.out.println("requestUrl:"+requestUrl);
        long l = System.currentTimeMillis();
        System.out.println("时间戳："+l);
        AvatarWsUtil avatarWsUtil = new AvatarWsUtil(requestUrl);
        //发送start帧
        System.out.println("开始发送start协议");
        CountDownLatch countDownLatch = new CountDownLatch(1);
        try{
            avatarWsUtil.start(buildStartRequest(), countDownLatch);
        }catch (Exception e){
            e.printStackTrace();
        }
        countDownLatch.await();
        //发送ping帧,start之后没5秒发送一次ping心跳，用来维持ws连接
        Timer timer = new Timer();
        CompletableFuture.runAsync(()->{
            TimerTask timeoutTask = new TimerTask() {
                @Override
                public void run() {
                    avatarWsUtil.send(buildPingRequest());
                }
            };
            timer.scheduleAtFixedRate(timeoutTask, 0,5000);
        });

        Thread.sleep(15000);
        //文本驱动
        avatarWsUtil.send(buildTextRequest("这是一个文本驱动，文本驱动不会进行理解"));
        Thread.sleep(10000);

        //文本交互,会走到交互平台中配置的大模型进行语义理解,交互平台-接口服务-大模型对话中的"大模型"需要开启
        avatarWsUtil.send(buildTextinteractRequest("请说一段大会主持开场词"));
        Thread.sleep(50000);

        //音频驱动，不会进行理解，直接播报音频中的内容，只进行口唇匹配
        //一个音频中status参数值是：0-1-1-1-……-1-1-1-2。从0开始，1过渡，2结束。
        //byte数组字节数不要太少，否则会有卡顿的感觉
        //Thread.sleep(100)这里是为了模拟间隔，最好间隔40-100ms
        File audio = new File("src/main/java/cn/xfyun/example/util/Test.pcm");
        try(InputStream inputStream = new FileInputStream(audio)) {
            byte[] bytes = new byte[1024*10];
            int len = 0;
            int status = 0;
            String requestId = UUID.randomUUID().toString();
            while ((len = inputStream.read(bytes)) != -1) {
                System.out.println("status="+status);
                if(len == -1){
                    status = 2;
                }
                Thread.sleep(50);
                String audioData = Base64.getEncoder().encodeToString(Arrays.copyOfRange(bytes, 0, len));
                avatarWsUtil.send(buildAudioRequest(requestId, status, audioData));
                Arrays.fill(bytes, (byte) 0);
                status = 1;
            }
        }catch (Exception e){
            e.printStackTrace();
        }
        //发送重置（打断）协议，用来打断正在播报的内容，打断后无法续播
//        avatarWsUtil.send(buildStopRequest());

//        avatarWsUtil.close();
//        timer.cancel();
//        System.exit(0);
    }

    //启动协议
    private static JSONObject buildStartRequest() {
        JSONObject header = new JSONObject()
                .fluentPut("app_id", appId)
                .fluentPut("ctrl", "start")//控制参数
                .fluentPut("request_id", UUID.randomUUID().toString())
                .fluentPut("scene_id","77213753883627520");//请到交互平台-接口服务中获取，传入“接口服务ID”

        JSONObject parameter = new JSONObject()
                .fluentPut("avatar", new JSONObject()
                        .fluentPut("avatar_id", avatarId)// （必传）授权的形象资源id，请到交互平台-接口服务-形象列表中获取
                        .fluentPut("width",720)// 视频分辨率：宽
                        .fluentPut("height",1280)// 视频分辨率：高
                        .fluentPut("stream", new JSONObject()
                                .fluentPut("protocol", "xrtc")//（必传）视频协议，支持rtmp，xrtc、webrtc、flv，目前只有xrtc支持透明背景，需配合alpha参数传1
                                .fluentPut("fps",25)// （非必传）视频刷新率,值越大，越流畅，取值范围0-25，默认25即可
                                .fluentPut("bitrate",5000)//（非必传）视频码率，值越大，越清晰，对网络要求越高
                                .fluentPut("alpha",0)))//（非必传）透明背景，需配合protocol=xrtc，0关闭，1开启
                .fluentPut("tts",new JSONObject()
                        .fluentPut("speed",50)// 语速：[0,100]，默认50
                        .fluentPut("vcn",VCN))//（必传）授权的声音资源id，请到交互平台-接口服务-声音列表中获取
                .fluentPut("subtitle",new JSONObject()//注意：由于是云端发送的字幕，因此无法获取虚拟人具体读到哪个字了，也无法暂停和续播
                        .fluentPut("subtitle",0)//0关闭，1开启
                        .fluentPut("font_color","#FF0000")//字体颜色
                        .fluentPut("font_size",10)//字体大小，取值范围：1-10
                        .fluentPut("position_x",0)//字幕左右移动，必须配合width、height一起传
                        .fluentPut("position_y",0)//字幕上下移动，必须配合width、height一起传
                        .fluentPut("font_name","mainTitle")//字体样式，目前有以下字体：
//'Sanji.Suxian.Simple','Honglei.Runninghand.Sim','Hunyuan.Gothic.Bold',
//'Huayuan.Gothic.Regular','mainTitle'
                        .fluentPut("width",100)//字幕宽
                        .fluentPut("height",100));//字幕高

        JSONObject payload = new JSONObject()
                .fluentPut("background", new JSONObject()
                        .fluentPut("data", "22SLM2teIw+aqR6Xsm2JbH6Ng310kDam2NiCY/RQ9n6dw47gMO+7gGUJfWWfkqD39k/jtk/Fvh2qUdAMg95LKXJdf+GT2P87IVSiPrS4CQe/" +
                                "8M0oZzXUOpsQDliaYLHx6CR8se7TmCPOIdKE/isWXd5V7yz7RVQZt9tyHB564SChy6qUAOD2Akp2kSXtbEBT3uWRW2Xo+srd7tCGKD+aahzcQGVP6WZJ7X9" +
                                "piPt1BXRR39jVpxn9Dtxxvnsd/BBwZpJ/q5B1pOKms80DFg6vCBJHXqZ48LLVBbFoapH74cAHNg8qrXWoLfLFUejMiIwNEBJ4JJ4nuBiDExkuOUlLN19jw8" +
                                "abGUJarzfK26OSpfY="));//传图片的res_key，res_key值请去交互平台-素材管理-背景中上传图片获取
        return new JSONObject().fluentPut("header",header).fluentPut("parameter",parameter).fluentPut("payload",payload);
//        return new JSONObject().fluentPut("header",header).fluentPut("parameter",parameter);
    }

//文本驱动协议
    private static JSONObject buildTextRequest(String text) {
        JSONObject header = new JSONObject()
                .fluentPut("app_id",appId)
                .fluentPut("ctrl","text_driver")
                .fluentPut("request_id", UUID.randomUUID().toString());

        JSONObject parameter = new JSONObject()
                .fluentPut("avatar_dispatch",new JSONObject()
                        .fluentPut("interactive_mode",0))
                .fluentPut("tts",new JSONObject()
                        .fluentPut("vcn",VCN)//合成发音人
                        .fluentPut("speed",50)
                        .fluentPut("pitch",50)
                        .fluentPut("volume",50))
                .fluentPut("air",new JSONObject()
                        .fluentPut("air",1)//是否开启自动动作，0关闭/1开启，自动动作只有开启交互走到大模型时才生效
                        //星火大模型会根据语境自动插入动作，且必须是支持动作的形象
                        .fluentPut("add_nonsemantic",1));//是否开启无指向性动作，0关闭，1开启（需配合nlp=true时生效)，虚拟人会做没有意图指向性的动作

        JSONObject payload = new JSONObject()
                .fluentPut("text",new JSONObject()
                        .fluentPut("content",text));
        return new JSONObject().fluentPut("header",header).fluentPut("parameter",parameter).fluentPut("payload",payload);
    }


//心跳，保活协议
    private static JSONObject buildPingRequest() {
        JSONObject header = new JSONObject()
                .fluentPut("app_id",appId)
                .fluentPut("ctrl","ping")
                .fluentPut("request_id", UUID.randomUUID().toString());
        return new JSONObject().fluentPut("header",header);
    }
//文本交互协议
    private static JSONObject buildTextinteractRequest(String text){
        JSONObject header = new JSONObject()
                .fluentPut("app_id",appId)
                .fluentPut("ctrl","text_interact")
                .fluentPut("request_id",UUID.randomUUID().toString());

        JSONObject parameter = new JSONObject()
                .fluentPut("tts",new JSONObject()
                        .fluentPut("vcn",VCN)
                        .fluentPut("speed",50)
                        .fluentPut("pitch",50)
                        .fluentPut("audio",new JSONObject()
                                .fluentPut("sample_rate",16000)))
                .fluentPut("air",new JSONObject()
                        .fluentPut("air",1)//是否开启自动动作，0关闭/1开启，自动动作只有开启交互走到大模型时才生效
                        //星火大模型会根据语境自动插入动作，且必须是支持动作的形象
                        .fluentPut("add_nonsemantic",1));//是否开启无指向性动作，0关闭，1开启（需配合nlp=true时生效)，虚拟人会做没有意图指向性的动作

        JSONObject payload = new JSONObject()
                .fluentPut("text",new JSONObject()
                        .fluentPut("content",text));
        return new JSONObject().fluentPut("header",header).fluentPut("parameter",parameter).fluentPut("payload",payload);
    }

    //音频驱动协议
    private static JSONObject buildAudioRequest(String requestid,int status,String content ) throws IOException {
        JSONObject header = new JSONObject()
                .fluentPut("app_id",appId)
                .fluentPut("ctrl","audio_driver")
                .fluentPut("request_id",requestid);
        JSONObject parameter = new JSONObject()
                .fluentPut("avatar_dispatch",new JSONObject()
                        .fluentPut("audio_mode",0));
        JSONObject payload = new JSONObject()
                .fluentPut("audio",new JSONObject()
//                        .fluentPut("encoding","pcm")
//                        .fluentPut("sample_rate",16000)
//                        .fluentPut("channels",1)
//                        .fluentPut("bit_depth",16)//音频采样位深
                        .fluentPut("status",status)//数据状态
//                        .fluentPut("seq",1)//数据序号
                        .fluentPut("audio",content));
//                        .fluentPut("frame_size",0));//帧大小

        return new JSONObject().fluentPut("header",header).fluentPut("parameter",parameter).fluentPut("payload",payload);
    }



    //音频交互协议
    private static JSONObject buildAudioInteractRequest(int status,String str) throws IOException {
        JSONObject header = new JSONObject()
                .fluentPut("app_id",appId)
                .fluentPut("ctrl","audio_interact")
                .fluentPut("request_id",UUID.randomUUID().toString());
        JSONObject parameter = new JSONObject()
                .fluentPut("avatar_dispatch",new JSONObject()
                        .fluentPut("full_duplex",0));
        JSONObject payload = new JSONObject()
                .fluentPut("audio",new JSONObject()
                        .fluentPut("encoding","raw")
                        .fluentPut("sample_rate",16000)
                        .fluentPut("channels",1)
                        .fluentPut("bit_depth",16)
                        .fluentPut("status",status)
                        .fluentPut("seq",1)
                        .fluentPut("audio",str)
                        .fluentPut("frame_size",0)
                );
        return new JSONObject().fluentPut("header",header).fluentPut("parameter",parameter).fluentPut("payload",payload);
    }

    //单独指令协议
    private static JSONObject buildCmdRequest(String dongzuo){
        JSONObject header = new JSONObject()
                .fluentPut("app_id",appId)
                .fluentPut("ctrl","cmd")
                .fluentPut("request_id",UUID.randomUUID().toString());
        JSONObject payload = new JSONObject()
                .fluentPut("cmd_text",new JSONObject()
                        .fluentPut("avatar",new JSONObject()
                                .fluentPut("type","action")
                                .fluentPut("value","A_RLH_puzzle_0")));
        return new JSONObject().fluentPut("header",header).fluentPut("payload",payload);
    }

    //重置（打断）协议
    private static JSONObject buildResetRequest(){
        JSONObject header = new JSONObject()
                .fluentPut("app_id",appId)
                .fluentPut("ctrl","reset")
                .fluentPut("request_id",UUID.randomUUID().toString());
        return new JSONObject().fluentPut("header",header);
    }
    //stop停止协议
    private static JSONObject buildStopRequest(){
        JSONObject header = new JSONObject()
                .fluentPut("app_id",appId)
                .fluentPut("ctrl","stop")
                .fluentPut("request_id",UUID.randomUUID().toString());
        return new JSONObject().fluentPut("header",header);
    }
}
