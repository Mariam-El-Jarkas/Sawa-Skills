package com.example.sawaskills.security;

import com.example.sawaskills.entity.AuthProvider;
import com.example.sawaskills.entity.AuthenticationProvider;
import com.example.sawaskills.entity.User;
import com.example.sawaskills.repository.AuthProviderRepository;
import com.example.sawaskills.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final AuthProviderRepository authProviderRepository;

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found"));

        String password = authProviderRepository.findByUserAndProvider(user, AuthenticationProvider.LOCAL)
                .map(AuthProvider::getPasswordHash)
                .orElse("SOCIAL_LOGIN"); // Placeholder for social-only accounts

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                password,
                Collections.emptyList()
        );
    }
}