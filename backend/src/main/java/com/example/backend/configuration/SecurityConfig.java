package com.example.backend.configuration;

import com.example.backend.exceptions.CustomAccessDeniedHandler;
import com.example.backend.exceptions.CustomAuthenticationEntryPoint;
import com.example.backend.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomAuthenticationEntryPoint customEntryPoint;
    private final CustomAccessDeniedHandler customAccessDeniedHandler;
    private final List<String> allowedOrigins;
    private final boolean docsPublic;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            CustomAuthenticationEntryPoint customEntryPoint,
            CustomAccessDeniedHandler customAccessDeniedHandler,
            @Value("#{'${app.cors.allowed-origins}'.split(',')}") List<String> allowedOrigins,
            // The API description (Swagger UI, /v3/api-docs) is a map of every endpoint, so it is only open to anonymous
            // visitors when this is switched on explicitly (the dev profile does). Anywhere else it needs a login.
            @Value("${app.docs.public:false}") boolean docsPublic) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.customEntryPoint = customEntryPoint;
        this.customAccessDeniedHandler = customAccessDeniedHandler;
        this.allowedOrigins = allowedOrigins;
        this.docsPublic = docsPublic;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration config = new CorsConfiguration();
                    config.setAllowedOriginPatterns(allowedOrigins);
                    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
                    config.setAllowedHeaders(List.of("*"));
                    config.setExposedHeaders(List.of("X-Total-Count", "X-Page", "X-Page-Size", "Retry-After"));
                    config.setAllowCredentials(true);
                    return config;
                }))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> {
                    // Must come before the permitAll below: first matching rule wins
                    auth.requestMatchers("/api/auth/change-password").authenticated();
                    auth.requestMatchers(
                            "/api/auth/**",
                            "/api/matching/search/**",
                            "/api/profile/skills/search",
                            "/api/profile/picture/**").permitAll();
                    if (docsPublic) {
                        auth.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll();
                    }
                    auth.anyRequest().authenticated();
                })
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(customEntryPoint)
                        .accessDeniedHandler(customAccessDeniedHandler))
                .httpBasic(AbstractHttpConfigurer::disable)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
