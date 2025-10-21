package com.kkunquizapp.QuizAppBackend.common.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Configuration
public class WebClientConfig {

    @Value("${limits.http.connect-timeout-ms:10000}")
    private int connectTimeoutMs;

    @Value("${limits.http.read-timeout-ms:100000}")
    private int readTimeoutMs;

    @Value("${limits.http.write-timeout-ms:100000}")
    private int writeTimeoutMs;

    @Value("${limits.http.max-in-memory-size:8388608}") // default 8MB
    private int maxInMemorySize;

    @Bean
    public WebClient geminiWebClient() {
        // cấu hình codec để đọc response lớn (vd JSON quiz dài)
        var strategies = ExchangeStrategies.builder()
                .codecs(c -> c.defaultCodecs().maxInMemorySize(maxInMemorySize))
                .build();

        // cấu hình HttpClient với timeout
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, connectTimeoutMs)
                .responseTimeout(Duration.ofMillis(readTimeoutMs))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(readTimeoutMs, TimeUnit.MILLISECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(writeTimeoutMs, TimeUnit.MILLISECONDS)));

        return WebClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .exchangeStrategies(strategies)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }
}
