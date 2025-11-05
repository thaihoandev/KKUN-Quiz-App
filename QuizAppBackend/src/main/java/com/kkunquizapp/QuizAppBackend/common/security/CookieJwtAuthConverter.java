package com.kkunquizapp.QuizAppBackend.common.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;

import java.util.Arrays;

public class CookieJwtAuthConverter implements BearerTokenResolver {

    @Override
    public String resolve(HttpServletRequest request) {
        if (request.getCookies() == null) return null;

        return Arrays.stream(request.getCookies())
                .filter(c -> "accessToken".equals(c.getName()))
                .findFirst()
                .map(Cookie::getValue)
                .orElse(null);
    }
}
