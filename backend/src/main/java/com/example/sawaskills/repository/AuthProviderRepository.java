package com.example.sawaskills.repository;

import com.example.sawaskills.entity.AuthProvider;
import com.example.sawaskills.entity.AuthenticationProvider;
import com.example.sawaskills.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuthProviderRepository extends JpaRepository<AuthProvider, Long> {

    Optional<AuthProvider> findByProviderAndProviderUserId(AuthenticationProvider provider, String providerUserId);

    Optional<AuthProvider> findByUserAndProvider(User user, AuthenticationProvider provider);
}
