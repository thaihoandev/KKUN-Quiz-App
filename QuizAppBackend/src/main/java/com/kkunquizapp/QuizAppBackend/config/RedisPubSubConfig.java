import com.kkunquizapp.QuizAppBackend.config.RedisSubscriber;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

@Configuration
@RequiredArgsConstructor
public class RedisPubSubConfig {
    private final RedisConnectionFactory connectionFactory;
    private final RedisSubscriber subscriber;

    @Bean
    public MessageListenerAdapter redisListenerAdapter(RedisSubscriber subscriber) {
        // phương thức "handleMessage" phải trùng tên với method của bạn
        return new MessageListenerAdapter(subscriber, "handleMessage");
    }

    @Bean
    public RedisMessageListenerContainer redisContainer() {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        // Lắng nghe kênh pattern game:*:players
        container.addMessageListener(
                new MessageListenerAdapter(subscriber, "handleMessage"),
                new PatternTopic("game:*:players")
        );
        return container;
    }
}