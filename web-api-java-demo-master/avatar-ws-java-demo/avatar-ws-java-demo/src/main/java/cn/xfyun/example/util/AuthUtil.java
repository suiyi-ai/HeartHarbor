package cn.xfyun.example.util;

import com.alibaba.fastjson2.JSONObject;
import lombok.Data;
import okhttp3.RequestBody;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.*;
//import org.example.utils.OkHttp3Utils;

public class AuthUtil {

    public static String assembleRequestUrl(String requestUrl, String apiKey, String apiSecret) {
        return assembleRequestUrl(requestUrl, apiKey, apiSecret, "GET");
    }

    public static String assembleRequestUrl(String requestUrl, String apiKey, String apiSecret, String method) {
        URL url = null;
        //转换WebSocket的URL，ws转为http，wss转为https
        String httpRequestUrl = requestUrl.replace("ws://", "http://").replace("wss://", "https://");
        try {
            url = new URL(httpRequestUrl);
            //设置时间格式并设置UTC时区
            SimpleDateFormat format = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss z", Locale.US);
            format.setTimeZone(TimeZone.getTimeZone("UTC"));
            String date = format.format(new Date());
            String host = url.getHost();
            System.out.println("host:"+host);
            //构建签名字符串
            StringBuilder builder = new StringBuilder("host: ").append(host).append("\n").//
                    append("date: ").append(date).append("\n").//
                    append(method).append(" ").append(url.getPath()).append(" HTTP/1.1");

            System.out.println(builder.toString());
            System.out.println("--------------");
            Charset charset = Charset.forName("UTF-8");
            //生成 HMAC SHA-256 签名：
            Mac mac = Mac.getInstance("hmacsha256");
            SecretKeySpec spec = new SecretKeySpec(apiSecret.getBytes(charset), "hmacsha256");
            mac.init(spec);
            byte[] hexDigits = mac.doFinal(builder.toString().getBytes(charset));
            String sha = Base64.getEncoder().encodeToString(hexDigits);
            //生产授权头信息，将授权信息编码为 Base64，并构建最终的请求 URL。
            String authorization = String.format("hmac username=\"%s\", algorithm=\"%s\", headers=\"%s\", signature=\"%s\"", apiKey, "hmac-sha256", "host date request-line", sha);
            String authBase = Base64.getEncoder().encodeToString(authorization.getBytes(charset));
            System.out.println("signature:"+sha);
            System.out.println("----------------------------");
            System.out.println("authorization:"+authorization);
            System.out.println("--------------------");
            System.out.println("authBase:"+authBase);
            return String.format("%s?authorization=%s&host=%s&date=%s", requestUrl, URLEncoder.encode(authBase), URLEncoder.encode(host), URLEncoder.encode(date));
        } catch (Exception e) {
            throw new RuntimeException("assemble requestUrl error:" + e.getMessage());
        }
    }

    /**
     * 计算签名所需要的header参数 （http 接口）
     * @param requestUrl like 'http://rest-api.xfyun.cn/v2/iat'
     * @param apiKey
     * @param apiSecret
     * @method request method  POST/GET/PATCH/DELETE etc....
     * @param body   http request body
     * @return header map ，contains all headers should be set when access api
     */
    public static Map<String ,String> assembleRequestHeader(String requestUrl, String apiKey, String apiSecret, String method, byte[] body){
        URL url = null;
        try {
            url = new URL(requestUrl);
            // 获取日期
            SimpleDateFormat format = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss z", Locale.US);
            format.setTimeZone(TimeZone.getTimeZone("UTC"));
            String date = format.format(new Date());
            //计算body 摘要(SHA256)
            MessageDigest instance = MessageDigest.getInstance("SHA-256");
            instance.update(body);
            String  digest = "SHA256="+ Base64.getEncoder().encodeToString(instance.digest());
            //date = "Thu, 19 Dec 2024 07:47:57 GMT";
            String host = url.getHost();
            int port = url.getPort(); // port >0 说明url 中带有port
            if (port > 0){
                host = host +":"+port;
            }
            String  path = url.getPath();
            if ("".equals(path) || path == null){
                path = "/";
            }
            //构建签名计算所需参数
            StringBuilder builder = new StringBuilder().
                    append("host: ").append(host).append("\n").//
                            append("date: ").append(date).append("\n").//
                            append(method).append(" ").append(path).append(" HTTP/1.1").append("\n").
                    append("digest: ").append(digest);
            System.out.println("builder:"+builder);
            Charset charset = Charset.forName("UTF-8");

            //使用hmac-sha256计算签名
            Mac mac = Mac.getInstance("hmacsha256");
            //System.out.println(builder.toString());
            SecretKeySpec spec = new SecretKeySpec(apiSecret.getBytes(charset), "hmacsha256");
            mac.init(spec);
            byte[] hexDigits = mac.doFinal(builder.toString().getBytes(charset));
            String sha = Base64.getEncoder().encodeToString(hexDigits);
            // 构建header
            String authorization = String.format("hmac-auth api_key=\"%s\", algorithm=\"%s\", headers=\"%s\", signature=\"%s\"", apiKey, "hmac-sha256", "host date request-line digest", sha);
            Map<String,String > header = new HashMap<String ,String>();
            System.out.println();

            header.put("authorization",authorization);
            header.put("host",host);
            header.put("date",date);
            header.put("digest",digest);
            System.out.println("header " + header.toString());
            return header;
        } catch (Exception e) {
            throw new RuntimeException("assemble requestHeader  error:"+e.getMessage());
        }
    }

//    public String getToken() throws IOException {
//        String url = "";
//        String appid = "";
//        String secretKey = "";
//        ReqToken rt = new ReqToken();
//        rt.model = "remote";
//        Base base = new Base();
//        base.appid = appid;
//        base.version = "v1";
//        base.timestamp = System.currentTimeMillis()+"";
//        rt.base = base;
//        String rtJson = JSONObject.toJSONString(rt);
//        RequestBody body = RequestBody.create(OkHttp3Utils.JSON, rtJson);
//        Map<String, String> headers = new HashMap<String, String>();
//        headers.put("Content-Type","application/json");
//        headers.put("Authorization",getSign(secretKey,base.timestamp,rtJson.getBytes()));
//        System.out.println("url:"+url+"|body:"+body+"|headers:"+headers);
//        String res = OkHttp3Utils._post(url,body,headers);
//        ResToken resToken = JSONObject.parseObject(res,ResToken.class);
//        if (resToken.retcode.equals("000000")){
//            return resToken.accesstoken;
//        }
//        return "";
//    }


}

//@Data
//class Base{
//    String appid;
//    String version;
//    String timestamp;
//}
//@Data
//class ReqToken {
//    Base  base;
//    String model;
//}
//@Data
//class ResToken {
//    String accesstoken;
//    String expiresin;
//    String retcode;
//}
//
