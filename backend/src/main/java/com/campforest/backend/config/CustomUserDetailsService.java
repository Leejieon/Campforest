package com.campforest.backend.config;

import java.util.Collections;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.campforest.backend.user.model.Users;
import com.campforest.backend.user.repository.jpa.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

	private final UserRepository userRepository;

	@Override
	public UserDetails loadUserByUsername(String userEmail) throws UsernameNotFoundException {
		Users users = userRepository.findByEmail(userEmail).orElseThrow(() ->
			new UsernameNotFoundException("User not found with userEmail: " + userEmail));

		List<GrantedAuthority> authorities = Collections.singletonList(
			new SimpleGrantedAuthority(users.getRole().toString()));

		return new User(users.getEmail(), users.getPassword(), authorities);
	}
}
