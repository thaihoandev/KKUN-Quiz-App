package com.kkunquizapp.QuizAppBackend.common.security;

import com.kkunquizapp.QuizAppBackend.user.model.UserPrincipal;
import com.kkunquizapp.QuizAppBackend.user.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.stereotype.Component;

import java.util.Collection;

@Component
@RequiredArgsConstructor
public class JwtToUserPrincipalConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final CustomUserDetailsService userDetailsService;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        JwtGrantedAuthoritiesConverter rolesConverter = new JwtGrantedAuthoritiesConverter();
        rolesConverter.setAuthoritiesClaimName("roles");
        rolesConverter.setAuthorityPrefix("");

        String username = jwt.getClaimAsString("sub");
        UserPrincipal userDetails = (UserPrincipal) userDetailsService.loadUserByUsername(username);
        Collection<GrantedAuthority> authorities = rolesConverter.convert(jwt);

        return new JwtAuthenticationToken(jwt, authorities, username) {
            @Override
            public Object getPrincipal() {
                return userDetails;
            }
        };
    }
}
