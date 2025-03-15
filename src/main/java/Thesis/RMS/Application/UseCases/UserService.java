package Thesis.RMS.Application.UseCases;

import Thesis.RMS.Application.DTO.ChangePasswordRequest;
import Thesis.RMS.Application.DTO.UserDTO;
import Thesis.RMS.Domain.Model.User;
import Thesis.RMS.Domain.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ResponseEntity<String> registerUser(UserDTO userDTO) {
        if (userRepository.findByUsername(userDTO.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username is already taken.");
        }

        User newUser = new User();
        newUser.setUsername(userDTO.getUsername());
        newUser.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        newUser.setRoles(Collections.singleton("USER")); // Default role

        userRepository.save(newUser);
        return ResponseEntity.ok("User registered successfully.");
    }

    public ResponseEntity<String> changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Old password is incorrect.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.ok("Password changed successfully.");
    }
}
